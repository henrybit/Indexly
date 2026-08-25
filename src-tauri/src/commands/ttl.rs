use tauri::State;

use crate::commands::AppState;
use crate::error::AppError;
use crate::es::{DeleteResult, TtlPreview, TtlRule};

#[tauri::command]
pub async fn preview_expiration(
    state: State<'_, AppState>,
    rules: Vec<TtlRule>,
) -> Result<TtlPreview, AppError> {
    let client = state.require_client().await?;
    client.preview_expiration(rules).await
}

#[tauri::command]
pub async fn apply_expiration(
    state: State<'_, AppState>,
    rules: Vec<TtlRule>,
) -> Result<DeleteResult, AppError> {
    let client = state.require_client().await?;
    client.apply_expiration(rules).await
}
