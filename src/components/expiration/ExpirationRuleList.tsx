import type { TtlRule } from "../../types/es";
import { formatTtl } from "../../utils/format";
import { Button } from "../common/Button";
import { Switch } from "../common/Field";

type ExpirationRuleListProps = {
  rules: TtlRule[];
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onCreate: () => void;
  onRemove: (id: string) => void;
};

export function ExpirationRuleList({
  rules,
  selectedId,
  disabled,
  onSelect,
  onToggle,
  onCreate,
  onRemove,
}: ExpirationRuleListProps) {
  return (
    <div className="cluster-list">
      <div className="cluster-list-header">
        <span>过期规则</span>
        <Button variant="ghost" className="btn-compact" onClick={onCreate} disabled={disabled}>
          新建
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="muted cluster-empty">还没有规则。用正则匹配索引名，并设置保留时长。</p>
      ) : (
        <ul className="cluster-items">
          {rules.map((rule) => {
            const isSelected = selectedId === rule.id;
            return (
              <li
                key={rule.id}
                className={`cluster-item ${isSelected ? "is-selected" : ""} ${rule.enabled ? "" : "is-disabled"}`}
              >
                <button
                  type="button"
                  className="cluster-item-main"
                  onClick={() => onSelect(rule.id)}
                  disabled={disabled}
                >
                  <span className={`dot ${rule.enabled ? "is-online" : ""}`} />
                  <span className="cluster-item-text">
                    <strong>{rule.name}</strong>
                    <small>
                      /{rule.pattern}/ · {formatTtl(rule.ttlValue, rule.ttlUnit)}
                    </small>
                  </span>
                </button>
                <div className="rule-item-actions">
                  <Switch
                    checked={rule.enabled}
                    onChange={(enabled) => onToggle(rule.id, enabled)}
                    label={rule.enabled ? "开" : "关"}
                    disabled={disabled}
                  />
                  <Button
                    variant="ghost"
                    className="btn-compact"
                    onClick={() => onRemove(rule.id)}
                    disabled={disabled}
                  >
                    删除
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
