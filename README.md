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
