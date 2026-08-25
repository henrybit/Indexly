import { useState, type ReactNode } from "react";

type WorkspaceTab = "indices" | "ttl";

type WorkspaceProps = {
  indices: ReactNode;
  expiration: ReactNode;
};

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "indices", label: "索引管理" },
  { id: "ttl", label: "过期策略" },
];

export function Workspace({ indices, expiration }: WorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("indices");

  return (
    <div className="workspace-main">
      <div className="content-tabs" role="tablist" aria-label="功能切换">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`content-tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "indices" ? indices : expiration}
    </div>
  );
}
