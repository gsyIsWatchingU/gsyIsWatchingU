# AI 科研阅读工作台执行方案

最后更新：2026-09-08

## 1. 交付目标

新建独立项目 `research-workbench`，交付一个面向 Windows 和现代浏览器的科研阅读网站，完成以下闭环：

1. 用户登录并上传 PDF。
2. 在线阅读论文，支持缩放、目录、搜索和页面跳转。
3. 划词翻译、高亮、批注和阅读笔记。
4. 按文件夹、标签和研究主题组织论文。
5. 对单篇论文进行结构化理解和可定位问答。
6. 对多篇论文进行带引用的 RAG 检索与综合。
7. 通过研究配置包定制分类、抽取字段、数据源和质量规则。
8. 通过连接器同步 Zotero、OpenAlex 等来源，并执行受控操作。
9. 以独立站点部署，通过项目清单接入个人技术主页。

本项目不是完整复刻 Zotero，也不在首版实现自动科研或自动写论文。核心价值是把论文阅读、笔记、证据和 AI 操作连接成可追溯工作流。

## 2. 默认前提

- 独立仓库：`research-workbench`。
- 客户端：Windows 11 上的 Chrome、Edge，兼容其他桌面浏览器。
- 形态：响应式 Web + PWA，不优先开发 Electron 客户端。
- 首期规模：100 名以内邀请用户、每人最多 500 篇论文。
- 单文件上限：100 MB，扫描版 PDF 在后续阶段支持 OCR。
- 部署：Linux、Docker Engine、Docker Compose v2、HTTPS。
- 首版界面语言：简体中文，数据模型预留多语言字段。
- PDF 默认私有，不公开分享用户上传的论文。
- 若服务器只有 4 vCPU / 8 GB 内存，解析 Worker 并发设为 2，AI并发设为 2。

缺少域名、OAuth、模型密钥或服务器信息时，执行 Agent 继续完成本地开发，不得虚构生产配置。

## 3. 版本边界

### V0.1：阅读闭环

- 邮箱或 GitHub 登录。
- PDF 上传、解析状态、删除和基础元数据编辑。
- PDF 缩放、搜索、目录、页码跳转和双栏阅读。
- 划词翻译、高亮、批注和 Markdown 笔记。
- 文件夹、标签、收藏和最近阅读。
- PWA 安装、桌面端适配和自动保存。

### V0.2：单篇 AI

- 划词解释、术语解释和段落总结。
- 自动提取研究问题、方法、数据集、结论和局限。
- 基于当前论文问答。
- 每个回答必须引用页码和原文片段。
- 人工确认后将 AI 结果写入笔记。

### V0.3：多论文 RAG

- 全文与向量混合检索。
- 跨论文问答、方法对比和结论冲突发现。
- 回答展示来源论文、页码、原文和相关度。
- 支持按文件夹、标签、年份和研究主题过滤。
- 建立固定评测集，持续验证召回率和引用正确性。

### V0.4：研究配置与连接器

- 研究配置包 `Research Pack`。
- Zotero 只读增量同步。
- OpenAlex、arXiv、Semantic Scholar 检索连接器。
- 经用户确认后写回标签或笔记。
- 连接器凭证、增量游标、重试和审计。

### 暂不实现

- 自动投稿、自动生成完整论文。
- 自动运行来源不明的论文代码。
- 公开论文分享社区、评论和关注系统。
- 团队计费、机构权限和复杂协作。
- 手机端完整 PDF 批注，仅保证资料浏览和笔记查看。
- 运行时微前端和跨项目共享状态。

## 4. 核心用户流程

### 阅读流程

```text
上传 PDF
  → 后台解析元数据和文本层
  → 打开阅读器
  → 划词翻译 / 高亮 / 批注
  → 整理阅读笔记
  → 归入文件夹、标签和研究主题
```

### AI 流程

```text
选择文字、页面、章节或论文集合
  → 检索可引用上下文
  → 模型生成结构化结果
  → 引用校验
  → 用户确认
  → 保存为笔记或研究证据
```

### 连接器流程

```text
创建连接器
  → 验证凭证
  → 首次同步
  → 保存增量游标
  → 定期拉取变化
  → 去重和更新索引
  → 写操作先预览、再确认执行
```

