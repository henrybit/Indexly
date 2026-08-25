import type { IndexInfo } from "../../types/es";
import type { SortKey } from "../../hooks/useIndices";
import { formatBytes, formatNumber, isSystemIndex } from "../../utils/format";
import { EmptyState, Spinner } from "../common/StatusBanner";

type IndexTableProps = {
  rows: IndexInfo[];
  selected: string[];
  loading: boolean;
  connected: boolean;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onToggleSort: (key: SortKey) => void;
  onToggle: (name: string) => void;
  onToggleAll: () => void;
};

function healthClass(health: string) {
  if (health === "green" || health === "yellow" || health === "red") {
    return health;
  }
  return "unknown";
}

function sortMark(active: boolean, dir: "asc" | "desc") {
  if (!active) {
    return "";
  }
  return dir === "asc" ? " ↑" : " ↓";
}

export function IndexTable({
  rows,
  selected,
  loading,
  connected,
  sortKey,
  sortDir,
  onToggleSort,
  onToggle,
  onToggleAll,
}: IndexTableProps) {
  const allVisibleSelected =
    rows.length > 0 && rows.every((row) => selected.includes(row.name));

  if (!connected) {
    return (
      <EmptyState
        title="尚未连接集群"
        description="在左侧保存并切换 Elasticsearch 集群后，即可搜索和删除索引。"
      />
    );
  }

  if (loading && rows.length === 0) {
    return (
      <div className="table-loading">
        <Spinner />
        <span>正在加载索引...</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="没有匹配的索引"
        description="试试更宽泛的关键字，或清空搜索后重新查询。"
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="check-col">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={onToggleAll}
                aria-label="全选当前列表"
              />
            </th>
            <th>
              <button type="button" className="sort-btn" onClick={() => onToggleSort("name")}>
                索引{sortMark(sortKey === "name", sortDir)}
              </button>
            </th>
            <th>
              <button type="button" className="sort-btn" onClick={() => onToggleSort("health")}>
                健康{sortMark(sortKey === "health", sortDir)}
              </button>
            </th>
            <th>状态</th>
            <th>分片</th>
            <th>
              <button type="button" className="sort-btn" onClick={() => onToggleSort("docsCount")}>
                文档{sortMark(sortKey === "docsCount", sortDir)}
              </button>
            </th>
            <th>
              <button type="button" className="sort-btn" onClick={() => onToggleSort("storeBytes")}>
                存储{sortMark(sortKey === "storeBytes", sortDir)}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.uuid || row.name} className={selected.includes(row.name) ? "is-selected" : ""}>
              <td className="check-col">
                <input
                  type="checkbox"
                  checked={selected.includes(row.name)}
                  onChange={() => onToggle(row.name)}
                  aria-label={`选择 ${row.name}`}
                />
              </td>
              <td>
                <div className="index-name">
                  <code>{row.name}</code>
                  {isSystemIndex(row.name) ? <span className="tag">系统</span> : null}
                </div>
              </td>
              <td>
                <span className={`health health-${healthClass(row.health)}`}>
                  {row.health}
                </span>
              </td>
              <td>{row.status}</td>
              <td>
                {row.primaryShards} / {row.replicaShards}
              </td>
              <td>{formatNumber(row.docsCount)}</td>
              <td>{formatBytes(row.storeBytes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
