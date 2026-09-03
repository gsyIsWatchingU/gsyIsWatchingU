# 项目协作约定

## 项目定位

本仓库是个人主页静态站点，根目录 `index.html` 用于部署，源码位于 `src`、`styles` 和 `scripts`。

## 开始任务时

1. 阅读 `README.md` 和 `docs/STATUS.md`。
2. 执行 `git status`，保留已有未提交修改。
3. 页面内容优先修改 `src` 下的源码，不直接维护根目录 `index.html`。

## 目录约定

- `src/components`：公共页面片段。
- `src/sections`：各页面板块。
- `styles`：公共样式与板块样式。
- `scripts`：交互脚本、构建和检查脚本。
- `assets`：图片等静态资源。

## 验证要求

```powershell
npm run build
npm run check
```

提交前确认根目录 `index.html` 已由最新源码生成，且本地资源检查通过。

## 交接要求

- 离开当前电脑前更新 `docs/STATUS.md`，记录完成项、下一步、问题和验证结果。
- 提交并推送当前分支，确认远程分支包含最新提交。
- 不提交临时文件、编辑器配置或与项目无关的内容。
