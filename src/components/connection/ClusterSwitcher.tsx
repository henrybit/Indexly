import { useConnection, useActiveProfile } from "../../context/ConnectionContext";
import { displayClusterName } from "../../types/es";

export function ClusterSwitcher() {
  const { profiles, activeId, status, cluster, connectProfile } = useConnection();
  const activeProfile = useActiveProfile();
  const connected = status === "connected" && cluster;
  const busy = status === "connecting";

  return (
    <label className={`cluster-switcher ${connected ? "is-online" : "is-offline"}`}>
      <span className="dot" />
      <select
        value={activeId ?? ""}
        disabled={busy || profiles.length === 0}
        onChange={(event) => {
          const id = event.target.value;
          if (id) {
            void connectProfile(id);
          }
        }}
        aria-label="切换集群"
      >
        <option value="" disabled>
          {profiles.length === 0 ? "未配置集群" : "选择集群"}
        </option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {displayClusterName(profile)}
          </option>
        ))}
      </select>
      <span className="cluster-switcher-meta">
        {busy
          ? "连接中..."
          : connected
            ? `${cluster.clusterName} · v${cluster.version}`
            : activeProfile
              ? "未连接"
              : "未选择"}
      </span>
    </label>
  );
}
