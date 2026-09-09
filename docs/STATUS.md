# 项目状态

最后更新：2026-09-09

## 当前阶段

维护中。

## 当前目标

完善面向 AI 全栈与 Agent 应用岗位的个人技术主页，并提供可验证的项目与在线体验。

## 已完成

- 已在 Cloudflare APAC 区域创建线上 D1 `gsy-guestbook`，完成表结构迁移并部署 `gsy-guestbook-api` Worker；前端开发与正式环境均直接连接该线上服务。
- 已将主页收敛为首屏星海、专业能力树、实习经历、大型项目实践四个部分。
- 已取消独立留言板块，入口并入首屏操作按钮，留言弹幕直接经过首屏现有星海背景。
- 专业能力区已重写为纵向技术能力树，以 AI 全栈为树根，明确分为全栈开发与 Agent 工程两条主枝，并直接展示工程能力、技术栈与实践线索。
- 能力树支持通过 `scripts/skill-links.js` 配置各分支的飞书实践说明链接。
- 已将留言墙简化为星空弹幕、单一留言按钮和原生弹窗，留言提交成功后立即进入弹幕轨道。
- 已新增 Cloudflare Worker + 远程 D1 留言后端，支持留言直发、防刷限流、每日轮转 IP HMAC 和访客统计；不依赖 Turnstile，本地与正式页面共用线上数据源。
- 已基于个人简历重写首屏职业定位，明确“AI 全栈工程师 / Agent 应用”求职方向。
- 已将项目实践扩展为研发 Agent Harness、教育培训管理平台和在线算法实验室三项，补充规模、技术难点与结果数据。
- 已将项目实践升级为独立产品展示，接入论迹、Algorithm Lab 与 WriteHere 的真实界面截图、工程亮点和在线体验入口，不提供源码入口；研发 Agent Harness 与教育培训管理平台保留为工程经历项目。
- 已增加 `src/data/projects.json` 项目清单与 Schema，构建时统一生成产品卡片，检查脚本验证必填字段、HTTPS 入口和本地截图资源。
- 已补充职业邮箱入口、页面分享元信息、canonical 与个人结构化数据，未在网页公开手机号。
- 已修复实习经历与项目实践锚点被固定导航遮挡的问题。
- 页面已按组件和板块拆分，根页面通过构建脚本生成。
- 已更新个人主页内容与交互式能力展示。
- 专业技能图谱已按“全栈开发 / Agent 工程 / 通用工程能力 / 研发流程”重新分层。
- 已移除专业技能标题说明区，并收紧桌面端能力图高度与留白。
- 导航栏已改为连续银灰白笔刷纹理，下滑后背景透明度提高并保留文字清晰度。
- 除品牌手写字标外，全站文字已统一为中文无衬线字体，并规范字重与标题字距。
- 已添加站点图标及 Apple Touch 图标引用。
- 已收紧 favicon 留白，使标签页中的品牌标志更醒目。
- 已补充项目协作与交接约定。
- 已新增仿刷题平台布局的在线算法练习场，并从主页导航和项目卡片接入。
- 已接入 Monaco Editor，支持 JavaScript 代码补全、行号、括号匹配和快捷键运行。
- 已实现可见用例运行、隐藏用例提交、答案校验、错误反馈和 2 秒超时保护。
- 已实现代码草稿自动保存、代码重置、用例切换和桌面端面板拖拽。

## 下一步

1. 发布最新主页并验证 GitHub Pages 上的弹窗提交、弹幕动画和正式访客计数。
2. ~~按 `docs/plan-list.md` 新建算法训练平台仓库并完成 W0。~~ 已完成（见 `E:/prj-gsy/algorithm-lab`，服务器内网已部署跑通）。
3. 确认服务器规格、域名、DNS 和 GitHub OAuth 配置。
   - 服务器规格已确认（128 vCPU / 503GB / 8TB / 2×L20，K8s Pod）。
   - 域名、DNS、GitHub OAuth 仍缺失，已列为阻塞项（见 `algorithm-lab/docs/deployment.md`）。
4. 确认字节跳动内部项目名称、指标与教育平台域名是否适合公开展示，必要时做进一步脱敏。
5. 为 Agent Harness 与教育培训平台补充脱敏架构图、关键决策和可验证演示材料。
6. 补充 GitHub 与简历下载入口，并在发布后确认 GitHub Pages 页面、分享预览和站点图标显示正常。

## 已知问题

- 浏览器可能缓存旧站点图标，验证时需要强制刷新或清除站点缓存。
- 三个独立产品仍使用 Cloudflare Quick Tunnel 临时地址，服务重启后需更新 `src/data/projects.json`；正式发布应迁移到固定子域名。
- 根目录 `index.html` 是生成文件，修改源码后必须重新构建。
- Monaco Editor 通过 CDN 加载；网络不可用时自动使用基础文本编辑器。
- 当前静态版本仅执行 JavaScript；多语言运行需要后端沙箱。

## 验证结果

