use tauri::State;

use crate::commands::AppState;
use crate::error::AppError;
use crate::es::{DeleteResult, IndexInfo};

#[tauri::command]
pub async fn search_indices(
    state: State<'_, AppState>,
    query: Option<String>,
) -> Result<Vec<IndexInfo>, AppError> {
    let client = state.require_client().await?;
    client.search_indices(query.as_deref()).await
}

#[tauri::command]
pub async fn delete_indices(
    state: State<'_, AppState>,
    names: Vec<String>,
) -> Result<DeleteResult, AppError> {
    let client = state.require_client().await?;
    client.delete_indices(&names).await
}