## 5. 技术选型

| 模块 | 选型 | 说明 |
| --- | --- | --- |
| Monorepo | pnpm workspace | 管理 Web、共享类型和集成清单 |
| Web | Next.js、TypeScript | 产品页面、PWA和 Backend for Frontend |
| UI | Tailwind CSS、Headless UI | 自建科研阅读界面与主题变量 |
| PDF | PDF.js | 渲染、文本层、搜索和选区定位 |
| API | FastAPI、Pydantic | 文档、翻译、AI、RAG和连接器接口 |
| 数据库 | PostgreSQL、SQLAlchemy、Alembic | 业务数据、隔离和迁移 |
| 向量检索 | pgvector | 首版降低部署复杂度 |
| 对象存储 | S3 兼容存储；本地使用 MinIO | 私有 PDF 和派生产物 |
| 队列 | Redis、Celery | 解析、嵌入、同步和长时间 AI 任务 |
| PDF 解析 | PyMuPDF | 文本、页码、坐标和元数据 |
| OCR | 独立适配器，V0.3 后启用 | 不阻塞首版文本型 PDF |
| 翻译与模型 | Provider 接口 | 支持远程模型和 OpenAI 兼容接口 |
| 测试 | Vitest、Pytest、Playwright | 单元、集成和端到端测试 |
| 部署 | Docker Compose、Caddy | HTTPS、健康检查和服务恢复 |

依赖必须锁定版本；生产镜像使用已验证版本或 digest，不使用 `latest`。

## 6. 系统结构

```text
浏览器 / PWA
  └─ Caddy
      └─ Next.js Web + BFF
          ├─ FastAPI
          │   ├─ PostgreSQL + pgvector
          │   ├─ Redis
          │   ├─ S3 / MinIO
          │   └─ Celery Worker
          │       ├─ PDF 解析
          │       ├─ 翻译与 AI
          │       ├─ 向量化
          │       └─ 连接器同步
          └─ 外部服务
              ├─ 模型 Provider
              ├─ Zotero
              ├─ OpenAlex
              ├─ arXiv
              └─ Semantic Scholar
```

浏览器只访问 Next.js BFF，不直接暴露内部 FastAPI、数据库、Redis 和 MinIO。上传和下载通过短时签名 URL 完成，避免 PDF 经过 Web 进程中转。

## 7. 仓库结构

```text
research-workbench/
├─ apps/
│  ├─ web/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ features/
│  │  ├─ lib/
│  │  └─ tests/
│  └─ api/
│     ├─ app/
│     │  ├─ api/
│     │  ├─ core/
│     │  ├─ models/
│     │  ├─ services/
│     │  ├─ workers/
│     │  └─ connectors/
│     ├─ migrations/
│     └─ tests/
├─ packages/
│  ├─ contracts/
│  ├─ design-tokens/
│  └─ integration-manifest/
├─ research-packs/
│  └─ agent-engineering/
│     ├─ pack.yaml
│     ├─ taxonomy.yaml
│     ├─ extraction.yaml
│     └─ prompts/
├─ fixtures/
│  └─ papers/
├─ infra/
│  ├─ compose.dev.yml
│  ├─ compose.prod.yml
│  ├─ Caddyfile
│  └─ scripts/
├─ docs/
├─ .env.example
├─ pnpm-workspace.yaml
└─ README.md
```

测试 PDF 必须自行生成、来自公共领域或使用明确允许再分发的许可证。

## 8. 页面与交互

### 必要页面

- `/library`：论文库、文件夹、标签和筛选。
- `/papers/:id`：三栏论文阅读器。
- `/notes`：全部笔记和高亮。
- `/research/:id`：研究主题、论文集合和研究配置。
- `/search`：全文、语义和混合检索。
- `/connectors`：连接器、同步状态和权限。
- `/settings`：模型、翻译、存储和隐私设置。

### 阅读器布局

```text
┌────────────┬────────────────────────┬────────────────┐
│ 目录/缩略图 │       PDF 阅读区        │ 批注/笔记/AI   │
│ 搜索结果    │                        │ 当前上下文      │
└────────────┴────────────────────────┴────────────────┘
```

