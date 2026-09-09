# 项目部署与更新总览

最后更新：2026-09-09

> 当前入口取自各项目仓库配置。`trycloudflare.com` 为 Cloudflare Quick Tunnel 临时地址，服务重启后可能变化；更新前应按本文命令重新查询。

## 项目总表

| 项目 | 当前情况 | 技术栈 | 部署位置 | 当前入口 |
| --- | --- | --- | --- | --- |
| 个人主页 | 维护中，展示个人经历、能力树、项目和留言弹幕 | HTML、CSS、JavaScript、Node.js 构建脚本；留言服务使用 Cloudflare Worker + D1 | 页面：GitHub Pages；留言：Cloudflare Worker + D1 | [gsyiswatchingu.github.io](https://gsyiswatchingu.github.io/) |
| Coffee Research | V0.1 GPU 演示环境，已完成 PDF 阅读、检索、翻译、批注和笔记闭环 | React 19、TypeScript、Vite、PDF.js、FastAPI、PyMuPDF、SQLite | GPU 服务器 `/workspace/projects/research-workbench`，端口 `8008`，Supervisor 守护 | [临时入口](https://elementary-von-appreciation-stretch.trycloudflare.com) |
| 算法训练平台 | MVP GPU 演示环境，支持题库、异步判题、学习进度和公共/私人题库治理 | Next.js 16、React 19、Prisma 6、PostgreSQL 14、Redis、BullMQ、Monaco Editor | GPU 服务器 `/workspace/algorithm-lab`，端口 `3000`，Supervisor 守护 | [临时入口](https://forget-charges-glass-accordance.trycloudflare.com) |
| Horizon Docs | Demo GPU 演示环境，支持在线文档、分享、评论和实时协作 | Vue 3、Vite、TipTap、Yjs、Express、WebSocket、SQLite | GPU 服务器 `/workspace/projects/write-here`，端口 `3210`，Supervisor 守护 | [临时入口](https://dollar-wendy-buildings-year.trycloudflare.com) |

## 1. 个人主页

本地仓库：`E:\prj-gsy\gsyIsWatchingU`

更新流程：

```powershell
cd E:\prj-gsy\gsyIsWatchingU
# 修改 src、styles、scripts，不直接维护根目录 index.html
npm run build
npm run check
git add <本次修改的文件>
git commit -m "feat: 更新个人主页"
git push origin main
```

推送到 `main` 后由 GitHub Pages 发布。项目入口或 Quick Tunnel 地址变化时，修改 `src/data/projects.json`，然后重新执行构建、检查和推送。

留言服务单独部署：

```powershell
cd E:\prj-gsy\gsyIsWatchingU\backend
npm run check
# 仅有数据库迁移时执行
npm run db:migrate:remote
npm run deploy
```

- 留言 API：`https://gsy-guestbook-api.gsyiswatchingu.workers.dev`
- 线上数据库：Cloudflare D1 `gsy-guestbook`

## 2. Coffee Research

本地仓库：`E:\prj-gsy\research-workbench`

更新流程：

```powershell
cd E:\prj-gsy\research-workbench
git add <本次修改的文件>
git commit -m "feat: 更新 Coffee Research"
git push origin main
```

推送到 `main` 后自动构建和测试；只有仓库变量 `CD_ENABLED=true` 且生产环境 Secrets 已配置时，才会自动同步到 GPU 服务器并重启服务。

服务器维护：

```bash
cd /workspace/projects/research-workbench
bash scripts/status.sh
bash scripts/public-url.sh
```

`public-url.sh` 输出的地址如果变化，需要同步修改个人主页 `src/data/projects.json` 中 `research-workbench.entryUrl`。

## 3. 算法训练平台

本地仓库：`E:\prj-gsy\algorithm-lab`

更新流程：

```powershell
cd E:\prj-gsy\algorithm-lab
pnpm typecheck
pnpm test
pnpm problems:validate
pnpm --filter @al/web build
git add <本次修改的文件>
git commit -m "feat: 更新算法训练平台"
git push origin main
```

推送到 `main` 后先执行 CI，再由 Windows 自托管 Runner 通过 SSH 部署到 GPU 服务器；Runner 必须在线。Runner 不可用时可手动发布当前提交：

```powershell
$commitSha = git rev-parse HEAD
.\infra\scripts\deploy-ci.ps1 -SshTarget mygpu -CommitSha $commitSha
```

查询服务和临时入口：

```bash
supervisorctl -c /workspace/etc/supervisord.conf status
grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' /workspace/logs/cloudflared.err.log | tail -1
```

地址变化后，修改个人主页 `src/data/projects.json` 中 `algorithm-lab.entryUrl`。

## 4. Horizon Docs

本地仓库：`E:\prj-gsy\write-here`

更新流程：

```powershell
cd E:\prj-gsy\write-here
npm run build --prefix frontend
node --check backend/server.js
git add <本次修改的文件>
git commit -m "feat: 更新 Horizon Docs"
git push origin main
```

推送到 `main` 后，GitHub Actions 先检查构建，再通过 SSH 发布到 GPU 服务器。自动部署依赖 `GPU_HOST`、`GPU_PORT`、`GPU_USER`、`GPU_SSH_PRIVATE_KEY`、`GPU_KNOWN_HOSTS` 五项 Secrets。

服务器维护：

```bash
cd /workspace/projects/write-here
bash deploy/start.sh
node deploy/verify.js
bash deploy/public-url.sh
```

- 唯一业务数据库：`/workspace/projects/write-here/db/docs.db`
- 发布包不得覆盖 `db/`、日志、运行目录和环境变量文件。
- 地址变化后，修改个人主页 `src/data/projects.json` 中 `write-here.entryUrl`。

## 通用更新检查

1. 先确认当前分支和未提交修改：`git status`。
2. 只提交本次变更，不覆盖服务器上的数据库、密钥和环境变量。
3. 推送后检查 CI/CD 结果和线上健康状态。
4. Quick Tunnel 地址变化后，更新个人主页项目清单并重新发布主页。
5. 正式对外使用时，将三个临时入口迁移为 Cloudflare Named Tunnel + 自有固定域名。
