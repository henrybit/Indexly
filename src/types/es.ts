export type ConnectionConfig = {
  host: string;
  port: number;
  useSsl: boolean;
  skipSslVerify: boolean;
  username: string;
  password: string;
};

export type ClusterInfo = {
  name: string;
  clusterName: string;
  version: string;
  majorVersion: number;
  compatible: boolean;
};

export type IndexInfo = {
  name: string;
  health: string;
  status: string;
  uuid: string;
  primaryShards: string;
  replicaShards: string;
  docsCount: number;
  docsDeleted: number;
  storeBytes: number;
  creationDate?: number;
};

export type TtlUnit = "days" | "hours";

export type TtlRule = {
  id: string;
  name: string;
  pattern: string;
  ttlValue: number;
  ttlUnit: TtlUnit;
  enabled: boolean;
  skipSystem: boolean;
};

export type TtlMatch = {
  index: string;
  ruleId: string;
  ruleName: string;
  pattern: string;
  creationDate: number;
  ageMs: number;
  ttlMs: number;
  expired: boolean;
  storeBytes: number;
};

export type TtlPreview = {
  matches: TtlMatch[];
  expiredCount: number;
};

export function emptyTtlRule(): TtlRule {
  return {
    id: "",
    name: "",
    pattern: "",
    ttlValue: 7,
    ttlUnit: "days",
    enabled: true,
    skipSystem: true,
  };
}

export type DeleteFailure = {
  index: string;
  message: string;
};

export type DeleteResult = {
  deleted: string[];
  failed: DeleteFailure[];
};

export type ClusterProfile = ConnectionConfig & {
  id: string;
  name: string;
};

export const DEFAULT_CONNECTION: ConnectionConfig = {
  host: "localhost",
  port: 9200,
  useSsl: false,
  skipSslVerify: true,
  username: "",
  password: "",
};

export function emptyClusterForm(): ClusterProfile {
  return {
    id: "",
    name: "",
    ...DEFAULT_CONNECTION,
  };
}

export function toConnectionConfig(profile: ClusterProfile): ConnectionConfig {
  return {
    host: profile.host,
    port: profile.port,
    useSsl: profile.useSsl,
    skipSslVerify: profile.skipSslVerify,
    username: profile.username,
    password: profile.password,
  };
}

export function displayClusterName(profile: Pick<ClusterProfile, "name" | "host" | "port">): string {
  const name = profile.name.trim();
  return name || `${profile.host}:${profile.port}`;
}

export function formatEndpoint(profile: Pick<ClusterProfile, "host" | "port" | "useSsl">): string {
  const scheme = profile.useSsl ? "https" : "http";
  return `${scheme}://${profile.host}:${profile.port}`;
}

export function connectionConfigEquals(a: ConnectionConfig, b: ConnectionConfig): boolean {
  return (
    a.host.trim() === b.host.trim() &&
    Number(a.port) === Number(b.port) &&
    a.useSsl === b.useSsl &&
    a.skipSslVerify === b.skipSslVerify &&
    a.username.trim() === b.username.trim() &&
    a.password === b.password
  );
}

export function isProfileDirty(
  form: ClusterProfile,
  stored: ClusterProfile | undefined,
): boolean {
  if (!stored) {
    return true;
  }
  return form.name.trim() !== stored.name.trim() || !connectionConfigEquals(form, stored);
}
