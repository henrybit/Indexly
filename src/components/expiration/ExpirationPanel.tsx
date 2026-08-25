import { FormEvent, useState } from "react";
import { useExpirationRules } from "../../hooks/useExpirationRules";
import type { TtlRule, TtlUnit } from "../../types/es";
import { Button } from "../common/Button";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Field, Select, Switch, TextInput } from "../common/Field";
import { StatusBanner } from "../common/StatusBanner";
import { ExpirationPreviewTable } from "./ExpirationPreviewTable";
import { ExpirationRuleList } from "./ExpirationRuleList";

export function ExpirationPanel() {
  const {
    connected,
    canEdit,
    rules,
    form,
    setForm,
    matches,
    expiredCount,
    loading,
    applying,
    error,
    notice,
    saveRule,
    editRule,
    toggleRule,
    removeRule,
    startCreate,
    preview,
    apply,
  } = useExpirationRules();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const expiredNames = Array.from(
    new Set(matches.filter((item) => item.expired).map((item) => item.index)),
  );

  function update<K extends keyof TtlRule>(key: K, value: TtlRule[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    saveRule();
  }

  async function confirmApply() {
    const result = await apply();
    if (result) {
      setConfirmOpen(false);
    }
  }

  const busy = loading || applying;

  return (
    <section className="panel panel-fill">
      <div className="panel-header">
        <h2>索引过期</h2>
        <p>按正则匹配索引名，超过保留时长后可预览并清理。规则按当前集群分别保存。</p>
      </div>

      <div className="ttl-layout">
        <div className="ttl-sidebar">
          <ExpirationRuleList
            rules={rules}
            selectedId={form.id}
            disabled={!canEdit || busy}
            onSelect={editRule}
            onToggle={toggleRule}
            onCreate={startCreate}
            onRemove={removeRule}
          />

          <form className="stack cluster-form" onSubmit={onSave}>
            <div className="form-section-header">
              <h3>{form.id ? "编辑规则" : "新建规则"}</h3>
            </div>
            <Field label="规则名称">
              <TextInput
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="例如：日志索引 7 天"
                disabled={!canEdit || busy}
              />
            </Field>
            <Field label="索引名正则" hint="例如 ^logs-\\d{4}\\.\\d{2}\\.\\d{2}.* 或 filebeat-.*">
              <TextInput
                value={form.pattern}
                onChange={(event) => update("pattern", event.target.value)}
                placeholder="^logs-.*"
                required
                disabled={!canEdit || busy}
              />
            </Field>
            <div className="ttl-inline">
              <Field label="保留时长">
                <TextInput
                  type="number"
                  min={1}
                  value={form.ttlValue}
                  onChange={(event) => update("ttlValue", Number(event.target.value) || 0)}
                  required
                  disabled={!canEdit || busy}
                />
              </Field>
              <Field label="单位">
                <Select
                  value={form.ttlUnit}
                  onChange={(event) => update("ttlUnit", event.target.value as TtlUnit)}
                  disabled={!canEdit || busy}
                >
                  <option value="days">天</option>
                  <option value="hours">小时</option>
                </Select>
              </Field>
            </div>
            <Switch
              checked={form.skipSystem}
              onChange={(checked) => update("skipSystem", checked)}
              label="跳过系统索引（. 开头）"
              disabled={!canEdit || busy}
            />
            <Switch
              checked={form.enabled}
              onChange={(checked) => update("enabled", checked)}
              label="启用该规则"
              disabled={!canEdit || busy}
            />
            <div className="button-row wrap">
              <Button type="submit" disabled={!canEdit || busy}>
                保存规则
              </Button>
              <Button variant="ghost" onClick={() => void preview()} disabled={!connected || busy}>
                {loading ? "匹配中..." : "预览匹配"}
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmOpen(true)}
                disabled={!connected || busy || expiredCount === 0}
              >
                清理过期
              </Button>
            </div>
          </form>
        </div>

        <div className="ttl-preview">
          {notice ? <StatusBanner tone="success">{notice}</StatusBanner> : null}
          {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
          <ExpirationPreviewTable rows={matches} loading={loading} connected={connected} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="清理过期索引"
        description={`将删除 ${expiredCount} 个已过期且命中正则的索引，此操作不可恢复。`}
        confirmLabel="确认清理"
        names={expiredNames}
        busy={applying}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void confirmApply()}
      />
    </section>
  );
}
