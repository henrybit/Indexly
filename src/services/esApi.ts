import { invoke } from "@tauri-apps/api/core";
import type {
  ClusterInfo,
  ConnectionConfig,
  DeleteResult,
  IndexInfo,
  TtlPreview,
  TtlRule,
} from "../types/es";

export const esApi = {
  connect(config: ConnectionConfig) {
    return invoke<ClusterInfo>("connect", { config });
  },

  disconnect() {
    return invoke<void>("disconnect");
  },

  searchIndices(query = "") {
    return invoke<IndexInfo[]>("search_indices", {
      query: query.trim() || null,
    });
  },

  deleteIndices(names: string[]) {
    return invoke<DeleteResult>("delete_indices", { names });
  },

  previewExpiration(rules: TtlRule[]) {
    return invoke<TtlPreview>("preview_expiration", { rules });
  },

  applyExpiration(rules: TtlRule[]) {
    return invoke<DeleteResult>("apply_expiration", { rules });
  },
};

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "发生未知错误";
}
