# 个人主页

项目已按板块拆分。日常修改 `src`、`styles`、`scripts` 中的源码，不直接修改根目录的 `index.html`。

| 板块 | 页面内容 | 样式 | 交互 |
| --- | --- | --- | --- |
| 首屏 | `src/sections/hero.html` | `styles/hero.css` | `scripts/galaxy.js`、`scripts/cursor.js` |
| 专业技能 | `src/sections/skills.html` | `styles/skills.css` | `scripts/skills.js` |
| 实习经历 | `src/sections/experience.html` | `styles/experience.css` | — |
| 项目实践 | `src/sections/projects.html` | `styles/projects.css` | — |
| 结尾 | `src/sections/closing.html` | `styles/closing.css` | — |

公共头部和页脚在 `src/components`，公共样式在 `styles/base.css`。

```powershell
npm run build
npm run check
```

`npm run build` 会合并 HTML 片段并生成可直接打开的 `index.html`。多人或多个 AI 并行修改时，每个任务只认领对应板块的 HTML、CSS 和 JS 文件即可。