选中文字后显示：`翻译`、`高亮`、`批注`、`解释`、`复制`。AI 结果不得自动覆盖用户笔记。

## 9. 核心数据模型

| 模型 | 必要字段 |
| --- | --- |
| `User` | `id`、`email`、`name`、`createdAt` |
| `Workspace` | `id`、`ownerId`、`name` |
| `Paper` | `id`、`workspaceId`、`title`、`authors`、`year`、`doi`、`abstract`、`status` |
| `PaperFile` | `paperId`、`objectKey`、`sha256`、`mimeType`、`size`、`pageCount` |
| `Collection` | `id`、`workspaceId`、`parentId`、`name` |
| `Tag`、`PaperTag` | 标签及论文关系 |
| `Annotation` | `paperId`、`userId`、`type`、`color`、`anchor`、`comment` |
| `Note` | `id`、`paperId`、`userId`、`title`、`contentMd`、`source`、`version` |
| `DocumentChunk` | `paperId`、`pageFrom`、`pageTo`、`text`、`embedding`、`locator` |
| `ResearchProject` | `id`、`workspaceId`、`name`、`packId` |
| `Evidence` | `projectId`、`paperId`、`claim`、`quote`、`locator`、`status` |
| `AiTask` | `id`、`userId`、`type`、`status`、`model`、`usage`、`error` |
| `Citation` | `aiTaskId`、`paperId`、`chunkId`、`quote`、`locator` |
| `Connector` | `id`、`workspaceId`、`type`、`encryptedCredential`、`status` |
| `ConnectorCursor` | `connectorId`、`cursor`、`lastSyncedAt` |

所有业务查询必须按 `workspaceId` 隔离。PDF、分块、向量、笔记和任务日志不得跨工作区访问。

## 10. 批注锚点

批注不能只保存字符偏移。保存以下组合：

```typescript
type TextAnchor = {
  page: number
  exact: string
  prefix: string
  suffix: string
  rects: Array<{ x: number; y: number; width: number; height: number }>
  textLayerVersion: string
}
```

恢复顺序：

1. 使用 `exact + prefix + suffix` 匹配文本层。
2. 多个结果时按页面和坐标选择最近项。
3. 文本匹配失败时使用坐标兜底并提示“定位可能偏移”。
4. 文档哈希变化时不静默迁移批注，创建待确认迁移任务。

## 11. API 契约

| 方法 | 路径 | 行为 |
| --- | --- | --- |
| `POST` | `/api/uploads` | 创建上传任务并返回签名 URL |
| `POST` | `/api/uploads/:id/complete` | 校验文件并创建解析任务 |
| `GET` | `/api/papers` | 分页、文件夹、标签、年份和状态筛选 |
| `GET` | `/api/papers/:id` | 论文元数据、文件和解析状态 |
| `PATCH` | `/api/papers/:id` | 更新允许编辑的元数据 |
| `DELETE` | `/api/papers/:id` | 删除论文及派生数据 |
| `POST` | `/api/papers/:id/annotations` | 创建高亮或批注 |
| `PATCH` | `/api/annotations/:id` | 幂等更新批注 |
| `GET` | `/api/papers/:id/notes` | 获取论文笔记 |
| `PUT` | `/api/notes/:id` | 带版本号保存笔记 |
| `POST` | `/api/translate` | 翻译选中文字并缓存结果 |
| `POST` | `/api/ai/extract` | 创建单篇结构化抽取任务 |
| `POST` | `/api/ai/ask` | 创建单篇或多论文问答任务 |
| `GET` | `/api/tasks/:id/events` | SSE 返回任务进度与结果 |
| `POST` | `/api/search` | 全文、向量或混合检索 |
| `POST` | `/api/connectors` | 创建连接器 |
| `POST` | `/api/connectors/:id/sync` | 创建增量同步任务 |
| `POST` | `/api/actions/preview` | 预览外部写操作 |
| `POST` | `/api/actions/:id/confirm` | 用户确认后执行操作 |

所有创建型接口支持 `Idempotency-Key`。笔记更新使用 `version` 或 `If-Match` 防止覆盖。

## 12. 翻译与 AI Provider

业务层不得直接依赖某一家模型 SDK：

