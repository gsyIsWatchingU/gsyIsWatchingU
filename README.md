# 个人主页

项目已按板块拆分。日常修改 `src`、`styles`、`scripts` 中的源码，不直接修改根目录的 `index.html`。

| 板块 | 页面内容 | 样式 | 交互 |
| --- | --- | --- | --- |
| 首屏星海与留言弹窗 | `src/sections/hero.html`、`src/sections/guestbook.html` | `styles/hero.css`、`styles/guestbook.css` | `scripts/galaxy.js`、`scripts/guestbook.js` |
| 专业能力树 | `src/sections/skills.html` | `styles/skills.css` | `scripts/skill-links.js`、`scripts/skills.js` |
| 实习经历 | `src/sections/experience.html` | `styles/experience.css` | — |
| 独立产品与工程经历 | `src/sections/projects.html`、`src/data/projects.json` | `styles/projects.css` | — |

公共头部和页脚在 `src/components`，公共样式在 `styles/base.css`。

能力分支的飞书实践说明链接统一配置在 `scripts/skill-links.js`。填写对应 URL 后，页面会显示实践说明入口。

独立产品的文案、在线入口与截图统一配置在 `src/data/projects.json`，字段约束见 `src/data/projects.schema.json`，真实页面截图位于 `assets/projects`。

在线刷题页源码位于 `src/playground.html`，样式和交互分别位于 `styles/playground.css`、`scripts/playground.js`。该页面提供 JavaScript 编辑、用例运行、隐藏用例提交、超时保护和草稿自动保存。

留言后端位于 `backend`，使用 Cloudflare Worker 和远程 D1，配置与查询方法见 [`backend/README.md`](backend/README.md)。

算法训练平台的全栈 MVP 方案见 [`docs/plan-list.md`](docs/plan-list.md)，功能状态和开发记录见 [`docs/feature-list.md`](docs/feature-list.md)、[`docs/work-roadmap.md`](docs/work-roadmap.md)。

```powershell
npm run build
npm run check
```

`npm run build` 会合并 HTML 片段并生成可直接打开的 `index.html`。多人或多个 AI 并行修改时，每个任务只认领对应板块的 HTML、CSS 和 JS 文件即可。
