import {
  displayClusterName,
  formatEndpoint,
  type ClusterProfile,
} from "../../types/es";
import { Button } from "../common/Button";

type ClusterListProps = {
  profiles: ClusterProfile[];
  selectedId: string | null;
  activeId: string | null;
  connected: boolean;
  connecting: boolean;
  pendingId: string | null;
  onSelect: (id: string) => void;
  onSwitch: (id: string) => void;
  onCreate: () => void;
};

export function ClusterList({
  profiles,
  selectedId,
  activeId,
  connected,
  connecting,
  pendingId,
  onSelect,
  onSwitch,
  onCreate,
}: ClusterListProps) {
  return (
    <div className="cluster-list">
      <div className="cluster-list-header">
        <span>已保存集群</span>
        <Button variant="ghost" className="btn-compact" onClick={onCreate}>
          新建
        </Button>
      </div>

      {profiles.length === 0 ? (
        <p className="muted cluster-empty">还没有集群，先在下方填写并保存。</p>
      ) : (
        <ul className="cluster-items">
          {profiles.map((profile) => {
            const isSelected = selectedId === profile.id;
            const isActive = connected && activeId === profile.id;
            const isSwitching = pendingId === profile.id;

            return (
              <li
                key={profile.id}
                className={`cluster-item ${isSelected ? "is-selected" : ""} ${isActive ? "is-online" : ""}`}
              >
                <button
                  type="button"
                  className="cluster-item-main"
                  onClick={() => onSelect(profile.id)}
                  disabled={connecting}
                >
                  <span className={`dot ${isActive ? "is-online" : ""}`} />
                  <span className="cluster-item-text">
                    <strong>{displayClusterName(profile)}</strong>
                    <small>{formatEndpoint(profile)}</small>
                  </span>
                </button>
                <Button
                  variant={isActive ? "subtle" : "ghost"}
                  className="btn-compact"
                  disabled={connecting || isActive}
                  onClick={() => onSwitch(profile.id)}
                >
                  {isSwitching ? "连接中" : isActive ? "已连接" : "切换"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
