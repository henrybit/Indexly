# Indexly — Development

Build, run, and release Indexly from source. Product overview: [README.md](README.md) / [README.zh-CN.md](README.zh-CN.md).

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Rust](https://www.rust-lang.org/)
- npm (or compatible client)

## Develop

```bash
npm ci   # or: npm install
npm run tauri dev
```

Keep `@tauri-apps/*` (npm) and `tauri` / `tauri-plugin-*` (Cargo) on the **same major.minor**. After bumping either side, update both `package-lock.json` and `src-tauri/Cargo.lock`.

## Build installers

```bash
npm run tauri build
```

Artifacts land under `src-tauri/target/release/bundle/` for your OS.

## Project layout

```text
src/                 Vite frontend
  components/        Connection, indices, shared UI
  context/           Connection state
  hooks/             Index query / delete / TTL logic
  services/          Tauri command wrappers
src-tauri/           Tauri 2 + Rust backend
  src/es/            Elasticsearch HTTP client
  src/commands/      Connect / search / delete / TTL commands
```

## CI release (GitHub Actions)

Pushing **any** git tag runs [`.github/workflows/release.yml`](.github/workflows/release.yml) and uploads GitHub Release assets for:

- Windows (`windows-latest`)
- macOS Apple Silicon / Intel (`macos-latest`, `aarch64-apple-darwin` / `x86_64-apple-darwin`)
- Linux (`ubuntu-22.04`)

Example:

```bash
git tag 0.1.0
git push origin 0.1.0
```

Tags containing `-` (e.g. `0.1.0-beta.1` or `v0.1.0-rc.1`) are marked as prerelease.

### Repository secrets (macOS signing & notarization)

Configure under **Settings → Secrets and variables → Actions**:

| Secret | Description |
| --- | --- |
| `APPLE_CERTIFICATE` | Base64 of the Developer ID Application `.p12` (`openssl base64 -A -in cert.p12 -out cert.txt`) |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` |
| `APPLE_SIGNING_IDENTITY` | Optional codesign identity, e.g. `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | Apple ID email |
| `APPLE_PASSWORD` | [App-specific password](https://appleid.apple.com/account/manage) (not the login password) |
| `APPLE_TEAM_ID` | Team ID from [Apple Developer membership](https://developer.apple.com/account) |

Without these secrets, macOS still builds but is not properly signed/notarized; Gatekeeper may block distribution. Windows / Linux builds do not need them.

Enable **Read and write permissions** for Actions (**Settings → Actions → General → Workflow permissions**) so `tauri-action` can create or update Releases.
