import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { esApi, getErrorMessage } from "../services/esApi";
import {
  displayClusterName,
  toConnectionConfig,
  type ClusterInfo,
  type ClusterProfile,
} from "../types/es";
import { loadClusterStore, saveClusterStore } from "../utils/clusterStore";

type ConnectionStatus = "idle" | "connecting" | "connected";

type SessionSnapshot = {
  status: ConnectionStatus;
  cluster: ClusterInfo | null;
  activeId: string | null;
};

type ConnectionContextValue = {
  profiles: ClusterProfile[];
  activeId: string | null;
  pendingId: string | null;
  status: ConnectionStatus;
  cluster: ClusterInfo | null;
  error: string | null;
  warning: string | null;
  upsertProfile: (profile: ClusterProfile) => ClusterProfile;
  removeProfile: (id: string) => Promise<void>;
  connectProfile: (id: string) => Promise<boolean>;
  connectAndSave: (profile: ClusterProfile) => Promise<ClusterProfile | null>;
  disconnect: () => Promise<void>;
};

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

function withSavedName(profile: ClusterProfile): ClusterProfile {
  return {
    ...profile,
    id: profile.id || crypto.randomUUID(),
    name: profile.name.trim() || displayClusterName(profile),
    host: profile.host.trim(),
    username: profile.username.trim(),
    port: Number(profile.port) || 9200,
  };
}

function replaceProfile(list: ClusterProfile[], profile: ClusterProfile): ClusterProfile[] {
  return list.some((item) => item.id === profile.id)
    ? list.map((item) => (item.id === profile.id ? profile : item))
    : [...list, profile];
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const initial = useRef(loadClusterStore()).current;
  const [profiles, setProfiles] = useState<ClusterProfile[]>(initial.profiles);
  const [activeId, setActiveId] = useState<string | null>(initial.activeId);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [cluster, setCluster] = useState<ClusterInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const sessionRef = useRef<SessionSnapshot>({
    status: "idle",
    cluster: null,
    activeId: initial.activeId,
  });
  const profilesRef = useRef(initial.profiles);
  profilesRef.current = profiles;

  const persist = useCallback((nextProfiles: ClusterProfile[], nextActiveId: string | null) => {
    profilesRef.current = nextProfiles;
    setProfiles(nextProfiles);
    setActiveId(nextActiveId);
    saveClusterStore({ profiles: nextProfiles, activeId: nextActiveId });
  }, []);

  const upsertProfile = useCallback(
    (profile: ClusterProfile) => {
      const next = withSavedName(profile);
      persist(replaceProfile(profilesRef.current, next), activeId ?? next.id);
      return next;
    },
    [activeId, persist],
  );

  const restorePreviousSession = useCallback((message: string) => {
    const previous = sessionRef.current;
    setPendingId(null);
    setError(message);
    setStatus(previous.status);
    setCluster(previous.cluster);
    if (previous.status !== "connected") {
      setWarning(null);
    }
  }, []);

  const connectConfig = useCallback(
    async (profile: ClusterProfile, nextProfiles: ClusterProfile[]) => {
      setPendingId(profile.id);
      setStatus("connecting");
      setError(null);
      setWarning(null);

      try {
        const info = await esApi.connect(toConnectionConfig(profile));
        persist(nextProfiles, profile.id);
        setCluster(info);
        setStatus("connected");
        setPendingId(null);
        setWarning(
          info.compatible
            ? null
            : `当前集群版本为 ${info.version}，本工具主要验证 Elasticsearch 7/8，部分操作可能不稳定。`,
        );
        sessionRef.current = {
          status: "connected",
          cluster: info,
          activeId: profile.id,
        };
        return profile;
      } catch (err) {
        restorePreviousSession(getErrorMessage(err));
        persist(nextProfiles, sessionRef.current.activeId);
        return null;
      }
    },
    [persist, restorePreviousSession],
  );

  const connectProfile = useCallback(
    async (id: string) => {
      const profile = profilesRef.current.find((item) => item.id === id);
      if (!profile) {
        setError("未找到该集群配置");
        return false;
      }
      const result = await connectConfig(profile, profilesRef.current);
      return Boolean(result);
    },
    [connectConfig],
  );

  const connectAndSave = useCallback(
    async (profile: ClusterProfile) => {
      const saved = withSavedName(profile);
      const nextProfiles = replaceProfile(profilesRef.current, saved);
      persist(nextProfiles, activeId ?? saved.id);
      return connectConfig(saved, nextProfiles);
    },
    [activeId, persist, connectConfig],
  );

  const removeProfile = useCallback(
    async (id: string) => {
      const nextProfiles = profilesRef.current.filter((item) => item.id !== id);
      const removingActive = sessionRef.current.activeId === id;
      const nextActiveId = removingActive
        ? (nextProfiles[0]?.id ?? null)
        : activeId === id
          ? (nextProfiles[0]?.id ?? null)
          : activeId;

      persist(nextProfiles, nextActiveId);

      if (removingActive) {
        try {
          await esApi.disconnect();
        } catch {
          // Ignore backend disconnect errors when removing the active profile.
        }
        sessionRef.current = { status: "idle", cluster: null, activeId: nextActiveId };
        setStatus("idle");
        setCluster(null);
        setPendingId(null);
        setError(null);
        setWarning(null);
      }
    },
    [activeId, persist],
  );

  const disconnect = useCallback(async () => {
    try {
      await esApi.disconnect();
    } catch {
      // Keep local state consistent even if the backend session is already gone.
    }
    sessionRef.current = {
      status: "idle",
      cluster: null,
      activeId: sessionRef.current.activeId,
    };
    setStatus("idle");
    setCluster(null);
    setPendingId(null);
    setError(null);
    setWarning(null);
  }, []);

  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) {
      return;
    }
    bootstrapped.current = true;
    const lastId = initial.activeId;
    if (lastId) {
      void connectProfile(lastId);
    }
  }, [connectProfile]);

  const value = useMemo(
    () => ({
      profiles,
      activeId,
      pendingId,
      status,
      cluster,
      error,
      warning,
      upsertProfile,
      removeProfile,
      connectProfile,
      connectAndSave,
      disconnect,
    }),
    [
      profiles,
      activeId,
      pendingId,
      status,
      cluster,
      error,
      warning,
      upsertProfile,
      removeProfile,
      connectProfile,
      connectAndSave,
      disconnect,
    ],
  );

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const value = useContext(ConnectionContext);
  if (!value) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }
  return value;
}

export function useActiveProfile(): ClusterProfile | null {
  const { profiles, activeId } = useConnection();
  return profiles.find((item) => item.id === activeId) ?? null;
}
