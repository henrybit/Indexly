pub mod connection;
pub mod indices;
pub mod ttl;

use tokio::sync::Mutex;

use crate::error::AppError;
use crate::es::EsClient;

pub struct AppState {
    client: Mutex<Option<EsClient>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            client: Mutex::new(None),
        }
    }

    pub async fn set_session(&self, client: EsClient) {
        *self.client.lock().await = Some(client);
    }

    pub async fn clear_session(&self) {
        *self.client.lock().await = None;
    }

    pub async fn require_client(&self) -> Result<EsClient, AppError> {
        self.client
            .lock()
            .await
            .clone()
            .ok_or_else(|| AppError::msg("尚未连接到 Elasticsearch"))
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