```python
class TranslationProvider(Protocol):
    async def translate(self, request: TranslationRequest) -> TranslationResult: ...

class EmbeddingProvider(Protocol):
    async def embed(self, texts: list[str]) -> list[list[float]]: ...

class ChatProvider(Protocol):
    async def stream(self, request: ChatRequest) -> AsyncIterator[ChatEvent]: ...
```

需要支持：

- 平台提供的共享模型额度。
- 用户自带 API Key。
- OpenAI 兼容接口。
- 超时、重试、限流、熔断和降级。
- 按用户统计模型、Token、耗时和费用估算。
- Provider 密钥加密保存，日志不得输出密钥和论文全文。

翻译缓存键至少包含：文本哈希、源语言、目标语言、Provider 和模型版本。

## 13. RAG 与引用规则

### 入库

1. 提取页级文本与坐标。
2. 基于标题、段落和页码切分，不跨越不相关章节。
3. 保存父段落和子分块关系。
4. 生成全文索引与向量。
5. 每个分块保留 `paperId`、页码、原文和坐标定位。

### 查询

1. 根据用户选择限制论文范围。
2. 执行全文与向量混合召回。
3. 去重并重排。
4. 只将可定位分块交给模型。
5. 模型只能引用系统提供的 `citationId`。
6. 后处理校验引用存在、工作区一致且原文可定位。
7. 校验失败的结论标记为“缺少可靠来源”，不得生成虚假引用。

### 评测集

至少准备 10 篇许可明确的论文、30 个问题和人工标注来源页。必须统计：

- `Recall@5`、`Recall@10`。
- 引用存在率。
- 引用支持率。
- 无依据结论率。
- 单次任务耗时、Token 和失败率。

V0.3 验收目标：`Recall@10 ≥ 0.85`，引用存在率 `100%`，引用支持率 `≥ 0.90`，不得出现不存在的论文或页码。

## 14. Research Pack

领域能力使用配置包实现，不写死在 Agent 代码中：

```yaml
id: agent-engineering
version: 1.0.0
name: Agent 工程研究

sources:
  - openalex
  - arxiv
  - semantic_scholar

search:
  keywords:
    - agent reliability
    - tool-use evaluation
  venues:
    - ACL
    - NeurIPS
    - ICLR
  since: 2023

taxonomy:
  - Agent 架构
  - 工具调用
  - 记忆
  - 评测
  - 安全与可靠性

extraction:
  - research_question
  - method
  - dataset
  - baselines
  - results
  - limitations

quality:
  require_locator: true
  require_primary_source: true
```

加载时使用 JSON Schema 校验。配置包只能声明允许的连接器和抽取字段，不得执行任意代码。需要代码扩展时，通过经过审核的服务器插件实现。

## 15. 连接器规范

连接器分为两类：

```python
class SourceConnector(Protocol):
    async def validate(self) -> ConnectorHealth: ...
    async def sync(self, cursor: str | None) -> SyncBatch: ...
    async def fetch(self, external_id: str) -> SourceItem: ...

class ActionConnector(Protocol):
    async def preview(self, request: ActionRequest) -> ActionPreview: ...
    async def execute(self, request: ActionRequest) -> ActionResult: ...
```

V0.4 连接器优先级：

1. Zotero：集合、条目、标签、笔记和附件元数据，只读同步优先。
2. OpenAlex：论文检索和元数据补全。
3. arXiv：检索、版本和 PDF 地址。
4. Semantic Scholar：引用数、参考文献和相关论文。
5. 本地目录：监听或定时扫描新增 PDF。

写回 Zotero 标签或笔记必须先展示差异并由用户确认。外部操作保存幂等键、请求摘要、执行者、结果和时间。

## 16. 安全与隐私

- PDF 和附件默认私有，对象存储禁止公开访问。
- 上传地址和下载地址短时有效，并绑定工作区和文件。
- 文件名由服务端重新生成，不信任客户端路径。
- 校验 MIME、扩展名、文件头、大小和 SHA-256。
- PDF 解析在无公网、受限 CPU、内存和时间的 Worker 中执行。
- Markdown、模型输出和 PDF 元数据统一转义或白名单清洗。
- 向量查询必须附带 `workspaceId` 过滤条件。
- 用户可以导出笔记和元数据，并彻底删除论文与派生索引。
- 外部模型处理 PDF 内容前明确提示数据流向。
- 登录、上传、翻译、AI和同步接口分别限流。
- Cookie 使用 `HttpOnly`、`Secure`、`SameSite=Lax`。
- 生产环境只开放受控 SSH、80 和 443。

