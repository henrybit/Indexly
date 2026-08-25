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
          <span className="brand-mark">ES</span>
          <div>
            <h1>ES GUI</h1>
            <p>Elasticsearch 7 / 8 桌面管理工具</p>
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
