type StatusBannerProps = {
  tone?: "error" | "warning" | "success" | "info";
  children: string;
};

export function StatusBanner({ tone = "info", children }: StatusBannerProps) {
  return <div className={`banner banner-${tone}`}>{children}</div>;
}

export function Spinner() {
  return <span className="spinner" aria-label="加载中" />;
}

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
