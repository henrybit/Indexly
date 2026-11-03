import type { TtlRule } from "../types/es";

const STORE_PREFIX = "indexly:ttl-rules:";
const LEGACY_PREFIX = "es-gui:ttl-rules:";

export function loadTtlRules(clusterId: string | null): TtlRule[] {
  if (!clusterId) {
    return [];
  }

  const currentKey = `${STORE_PREFIX}${clusterId}`;
  const current = readRules(currentKey);
  if (current) {
    return current;
  }

  const legacyKey = `${LEGACY_PREFIX}${clusterId}`;
  const legacy = readRules(legacyKey);
  if (legacy) {
    saveTtlRules(clusterId, legacy);
    localStorage.removeItem(legacyKey);
    return legacy;
  }

  return [];
}

export function saveTtlRules(clusterId: string, rules: TtlRule[]) {
  localStorage.setItem(`${STORE_PREFIX}${clusterId}`, JSON.stringify(rules));
}

function readRules(key: string): TtlRule[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as TtlRule[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.pattern) : [];
  } catch {
    return null;
  }
}