## 17. 个人站集成方案

### 首期：独立应用

- 个人站：`https://example.com`。
- 科研工作台：`https://research.example.com`。
- 个人站只展示项目卡片、截图、技术亮点和“在线体验”入口。
- 两个项目独立仓库、独立部署、独立故障域。
- 共享设计变量，不共享运行时依赖。

当前阶段不使用 iframe 和 Module Federation。多个应用尚未形成稳定共享边界时，运行时微前端会增加发布、鉴权、版本和调试成本。

### 统一应用清单

每个独立项目公开：

```json
{
  "id": "research-workbench",
  "name": "AI 科研阅读工作台",
  "version": "0.1.0",
  "entryUrl": "https://research.example.com",
  "healthUrl": "https://research.example.com/api/health/ready",
  "iconUrl": "https://research.example.com/icon.svg",
  "capabilities": ["pdf-reader", "translation", "notes", "rag"]
}
```

个人站从构建期配置读取应用清单，生成项目入口。清单必须有 JSON Schema 和 CI 校验。

### 后期统一壳

只有在至少三个独立应用稳定上线后，再评估统一壳：

- 使用同一顶级域名和统一导航。
- 通过 OIDC 实现单点登录。
- 使用反向代理将应用映射到 `/apps/:appId` 或继续使用子域名。
- 应用间只通过 URL、标准事件和后端 API 通信。
- 保持独立构建、独立部署和失败隔离。

优先选择路由级集成；仅在确实需要同页组合多个独立团队模块时再使用运行时微前端。

## 18. 实施工作包

| 编号 | 工作包 | 依赖 | 主要交付物 | 可并行 |
| --- | --- | --- | --- | --- |
| W0 | 仓库脚手架与规范 | 无 | Monorepo、CI、环境模板、共享契约 | 否 |
| W1 | 数据模型、认证与租户隔离 | W0 | Migration、登录、BFF鉴权、权限测试 | 是 |
| W2 | PDF上传、存储与解析 | W0 | 签名上传、文件校验、Worker、文本坐标 | 是 |
| W3 | PDF阅读器 | W0 | PDF.js、目录、搜索、选区和PWA | 是 |
| W4 | 批注、笔记和资料组织 | W1、W3 | 锚点、高亮、Markdown笔记、标签、文件夹 | 否 |
| W5 | 翻译 Provider | W1、W3 | 划词翻译、缓存、流控、错误反馈 | 是 |
| W6 | 单篇 AI | W2、W4、W5 | 结构抽取、单篇问答、引用校验 | 否 |
| W7 | 多论文 RAG | W2、W6 | pgvector、混合检索、重排、评测集 | 否 |
| W8 | Research Pack | W6 | Schema、加载器、示例领域包 | 是 |
| W9 | 连接器 | W1、W2、W8 | Zotero、OpenAlex、arXiv、同步审计 | 是 |
| W10 | 部署、监控和备份 | W0～W7 | Compose、Caddy、健康检查、恢复演练 | 否 |
| W11 | 个人站集成 | W10 | 应用清单、项目入口、公开演示说明 | 否 |
| W12 | 全量验收与加固 | W4～W11 | E2E、性能、安全、72小时运行 | 否 |

一个主 Agent 负责 W0、接口契约和最终集成。W0 完成后，可并行认领 W1、W2、W3；随后按依赖推进。多个 Agent 不得同时修改同一数据模型或公共契约，变更契约必须先由主 Agent 合并。

## 19. 分阶段执行

### M0：骨架可运行

- Web、API、PostgreSQL、Redis、MinIO 本地启动。
- CI 执行格式、Lint、类型检查和单元测试。
- `/api/health/live` 与 `/api/health/ready` 可用。

### M1：PDF 阅读闭环

