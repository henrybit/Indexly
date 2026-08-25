import {
  DEFAULT_CONNECTION,
  type ClusterProfile,
} from "../types/es";

const STORE_KEY = "es-gui:clusters";
const LEGACY_KEY = "es-gui:last-connection";

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
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ClusterStore;
      const profiles = Array.isArray(parsed.profiles)
        ? parsed.profiles.map(normalizeProfile).filter((item) => item.host)
        : [];
      const activeId =
        parsed.activeId && profiles.some((item) => item.id === parsed.activeId)
          ? parsed.activeId
          : (profiles[0]?.id ?? null);
      return { profiles, activeId };
    }
  } catch {
    // Fall through to legacy migration.
  }

  const migrated = migrateLegacyConnection();
  if (migrated) {
    saveClusterStore(migrated);
    return migrated;
  }

  return { profiles: [], activeId: null };
}

export function saveClusterStore(store: ClusterStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function migrateLegacyConnection(): ClusterStore | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
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
    localStorage.removeItem(LEGACY_KEY);
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
