use std::time::Duration;

use reqwest::{Client, Method, StatusCode};

use crate::error::AppError;
use crate::es::ttl::{now_ms, parse_creation_dates, preview_ttl, unique_expired_names};
use crate::es::types::{
    CatIndexRow, ClusterInfo, ConnectionConfig, DeleteFailure, DeleteResult, IndexInfo, TtlPreview,
    TtlRule, RootResponse,
};

const REQUEST_TIMEOUT: Duration = Duration::from_secs(20);
const CAT_INDICES_QS: &str = "format=json&bytes=b&h=health,status,index,uuid,pri,rep,docs.count,docs.deleted,store.size,creation.date&s=index:asc&expand_wildcards=all";

#[derive(Clone)]
pub struct EsClient {
    http: Client,
    base_url: String,
    username: String,
    password: String,
}

impl EsClient {
    pub fn new(config: &ConnectionConfig) -> Result<Self, AppError> {
        let base_url = config.base_url().map_err(AppError::msg)?;
        let http = Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .danger_accept_invalid_certs(config.skip_ssl_verify)
            .user_agent("Indexly/0.1")
            .build()
            .map_err(|err| AppError::msg(format!("创建 HTTP 客户端失败：{err}")))?;

        Ok(Self {
            http,
            base_url,
            username: config.username.trim().to_string(),
            password: config.password.clone(),
        })
    }

    pub async fn ping(&self) -> Result<ClusterInfo, AppError> {
        let body = self.send(Method::GET, "/", None).await?;
        let root: RootResponse = serde_json::from_str(&body)
            .map_err(|_| AppError::msg("无法解析集群信息，目标可能不是 Elasticsearch"))?;

        let major_version = root
            .version
            .number
            .split('.')
            .next()
            .and_then(|part| part.parse::<u32>().ok())
            .unwrap_or(0);

        Ok(ClusterInfo {
            name: root.name,
            cluster_name: root.cluster_name,
            version: root.version.number,
            major_version,
            compatible: major_version == 7 || major_version == 8,
        })
    }

    pub async fn search_indices(&self, query: Option<&str>) -> Result<Vec<IndexInfo>, AppError> {
        let path = match normalize_search_pattern(query) {
            Some(pattern) => format!(
                "/_cat/indices/{}?{CAT_INDICES_QS}",
                encode_path_segment(&pattern)
            ),
            None => format!("/_cat/indices?{CAT_INDICES_QS}"),
        };

        let (status, body) = self.send_raw(Method::GET, &path, None).await?;
        if status == StatusCode::NOT_FOUND {
            return Ok(Vec::new());
        }
        if !status.is_success() {
            return Err(AppError::from_status(status.as_u16(), &body));
        }

        let rows: Vec<CatIndexRow> = serde_json::from_str(&body)
            .map_err(|_| AppError::msg("无法解析索引列表，请确认集群版本为 Elasticsearch 7/8"))?;

        Ok(rows.into_iter().filter_map(Into::into).collect())
    }

    pub async fn preview_expiration(&self, rules: Vec<TtlRule>) -> Result<TtlPreview, AppError> {
        let indices = self.indices_with_creation_dates().await?;
        preview_ttl(&indices, &rules, now_ms())
    }

    pub async fn apply_expiration(&self, rules: Vec<TtlRule>) -> Result<DeleteResult, AppError> {
        let preview = self.preview_expiration(rules).await?;
        let names = unique_expired_names(&preview.matches);
        if names.is_empty() {
            return Ok(DeleteResult {
                deleted: Vec::new(),
                failed: Vec::new(),
            });
        }
        self.delete_indices(&names).await
    }

    async fn indices_with_creation_dates(&self) -> Result<Vec<IndexInfo>, AppError> {
        let mut indices = self.search_indices(None).await?;
        if !indices.iter().any(|index| index.creation_date == 0) {
            return Ok(indices);
        }

        if let Ok(dates) = self.fetch_creation_dates().await {
            for index in &mut indices {
                if index.creation_date == 0 {
                    if let Some(date) = dates.get(&index.name) {
                        index.creation_date = *date;
                    }
                }
            }
        }
        Ok(indices)
    }