- 2026-09-09：完成论迹、Algorithm Lab 与 WriteHere 的个人主页集成；未添加源码入口；`npm run build`、`npm run check`、`git diff --check` 通过，桌面端与 390px 手机端产品区视觉验收通过。
- 2026-09-08：重写专业能力区，移除横向能力网络和悬浮详情，改为“AI 全栈 → 全栈开发 / Agent 工程 → 技术分支 → 共用工程底座”的纵向树结构；`npm run build`、`npm run check` 通过。
- 2026-09-08：修复留言弹窗进入浏览器顶层后鼠标不可见的问题；弹窗打开时使用系统鼠标，关闭后恢复自定义鼠标；`npm run build`、`npm run check` 通过。
- 2026-09-08：移除独立留言大板块与对应导航项，将留言按钮、弹窗和弹幕轨道并入首屏星海；`npm run build`、`npm run check` 通过。
- 2026-09-08：移除 Turnstile 与留言审核流程，完成“按钮 → 弹窗 → 线上 D1 → 星空弹幕”链路；线上留言直发与公开列表验证通过，测试弹幕已删除；`npm run build`、`npm run check` 与后端语法检查通过。
- 2026-09-08：线上 D1 `gsy-guestbook` 迁移成功，线上 Worker 健康检查、访客写入、统计和留言列表接口验证通过；本地 SQLite 已删除，联调记录已清零，localhost 只读线上数据且不计入正式访客统计。
- 2026-09-08：完成主页四部分结构调整与能力树飞书链接配置入口；`npm run build`、`npm run check` 通过。
- 2026-09-08：提高自定义鼠标外圈跟随速度；`npm run build`、`npm run check` 通过。
- 2026-09-08：优化首屏标题、岗位标签和简介排版，降低字号与字重并固定三行断句；`npm run build`、`npm run check` 通过，桌面端浏览器验收通过。
- 2026-09-08：完成算法训练平台 MVP 实施方案，明确架构、数据模型、API、判题、安全、工作包、部署和验收标准。
- 2026-09-08：基于简历完成岗位定位与项目内容改造；`npm run build`、`npm run check` 通过；桌面端首屏、项目区、经历锚点和结尾区域浏览器验收通过，控制台无警告或错误。
- 2026-09-06：Smart Video 技术标签新增 Monorepo；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：Smart Video 技术标签已统一为外部可理解的架构、技术栈与工程能力表达；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：Smart Video 已突出上线 20 天累计获得 `1.2W+ PV`，并补齐 5 项技术标签；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：Agent 工程技术难点标签已精简并调整为桌面端单行展示；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：平台稳定性专项文案已改为“专项治理—分级排期—多仓改动—修复上线”的工程闭环；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：Agent 工程难点标签已移除“上下文压缩”；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：中心定位更新为“全栈开发 × Agent 工程”，说明与标签收敛到专业能力层；桌面端中心标题、详情说明及四个标签截图确认正常；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：实习经历第 03 项完成平台稳定性专项重写，源码与生成页均已包含两大平台、六个仓库和 40+ 项问题的统一口径；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：首屏星轨装饰圆环已移除；按 1288×1058 视口完成截图确认；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：完成全站大字号与高占用留白收紧；`npm run build`、`npm run check`、`git diff --check` 通过。
- 2026-09-06：团队研发提效工具完成内容重写与排序调整；`npm run build`、`npm run check` 通过。
- 2026-09-06：导航栏高度与品牌图标尺寸完成响应式收紧，并为导航样式增加缓存版本；本地 4173 服务确认返回 PC 端 50px、移动端 44px；`npm run build`、`npm run check` 通过。
- 2026-09-06：实习经历完成桌面端与 390px 移动端视觉检查，双列结构保持不变，卡片按内容自适应高度，技术标签换行和数字强调正常，无横向溢出；`npm run build`、`npm run check` 通过。
- 2026-09-04：全站字体、字重与中文标题字距已统一；`npm run build`、`npm run check` 通过。
- 2026-09-04：专业技能标题说明区已移除，能力图完成桌面端与手机端视觉检查；`npm run build`、`npm run check` 通过。
- 2026-09-04：导航栏笔刷纹理已取消重复平铺接缝，滚动透明态保持正常；`npm run build`、`npm run check` 通过。
- 2026-09-04：专业技能图完成桌面端和手机端视觉检查；`npm run build`、`npm run check` 通过。
- 2026-09-04：favicon 已包含 16、32、48、64、128、256px 图层；`npm run build`、`npm run check` 通过。
- 2026-09-03：`npm run check` 通过，HTML 结构、本地资源和脚本语法检查正常。
- 2026-09-07：在线算法练习场完成浏览器验收；正确解法通过 7 个用例，死循环在 2 秒后终止，浏览器控制台无警告或错误；`npm run build`、`npm run check` 通过。
- 2026-09-08：完成算法训练平台 MVP（`E:/prj-gsy/algorithm-lab`）并部署到 GPU 服务器内网（`192.168.88.122:3000`）。技术栈 Next.js 16 + Prisma 6 + PostgreSQL 14 + Redis + BullMQ + 原生沙箱；`pnpm typecheck` 全仓通过、23 个单元测试通过、`next build` 成功；端到端判题验证 ACCEPTED / TIME_LIMIT_EXCEEDED / COMPILE_ERROR 三态正确，隐藏用例零泄露。判题后端由 Judge0（Docker）改为原生沙箱——实测目标主机为 K8s Pod 缺 CAP_SYS_ADMIN 无法运行容器（详见 `algorithm-lab/docs/deployment.md`）。
