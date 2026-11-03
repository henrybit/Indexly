import type { ReactNode } from "react";
import { ClusterSwitcher } from "../connection/ClusterSwitcher";

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">Ix</span>
          <div>
            <h1>Indexly</h1>
            <p>Elasticsearch 索引桌面管理</p>
          </div>
        </div>
        <ClusterSwitcher />
      </header>
      <div className="workspace">
        <aside className="sidebar">{sidebar}</aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