- 完成 W1～W5。
- 用户能够上传、阅读、翻译、批注和保存笔记。
- 刷新和重新登录后批注仍定位到正确原文。
- Windows Chrome、Edge 通过端到端测试。

### M2：单篇 AI

- 完成 W6。
- 结构化笔记字段可人工编辑。
- 回答引用可跳转到对应页和原文。
- 引用校验失败时不展示伪造来源。

### M3：多论文研究

- 完成 W7、W8。
- 研究主题可以绑定论文范围和 Research Pack。
- 完成固定评测集并达到质量目标。

### M4：连接器与公开测试

- 完成 W9～W11。
- Zotero 增量同步可恢复、可重试、不重复导入。
- 部署邀请制测试，限制每用户存储和 AI 配额。
- 从个人站可以进入在线体验。

### M5：生产验收

- 完成 W12。
- 备份恢复、服务重启、模型超时和连接器失败演练通过。
- 连续运行 72 小时，无队列阻塞、未处理异常或明显内存增长。

## 20. 验收标准

以下条件全部满足才算 V0.4 完成：

- 新用户无需本地配置即可完成上传、阅读、翻译、批注和笔记。
- 50 MB 文本型 PDF 能成功上传、解析和阅读。
- 页面刷新后至少 99% 的测试批注恢复到正确文字位置。
- 两个用户无法通过 URL、搜索、向量检索或对象地址访问对方资料。
- 删除论文后，PDF、缩略图、文本、向量和缓存全部进入可追踪删除流程。
- 模型超时、限流和不可用时界面提供明确反馈，任务可重试。
- 所有 AI 引用都能跳转到实际论文和页码。
- RAG 评测达到第 13 节质量目标。
- Zotero 重复同步不产生重复论文和重复笔记。
- 外部写操作未经用户确认不能执行。
- Chrome、Edge 最新稳定版完成关键 Playwright 流程。
- PWA 可安装，在无网络时能够打开已缓存应用壳并显示离线提示。
- Docker Compose 重启后服务自动恢复，数据库备份可恢复到空环境。
- 前端 Lint、类型检查、单元测试，后端类型检查、单元测试、集成测试和 E2E 全部通过。

## 21. 运维要求

- `/api/health/live` 只检查进程。
- `/api/health/ready` 检查数据库、Redis和对象存储。
- Worker 任务记录开始、进度、终态、重试次数和错误类型。
- 每日备份 PostgreSQL，保留 7 份日备份和 4 份周备份。
- 对象存储启用版本或延迟删除策略时，文档中明确恢复与彻底删除流程。
- Docker 日志轮转：单文件 10 MB，最多 3 个文件。
- 监控上传失败率、解析失败率、队列长度、AI失败率、响应延迟和存储用量。
- 生产更新：备份、迁移、启动、健康检查；失败时回滚上一镜像。

## 22. Agent 执行提示词

将本文档复制到新仓库，并把以下提示词交给主 Agent：

> 按 `docs/research-workbench-plan.md` 实现 AI 科研阅读工作台。先完成 W0，锁定依赖版本、数据契约、批注锚点和安全边界，再按依赖关系拆分任务。第一目标是 M1 的 Windows PDF 阅读闭环，不得提前用复杂 Agent 或多论文 RAG 掩盖基础阅读问题。每个工作包必须提交代码、测试、简洁中文文档和实际验证结果。所有 PDF、笔记、分块、向量和对象访问必须按工作区隔离；模型不得生成不存在的引用；所有外部写操作必须预览并由用户确认。当前个人主页只在 M4 后添加项目入口，不把科研工作台业务代码放入个人主页仓库。缺少域名、OAuth、模型密钥或服务器信息时，继续完成本地功能并记录阻塞项，不得虚构配置。每个里程碑完成后更新功能清单、路线记录和交接状态，全部验收项通过后才能标记完成。

## 23. 当前阻塞项

- 新仓库或目标目录尚未创建。
- 正式域名、服务器规格和部署位置尚未确认。
- 登录方式及 OAuth 应用尚未确认。
- 平台模型额度与用户自带 API Key 策略尚未最终确认。
- PDF 和数据库的备份介质尚未确认。
- 首个 Research Pack 的具体研究方向尚未最终确认。
