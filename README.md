# ES GUI

基于 **Tauri 2.x + Vite + React + TypeScript** 的 Elasticsearch 7 / 8 桌面管理工具。

## 功能

- 连接 Elasticsearch 7.x / 8.x（HTTP / HTTPS、Basic Auth、可选跳过证书校验）
- 按名称搜索 indices（支持 `*` / `?` 通配符）
- 勾选并删除指定索引（带确认框，禁止 `*` / `_all` 全量删除）

## 开发

需要安装 [Node.js](https://nodejs.org/) 和 [Rust](https://www.rust-lang.org/)。

```bash
npm install
npm run tauri dev
```

打包桌面应用：

```bash
npm run tauri build
```

## CI 发布（GitHub Actions）

推送符合 `v*` 的 tag 时，工作流 [`.github/workflows/release.yml`](.github/workflows/release.yml) 会并行构建并上传 GitHub Release 产物：

- Windows（`windows-latest`）
- macOS Apple Silicon / Intel（`macos-latest`，分别打 `aarch64-apple-darwin` / `x86_64-apple-darwin`）
- Linux（`ubuntu-22.04`）

示例：

```bash
git tag v0.1.0
git push origin v0.1.0
```

含 `-` 的 tag（如 `v0.1.0-beta.1`）会标记为预发布。

### 仓库 Secrets（macOS 签名与公证）

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中配置：

| Secret | 说明 |
| --- | --- |
| `APPLE_CERTIFICATE` | Developer ID Application 证书导出的 `.p12` 的 base64（`openssl base64 -A -in cert.p12 -out cert.txt`） |
| `APPLE_CERTIFICATE_PASSWORD` | 导出 `.p12` 时设置的密码 |
| `APPLE_SIGNING_IDENTITY` | 可选；codesign 身份名，例如 `Developer ID Application: Your Name (TEAMID)`。不填时可由证书推断 |
| `APPLE_ID` | Apple ID 邮箱 |
| `APPLE_PASSWORD` | [App 专用密码](https://appleid.apple.com/account/manage)（非登录密码） |
| `APPLE_TEAM_ID` | [Apple Developer 会员信息](https://developer.apple.com/account) 中的 Team ID |

未配置这些 Secrets 时，macOS 仍可构建，但不会完成正式签名/公证；分发到其他 Mac 时可能被 Gatekeeper 拦截。Windows / Linux 构建不依赖上述 Secrets。

仓库需开启 Actions 的 **Read and write permissions**（Settings → Actions → General → Workflow permissions），以便 `tauri-action` 创建/更新 Release。

## 项目结构

```text
src/                 Vite 前端（组件化）
  components/        UI 组件：连接、索引、通用控件
  context/           连接状态
  hooks/             索引查询与删除逻辑
  services/          调用 Tauri Rust 命令
src-tauri/           Tauri 2 后端
  src/es/            Elasticsearch HTTP 客户端
  src/commands/      连接 / 搜索 / 删除命令
```
