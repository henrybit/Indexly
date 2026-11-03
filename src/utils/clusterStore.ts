import {
  DEFAULT_CONNECTION,
  type ClusterProfile,
} from "../types/es";

const STORE_KEY = "indexly:clusters";
const LEGACY_STORE_KEYS = ["es-gui:clusters"] as const;
const LEGACY_CONNECTION_KEY = "es-gui:last-connection";

export type ClusterStore = {
  profiles: ClusterProfile[];
  activeId: string | null;
};

type LegacyConnection = {
  host: string;
  port: number;
  useSsl: boolean;
  skipSslVerify: boolean;
  username: string;
};

export function loadClusterStore(): ClusterStore {
  const fromCurrent = readStore(STORE_KEY);
  if (fromCurrent) {
    return fromCurrent;
  }

  for (const key of LEGACY_STORE_KEYS) {
    const migrated = readStore(key);
    if (migrated) {
      saveClusterStore(migrated);
      localStorage.removeItem(key);
      return migrated;
    }
  }

  const fromLegacyConnection = migrateLegacyConnection();
  if (fromLegacyConnection) {
    saveClusterStore(fromLegacyConnection);
    return fromLegacyConnection;
  }

  return { profiles: [], activeId: null };
}

export function saveClusterStore(store: ClusterStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function readStore(key: string): ClusterStore | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ClusterStore;
    const profiles = Array.isArray(parsed.profiles)
      ? parsed.profiles.map(normalizeProfile).filter((item) => item.host)
      : [];
    const activeId =
      parsed.activeId && profiles.some((item) => item.id === parsed.activeId)
        ? parsed.activeId
        : (profiles[0]?.id ?? null);
    return { profiles, activeId };
  } catch {
    return null;
  }
}

function migrateLegacyConnection(): ClusterStore | null {
  try {
    const raw = localStorage.getItem(LEGACY_CONNECTION_KEY);
    if (!raw) {
      return null;
    }
    const legacy = JSON.parse(raw) as LegacyConnection;
    const profile = normalizeProfile({
      id: crypto.randomUUID(),
      name: `${legacy.host}:${legacy.port}`,
      ...DEFAULT_CONNECTION,
      ...legacy,
      password: "",
    });
    localStorage.removeItem(LEGACY_CONNECTION_KEY);
    return { profiles: [profile], activeId: profile.id };
  } catch {
    return null;
  }
}

function normalizeProfile(value: Partial<ClusterProfile>): ClusterProfile {
  return {
    id: value.id || crypto.randomUUID(),
    name: value.name?.trim() ?? "",
    host: value.host?.trim() || DEFAULT_CONNECTION.host,
    port: Number(value.port) || DEFAULT_CONNECTION.port,
    useSsl: Boolean(value.useSsl),
    skipSslVerify: value.skipSslVerify ?? true,
    username: value.username ?? "",
    password: value.password ?? "",
  };
}
