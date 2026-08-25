use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionConfig {
    pub host: String,
    pub port: u16,
    pub use_ssl: bool,
    pub skip_ssl_verify: bool,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClusterInfo {
    pub name: String,
    pub cluster_name: String,
    pub version: String,
    pub major_version: u32,
    pub compatible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexInfo {
    pub name: String,
    pub health: String,
    pub status: String,
    pub uuid: String,
    pub primary_shards: String,
    pub replica_shards: String,
    pub docs_count: u64,
    pub docs_deleted: u64,
    pub store_bytes: u64,
    pub creation_date: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFailure {
    pub index: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteResult {
    pub deleted: Vec<String>,
    pub failed: Vec<DeleteFailure>,
}

#[derive(Debug, Deserialize)]
pub struct RootResponse {
    pub name: String,
    pub cluster_name: String,
    pub version: RootVersion,
}

#[derive(Debug, Deserialize)]
pub struct RootVersion {
    pub number: String,
}

#[derive(Debug, Deserialize)]
pub struct CatIndexRow {
    pub health: Option<String>,
    pub status: Option<String>,
    pub index: Option<String>,
    pub uuid: Option<String>,
    #[serde(rename = "pri")]
    pub pri: Option<String>,
    #[serde(rename = "rep")]
    pub rep: Option<String>,
    #[serde(rename = "docs.count")]
    pub docs_count: Option<String>,
    #[serde(rename = "docs.deleted")]
    pub docs_deleted: Option<String>,
    #[serde(rename = "store.size")]
    pub store_size: Option<String>,
    #[serde(rename = "creation.date")]
    pub creation_date: Option<String>,
}

impl From<CatIndexRow> for Option<IndexInfo> {
    fn from(row: CatIndexRow) -> Self {
        let name = row.index?.trim().to_string();
        if name.is_empty() {
            return None;
        }

        Some(IndexInfo {
            name,
            health: row.health.unwrap_or_else(|| "unknown".into()),
            status: row.status.unwrap_or_else(|| "unknown".into()),
            uuid: row.uuid.unwrap_or_default(),
            primary_shards: row.pri.unwrap_or_else(|| "-".into()),
            replica_shards: row.rep.unwrap_or_else(|| "-".into()),
            docs_count: parse_u64(row.docs_count.as_deref()),
            docs_deleted: parse_u64(row.docs_deleted.as_deref()),
            store_bytes: parse_u64(row.store_size.as_deref()),
            creation_date: parse_u64(row.creation_date.as_deref()),
        })
    }
}

fn parse_u64(value: Option<&str>) -> u64 {
    value
        .unwrap_or("0")
        .replace(',', "")
        .parse::<u64>()
        .unwrap_or(0)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TtlRule {
    pub id: String,
    pub name: String,
    pub pattern: String,
    pub ttl_value: u64,
    pub ttl_unit: String,
    pub enabled: bool,
    pub skip_system: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TtlMatch {
    pub index: String,
    pub rule_id: String,
    pub rule_name: String,
    pub pattern: String,
    pub creation_date: u64,
    pub age_ms: u64,
    pub ttl_ms: u64,
    pub expired: bool,
    pub store_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TtlPreview {
    pub matches: Vec<TtlMatch>,
    pub expired_count: usize,
}

impl ConnectionConfig {
    pub fn base_url(&self) -> Result<String, String> {
        let host = self.host.trim();
        if host.is_empty() {
            return Err("主机地址不能为空".into());
        }
        if host.contains("://") || host.contains('/') || host.contains('\\') {
            return Err("主机地址只需填写域名或 IP，不要包含协议和路径".into());
        }
        if self.port == 0 {
            return Err("端口号无效".into());
        }

        let scheme = if self.use_ssl { "https" } else { "http" };
        Ok(format!("{scheme}://{host}:{}", self.port))
    }
}
