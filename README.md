# Indexly

**Indexly** is a lightweight desktop app for managing Elasticsearch 7.x / 8.x indices. Connect to clusters on your machine, search indices quickly, delete with safeguards, and clean up expired indices with preview-first TTL rules.

[简体中文](README.zh-CN.md) · [User guide](USER_GUIDE.md) · [Product details](PRODUCT.md) · [Development](Develop.md)

---

## Why Indexly

Indexly is **not** a Kibana replacement. It does not try to cover dashboards, Discover, or full cluster ops. It focuses on the index lifecycle tasks people do most often—and the ones that hurt most when done wrong:

- Switch between multiple clusters without retyping configs
- Find indices fast in large clusters
- Delete only what you explicitly select
- Preview TTL matches before cleaning expired indices

Runs locally on **Windows**, **macOS**, and **Linux**. No management server to deploy.

---

## Features

### Multi-cluster connections

- Save multiple cluster profiles and switch the active one in one click
- HTTP / HTTPS
- Basic Auth
- Optional skip TLS verification for self-signed or lab environments
- Shows cluster name and version; warns when the major version is outside 7 / 8
- Connection settings stay on your machine; TTL rules are isolated per cluster

### Index search & overview

- Search by index name with `*` / `?` wildcards (e.g. `log-*`, `index_?`)
- Table view for health, status, shards, docs, and store size
- Built for quickly locating targets before delete or cleanup

### Safe index deletion

- Multi-select delete with a confirmation step
- Blocks dangerous bulk patterns such as `*` and `_all`
- You must pick concrete indices—no wildcard wipe path
- Reports deleted vs failed items (permissions, read-only blocks, etc.)

### Expiration / TTL cleanup

- Rules stored per active cluster
- Match index names with regular expressions
- Retention in days or hours, based on index creation time
- Optionally skip system indices (names starting with `.`)
- Enable, disable, edit, or remove rules
- **Preview matches** before any delete
- **Clean expired** only removes indices that both match and are past TTL, with another confirmation

---

## Highlights

| | |
| --- | --- |
| **Lightweight desktop** | Local app, direct cluster access, no extra control plane |
| **Safety first** | Confirmations, no full-wipe shortcuts, preview before TTL cleanup |
| **Multi-environment** | Dev / test / prod profiles without rewriting connection forms |
| **Cross-platform** | Same workflow on Windows, macOS, and Linux |
| **Index-focused** | Connect → search → delete / expire as one clear path |

---

## Good fit for

1. **Day-to-day triage** — find oversized or unexpected indices with wildcards  
2. **Environment hopping** — jump between lab and staging clusters  
3. **Log index cleanup** — e.g. keep `logs-YYYY.MM.DD` for 7 days, preview, then clean  
4. **Mistake reduction** — force explicit index selection instead of careless wildcards  

---

## What it does not do (yet)

- Kibana-style visualization, Discover, or dashboards
- Arbitrary Query DSL / SQL consoles
- Full node / shard allocation / ILM policy administration
- Cloud accounts or remote policy sync (everything stays local)
- Enterprise secret vaulting — protect the OS account that holds credentials

---

## Download

Installers are published on [GitHub Releases](../../releases) for Windows, macOS (Apple Silicon & Intel), and Linux.

For step-by-step usage, see [USER_GUIDE.md](USER_GUIDE.md).  
For building from source or release CI, see [Develop.md](Develop.md).

**Version:** 0.1.0 · **Targets:** Elasticsearch 7.x / 8.x
