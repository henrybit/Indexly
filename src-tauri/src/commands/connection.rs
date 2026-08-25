use tauri::State;

use crate::commands::AppState;
use crate::error::AppError;
use crate::es::{ClusterInfo, ConnectionConfig, EsClient};

#[tauri::command]
pub async fn connect(
    state: State<'_, AppState>,
    config: ConnectionConfig,
) -> Result<ClusterInfo, AppError> {
    let client = EsClient::new(&config)?;
    let cluster = client.ping().await?;
    state.set_session(client).await;
    Ok(cluster)
}

#[tauri::command]
pub async fn disconnect(state: State<'_, AppState>) -> Result<(), AppError> {
    state.clear_session().await;
    Ok(())
}
