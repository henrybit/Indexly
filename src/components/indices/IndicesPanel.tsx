import { useState } from "react";
import { useConnection } from "../../context/ConnectionContext";
import { useIndices } from "../../hooks/useIndices";
import { isSystemIndex } from "../../utils/format";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { StatusBanner } from "../common/StatusBanner";
import { IndexTable } from "./IndexTable";
import { IndexToolbar } from "./IndexToolbar";

export function IndicesPanel() {
  const { status } = useConnection();
  const connected = status === "connected";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    query,
    setQuery,
    visibleIndices,
    selected,
    loading,
    deleting,
    error,
    notice,
    healthFilter,
    setHealthFilter,
    sortKey,
    sortDir,
    toggleSort,
    search,
    toggleSelect,
    toggleSelectAll,
    deleteSelected,
  } = useIndices();

  const selectedSystem = selected.filter(isSystemIndex);

  async function confirmDelete() {
    const result = await deleteSelected();
    if (result) {
      setConfirmOpen(false);
    }
  }

  return (
    <section className="panel panel-fill">
      <div className="panel-header">
        <h2>索引管理</h2>
        <p>按名称搜索集群中的 indices，并删除指定索引。</p>
      </div>

      <IndexToolbar
        query={query}
        onQueryChange={setQuery}
        onSearch={() => void search(query)}
        loading={loading}
        disabled={!connected}
        selectedCount={selected.length}
        totalCount={visibleIndices.length}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
        onDelete={() => setConfirmOpen(true)}
      />

      {notice ? <StatusBanner tone="success">{notice}</StatusBanner> : null}
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}

      <IndexTable
        rows={visibleIndices}
        selected={selected}
        loading={loading}
        connected={connected}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        onToggle={toggleSelect}
        onToggleAll={toggleSelectAll}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="确认删除索引"
        description={
          selectedSystem.length > 0
            ? `将永久删除 ${selected.length} 个索引，其中包含 ${selectedSystem.length} 个系统索引，此操作不可恢复。`
            : `将永久删除以下 ${selected.length} 个索引，此操作不可恢复。`
        }
        names={selected}
        busy={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
