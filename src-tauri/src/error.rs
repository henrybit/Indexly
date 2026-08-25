use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    Message(String),
}

impl AppError {
    pub fn msg(message: impl Into<String>) -> Self {
        Self::Message(message.into())
    }

    pub fn from_status(status: u16, body: &str) -> Self {
        let reason = parse_es_reason(body);
        let hint = match status {
            401 => "认证失败，请检查用户名和密码",
            403 => "权限不足，当前账号无法执行该操作",
            404 => "目标不存在",
            405 => "当前集群不支持该请求",
            _ => "Elasticsearch 返回错误",
        };

        match reason {
            Some(reason) => Self::msg(format!("{hint}（HTTP {status}）：{reason}")),
            None => Self::msg(format!("{hint}（HTTP {status}）")),
        }
    }

    pub fn from_reqwest(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            return Self::msg("连接超时，请检查地址、端口和网络");
        }
        if err.is_connect() {
            return Self::msg("无法连接到 Elasticsearch，请检查地址、端口和 SSL 设置");
        }
        if err.is_request() {
            return Self::msg(format!("请求失败：{err}"));
        }
        Self::msg(format!("网络错误：{err}"))
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

fn parse_es_reason(body: &str) -> Option<String> {
    let value: serde_json::Value = serde_json::from_str(body).ok()?;
    value
        .get("error")
        .and_then(|error| error.get("reason"))
        .and_then(|reason| reason.as_str())
        .map(|reason| reason.to_string())
        .or_else(|| {
            value
                .get("error")
                .and_then(|error| error.as_str())
                .map(|reason| reason.to_string())
        })
}
