import type { TtlRule } from "../types/es";

const STORE_PREFIX = "es-gui:ttl-rules:";

export function loadTtlRules(clusterId: string | null): TtlRule[] {
  if (!clusterId) {
    return [];
  }
  try {
    const raw = localStorage.getItem(`${STORE_PREFIX}${clusterId}`);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as TtlRule[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.pattern) : [];
  } catch {
    return [];
  }
}

export function saveTtlRules(clusterId: string, rules: TtlRule[]) {
  localStorage.setItem(`${STORE_PREFIX}${clusterId}`, JSON.stringify(rules));
}