    async fn fetch_creation_dates(&self) -> Result<std::collections::HashMap<String, u64>, AppError> {
        let body = self
            .send(
                Method::GET,
                "/_all/_settings/index.creation_date?expand_wildcards=open,closed,hidden",
                None,
            )
            .await?;
        Ok(parse_creation_dates(&body))
    }

    pub async fn delete_indices(&self, names: &[String]) -> Result<DeleteResult, AppError> {
        if names.is_empty() {
            return Err(AppError::msg("请选择要删除的索引"));
        }

        let mut deleted = Vec::new();
        let mut failed = Vec::new();

        for name in names {
            match validate_index_name(name) {
                Ok(safe_name) => match self.delete_index(&safe_name).await {
                    Ok(()) => deleted.push(safe_name),
                    Err(err) => failed.push(DeleteFailure {
                        index: safe_name,
                        message: err.to_string(),
                    }),
                },
                Err(err) => failed.push(DeleteFailure {
                    index: name.clone(),
                    message: err.to_string(),
                }),
            }
        }

        Ok(DeleteResult { deleted, failed })
    }

    async fn delete_index(&self, name: &str) -> Result<(), AppError> {
        let path = format!("/{}", encode_path_segment(name));
        self.send(Method::DELETE, &path, None).await?;
        Ok(())
    }

    async fn send(
        &self,
        method: Method,
        path: &str,
        body: Option<String>,
    ) -> Result<String, AppError> {
        let (status, text) = self.send_raw(method, path, body).await?;
        if status.is_success() {
            return Ok(text);
        }
        Err(AppError::from_status(status.as_u16(), &text))
    }

    async fn send_raw(
        &self,
        method: Method,
        path: &str,
        body: Option<String>,
    ) -> Result<(StatusCode, String), AppError> {
        let url = format!("{}{path}", self.base_url);
        let mut request = self
            .http
            .request(method, &url)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json");

        if !self.username.is_empty() {
            request = request.basic_auth(&self.username, Some(&self.password));
        }

        if let Some(payload) = body {
            request = request.body(payload);
        }

        let response = request.send().await.map_err(AppError::from_reqwest)?;
        let status = response.status();
        let text = response
            .text()
            .await
            .map_err(|err| AppError::msg(format!("读取响应失败：{err}")))?;
        Ok((status, text))
    }
}

pub fn normalize_search_pattern(query: Option<&str>) -> Option<String> {
    let trimmed = query.map(str::trim).filter(|value| !value.is_empty())?;
    if trimmed.contains('*') || trimmed.contains('?') {
        return Some(trimmed.to_string());
    }
    Some(format!("*{trimmed}*"))
}

pub fn validate_index_name(name: &str) -> Result<String, AppError> {
    let name = name.trim();
    if name.is_empty() {
        return Err(AppError::msg("索引名称不能为空"));
    }
    if name == "*" || name == "_all" || name.contains(',') {
        return Err(AppError::msg("禁止使用通配符或逗号批量删除全部索引"));
    }
    if name.contains("..")
        || name.contains('/')
        || name.contains('\\')
        || name.contains(' ')
        || name.contains('<')
        || name.contains('>')
        || name.contains('|')
        || name.contains('"')
    {
        return Err(AppError::msg(format!("非法的索引名称：{name}")));
    }
    Ok(name.to_string())
}

fn encode_path_segment(value: &str) -> String {
    urlencoding::encode(value).into_owned()
}

#[cfg(test)]
mod tests {
    use super::{normalize_search_pattern, validate_index_name};

    #[test]
    fn wraps_plain_query_with_wildcards() {
        assert_eq!(
            normalize_search_pattern(Some("logs")),
            Some("*logs*".into())
        );
    }

    #[test]
    fn keeps_explicit_wildcards() {
        assert_eq!(
            normalize_search_pattern(Some("app-*")),
            Some("app-*".into())
        );
    }

    #[test]
    fn rejects_dangerous_delete_targets() {
        assert!(validate_index_name("*").is_err());
        assert!(validate_index_name("_all").is_err());
        assert!(validate_index_name("../secret").is_err());
        assert!(validate_index_name("ok-index").is_ok());
    }
}
