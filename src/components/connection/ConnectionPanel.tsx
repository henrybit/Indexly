import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useConnection } from "../../context/ConnectionContext";
import {
  connectionConfigEquals,
  displayClusterName,
  emptyClusterForm,
  isProfileDirty,
  type ClusterProfile,
} from "../../types/es";
import { Button } from "../common/Button";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Field, Switch, TextInput } from "../common/Field";
import { StatusBanner } from "../common/StatusBanner";
import { ClusterList } from "./ClusterList";

export function ConnectionPanel() {
  const {
    profiles,
    activeId,
    pendingId,
    status,
    error,
    warning,
    upsertProfile,
    removeProfile,
    connectProfile,
    connectAndSave,
    disconnect,
  } = useConnection();

  const [form, setForm] = useState<ClusterProfile>(() => {
    const current = profiles.find((item) => item.id === activeId);
    return current ?? emptyClusterForm();
  });
  const [selectedId, setSelectedId] = useState<string | null>(activeId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const current = profilesRef.current.find((item) => item.id === selectedId);
    if (current) {
      setForm(current);
      setSaveNotice(null);
    }
  }, [selectedId]);

  const stored = useMemo(
    () => profiles.find((item) => item.id === form.id),
    [profiles, form.id],
  );
  const dirty = isProfileDirty(form, stored);

  function update<K extends keyof ClusterProfile>(key: K, value: ClusterProfile[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveNotice(null);
  }

  function startCreate() {
    setSelectedId(null);
    setForm(emptyClusterForm());
    setSaveNotice(null);
  }

  function selectProfile(id: string) {
    setSelectedId(id);
  }

  async function persistForm(reconnectIfNeeded: boolean) {
    const previous = profilesRef.current.find((item) => item.id === form.id);
    const saved = upsertProfile(form);
    setSelectedId(saved.id);
    setForm(saved);

    const shouldReconnect =
      reconnectIfNeeded &&
      status === "connected" &&
      activeId === saved.id &&
      previous &&
      !connectionConfigEquals(previous, saved);

    if (shouldReconnect) {
      const ok = await connectProfile(saved.id);
      setSaveNotice(ok ? "已保存并按新配置重新连接" : "已保存配置，但重新连接失败");
      return saved;
    }

    setSaveNotice("已保存连接配置");
    return saved;
  }

  async function onSave() {
    await persistForm(true);
  }

  async function onConnect(event: FormEvent) {
    event.preventDefault();
    const saved = await connectAndSave(form);
    if (saved) {
      setSelectedId(saved.id);
      setForm(saved);
      setSaveNotice("已保存并连接");
    }
  }

  async function confirmRemove() {
    if (!form.id) {
      startCreate();
      setConfirmOpen(false);
      return;
    }
    await removeProfile(form.id);
    const remaining = profilesRef.current.filter((item) => item.id !== form.id);
    if (remaining[0]) {
      selectProfile(remaining[0].id);
    } else {
      startCreate();
    }
    setConfirmOpen(false);
  }

  const busy = status === "connecting";
  const isExisting = Boolean(form.id);
  const isCurrentConnected = status === "connected" && activeId === form.id;
  const connectionDirty = stored ? !connectionConfigEquals(form, stored) : true;

  return (
    <section className="panel connection-panel">
      <div className="panel-header">
        <h2>集群管理</h2>
        <p>点击集群可编辑配置；使用「切换」或「连接」应用到会话。</p>
      </div>

      <ClusterList
        profiles={profiles}
        selectedId={selectedId}
        activeId={activeId}
        connected={status === "connected"}
        connecting={busy}
        pendingId={pendingId}
        onSelect={selectProfile}
        onSwitch={(id) => {
          selectProfile(id);
          void connectProfile(id);
        }}
        onCreate={startCreate}
      />

      <form className="stack cluster-form" onSubmit={(event) => void onConnect(event)}>
        <div className="form-section-header">
          <h3>{isExisting ? "编辑连接" : "新建连接"}</h3>
          {isExisting && dirty ? <span className="tag">未保存</span> : null}
        </div>

        <Field label="显示名称">
          <TextInput
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="例如：生产集群"
            autoComplete="off"
            disabled={busy}
          />
        </Field>

        <Field label="主机">
          <TextInput
            value={form.host}
            onChange={(event) => update("host", event.target.value)}
            placeholder="localhost"
            autoComplete="off"
            required
            disabled={busy}
          />
        </Field>

        <Field label="端口">
          <TextInput
            type="number"
            min={1}
            max={65535}
            value={form.port}
            onChange={(event) => update("port", Number(event.target.value))}
            required
            disabled={busy}
          />
        </Field>

        <Field label="用户名">
          <TextInput
            value={form.username}
            onChange={(event) => update("username", event.target.value)}
            placeholder="可选"
            autoComplete="username"
            disabled={busy}
          />
        </Field>

        <Field label="密码">
          <TextInput
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder="可选，保存在本机"
            autoComplete="current-password"
            disabled={busy}
          />
        </Field>

        <div className="switch-row">
          <Switch
            checked={form.useSsl}
            onChange={(checked) => update("useSsl", checked)}
            label="HTTPS"
            disabled={busy}
          />
          <Switch
            checked={form.skipSslVerify}
            onChange={(checked) => update("skipSslVerify", checked)}
            label="跳过证书校验"
            disabled={busy}
          />
        </div>

        {isCurrentConnected && connectionDirty ? (
          <StatusBanner tone="info">
            当前集群的连接参数已修改，保存后会按新配置重新连接。
          </StatusBanner>
        ) : null}
        {saveNotice ? <StatusBanner tone="success">{saveNotice}</StatusBanner> : null}
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {warning ? <StatusBanner tone="warning">{warning}</StatusBanner> : null}

        <div className="button-row wrap">
          <Button type="submit" disabled={busy}>
            {busy ? "连接中..." : isCurrentConnected ? "保存并重连" : "保存并连接"}
          </Button>
          <Button variant="ghost" onClick={() => void onSave()} disabled={busy || (isExisting && !dirty)}>
            保存
          </Button>
          <Button
            variant="ghost"
            onClick={() => void disconnect()}
            disabled={status === "idle" || busy}
          >
            断开
          </Button>
          <Button
            variant="danger"
            onClick={() => setConfirmOpen(true)}
            disabled={busy || !isExisting}
          >
            删除
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="删除集群配置"
        description="将从本机移除该连接配置，不会删除 Elasticsearch 中的数据。"
        confirmLabel="确认删除"
        names={form.id ? [displayClusterName(form)] : []}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void confirmRemove()}
      />
    </section>
  );
}
