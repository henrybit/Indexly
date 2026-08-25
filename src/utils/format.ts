export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const digits = value >= 10 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[exponent]}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function formatDateTime(ms: number): string {
  if (!ms) {
    return "未知";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function formatAge(ms: number): string {
  if (!ms) {
    return "-";
  }
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) {
    return `${Math.max(hours, 0)} 小时`;
  }
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours > 0 ? `${days} 天 ${restHours} 小时` : `${days} 天`;
}

export function formatTtl(value: number, unit: "days" | "hours"): string {
  return unit === "hours" ? `${value} 小时` : `${value} 天`;
}

export function isSystemIndex(name: string): boolean {
  return name.startsWith(".");
}
