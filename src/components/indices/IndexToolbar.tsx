import { FormEvent } from "react";
import { Button } from "../common/Button";
import { TextInput } from "../common/Field";
import type { HealthFilter } from "../../hooks/useIndices";

type IndexToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  disabled: boolean;
  selectedCount: number;
  totalCount: number;
  healthFilter: HealthFilter;
  onHealthFilterChange: (value: HealthFilter) => void;
  onDelete: () => void;
};

const HEALTH_OPTIONS: { value: HealthFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
];

export function IndexToolbar({
  query,
  onQueryChange,
  onSearch,
  loading,
  disabled,
  selectedCount,
  totalCount,
  healthFilter,
  onHealthFilterChange,
  onDelete,
}: IndexToolbarProps) {
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch();
  }

  return (
    <div className="toolbar">
      <form className="search-form" onSubmit={onSubmit}>
        <TextInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="搜索索引名，支持 * 通配符"
          disabled={disabled}
        />
        <Button type="submit" disabled={disabled || loading}>
          {loading ? "查询中..." : "搜索"}
        </Button>
      </form>

      <div className="toolbar-meta">
        <div className="chip-group" role="group" aria-label="按健康状态筛选">
          {HEALTH_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip ${healthFilter === option.value ? "is-active" : ""}`}
              onClick={() => onHealthFilterChange(option.value)}
              disabled={disabled}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="muted">
          共 {totalCount} 个索引
          {selectedCount > 0 ? `，已选 ${selectedCount}` : ""}
        </span>
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={disabled || selectedCount === 0}
        >
          删除所选
        </Button>
      </div>
    </div>
  );
}
