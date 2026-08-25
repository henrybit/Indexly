import type { TtlMatch } from "../../types/es";
import { formatAge, formatBytes, formatDateTime } from "../../utils/format";
import { EmptyState, Spinner } from "../common/StatusBanner";

type ExpirationPreviewTableProps = {
  rows: TtlMatch[];
  loading: boolean;
  connected: boolean;
};

export function ExpirationPreviewTable({
  rows,
  loading,
  connected,
}: ExpirationPreviewTableProps) {
  if (!connected) {
    return (
      <EmptyState
        title="尚未连接集群"
        description="连接集群后，可以预览正则匹配到的索引及其是否过期。"
      />
    );
  }

  if (loading && rows.length === 0) {
    return (
      <div className="table-loading">
        <Spinner />
        <span>正在匹配索引...</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="还没有预览结果"
        description="保存并启用规则后，点击「预览匹配」查看命中的索引。"
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>索引</th>
            <th>规则</th>
            <th>创建时间</th>
            <th>已存在</th>
            <th>保留时长</th>
            <th>存储</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.ruleId}-${row.index}`} className={row.expired ? "is-expired" : ""}>
              <td>
                <code>{row.index}</code>
              </td>
              <td>{row.ruleName}</td>
              <td>{formatDateTime(row.creationDate)}</td>
              <td>{row.creationDate ? formatAge(row.ageMs) : "-"}</td>
              <td>{formatAge(row.ttlMs)}</td>
              <td>{formatBytes(row.storeBytes)}</td>
              <td>
                <span className={`health ${row.expired ? "health-red" : "health-green"}`}>
                  {row.creationDate === 0 ? "无创建时间" : row.expired ? "已过期" : "未到期"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
