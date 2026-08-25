use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

use regex::Regex;
use serde_json::Value;

use crate::error::AppError;
use crate::es::types::{IndexInfo, TtlMatch, TtlPreview, TtlRule};

const MS_HOUR: u64 = 3_600_000;
const MS_DAY: u64 = 86_400_000;

pub fn ttl_to_ms(value: u64, unit: &str) -> Result<u64, AppError> {
    if value == 0 {
        return Err(AppError::msg("过期时间必须大于 0"));
    }
    match unit {
        "hours" => Ok(value.saturating_mul(MS_HOUR)),
        "days" => Ok(value.saturating_mul(MS_DAY)),
        _ => Err(AppError::msg("过期时间单位仅支持 days 或 hours")),
    }
}

pub fn compile_pattern(pattern: &str) -> Result<Regex, AppError> {
    let pattern = pattern.trim();
    if pattern.is_empty() {
        return Err(AppError::msg("正则表达式不能为空"));
    }
    Regex::new(pattern).map_err(|err| AppError::msg(format!("正则无效：{err}")))
}

pub fn preview_ttl(indices: &[IndexInfo], rules: &[TtlRule], now_ms: u64) -> Result<TtlPreview, AppError> {
    let compiled = compile_rules(rules)?;
    let mut matches = Vec::new();

    for index in indices {
        for (rule, regex, ttl_ms) in &compiled {
            if rule.skip_system && index.name.starts_with('.') {
                continue;
            }
            if !regex.is_match(&index.name) {
                continue;
            }

            let age_ms = if index.creation_date == 0 || now_ms < index.creation_date {
                0
            } else {
                now_ms - index.creation_date
            };
            let expired = index.creation_date > 0 && age_ms >= *ttl_ms;

            matches.push(TtlMatch {
                index: index.name.clone(),
                rule_id: rule.id.clone(),
                rule_name: rule.name.clone(),
                pattern: rule.pattern.clone(),
                creation_date: index.creation_date,
                age_ms,
                ttl_ms: *ttl_ms,
                expired,
                store_bytes: index.store_bytes,
            });
        }
    }

    matches.sort_by(|a, b| {
        b.expired
            .cmp(&a.expired)
            .then_with(|| a.index.cmp(&b.index))
            .then_with(|| a.rule_name.cmp(&b.rule_name))
    });

    let expired_count = unique_expired_names(&matches).len();
    Ok(TtlPreview {
        matches,
        expired_count,
    })
}

pub fn unique_expired_names(matches: &[TtlMatch]) -> Vec<String> {
    let mut names = Vec::new();
    for item in matches {
        if item.expired && item.creation_date > 0 && !names.iter().any(|name| name == &item.index) {
            names.push(item.index.clone());
        }
    }
    names
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

pub fn parse_creation_dates(body: &str) -> HashMap<String, u64> {
    let Ok(value) = serde_json::from_str::<Value>(body) else {
        return HashMap::new();
    };
    let Some(map) = value.as_object() else {
        return HashMap::new();
    };

    let mut dates = HashMap::new();
    for (name, item) in map {
        let creation = item
            .pointer("/settings/index/creation_date")
            .and_then(json_u64);
        if let Some(creation) = creation {
            dates.insert(name.clone(), creation);
        }
    }
    dates
}

fn json_u64(value: &Value) -> Option<u64> {
    value
        .as_u64()
        .or_else(|| value.as_str()?.parse::<u64>().ok())
}

fn compile_rules(rules: &[TtlRule]) -> Result<Vec<(&TtlRule, Regex, u64)>, AppError> {
    let enabled: Vec<&TtlRule> = rules.iter().filter(|rule| rule.enabled).collect();
    if enabled.is_empty() {
        return Err(AppError::msg("请先启用至少一条过期规则"));
    }

    let mut compiled = Vec::new();
    for rule in enabled {
        let regex = compile_pattern(&rule.pattern)?;
        let ttl_ms = ttl_to_ms(rule.ttl_value, &rule.ttl_unit)?;
        compiled.push((rule, regex, ttl_ms));
    }
    Ok(compiled)
}

#[cfg(test)]
mod tests {
    use super::{preview_ttl, ttl_to_ms, unique_expired_names};
    use crate::es::types::{IndexInfo, TtlRule};

    fn index(name: &str, created: u64) -> IndexInfo {
        IndexInfo {
            name: name.into(),
            health: "green".into(),
            status: "open".into(),
            uuid: name.into(),
            primary_shards: "1".into(),
            replica_shards: "0".into(),
            docs_count: 1,
            docs_deleted: 0,
            store_bytes: 10,
            creation_date: created,
        }
    }

    fn rule(pattern: &str, days: u64, skip_system: bool) -> TtlRule {
        TtlRule {
            id: "r1".into(),
            name: "logs".into(),
            pattern: pattern.into(),
            ttl_value: days,
            ttl_unit: "days".into(),
            enabled: true,
            skip_system: skip_system,
        }
    }

    #[test]
    fn converts_ttl_units() {
        assert_eq!(ttl_to_ms(2, "hours").unwrap(), 7_200_000);
        assert_eq!(ttl_to_ms(1, "days").unwrap(), 86_400_000);
        assert!(ttl_to_ms(0, "days").is_err());
    }

    #[test]
    fn matches_expired_regex_indices() {
        let now = 30 * 86_400_000;
        let indices = vec![
            index("logs-old", now - 8 * 86_400_000),
            index("logs-new", now - 2 * 86_400_000),
            index("keep-me", now - 20 * 86_400_000),
            index(".logs-system", now - 20 * 86_400_000),
        ];
        let preview = preview_ttl(&indices, &[rule("^logs-.*", 7, true)], now).unwrap();
        assert_eq!(preview.matches.len(), 2);
        assert_eq!(unique_expired_names(&preview.matches), vec!["logs-old"]);
    }
}
