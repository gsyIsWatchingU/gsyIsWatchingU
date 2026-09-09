# 算法训练平台 MVP 执行计划

最后更新：2026-09-08

## 1. 交付目标

建设一个独立的算法训练网站，能够在个人 Linux 服务器上持续运行，完成以下闭环：

1. 用户通过 GitHub 登录。
2. 浏览、筛选并打开算法题。
3. 使用 Monaco Editor 编写 JavaScript 或 Python。
4. 运行公开或自定义用例。
5. 提交代码并由服务端隐藏用例判题。
6. 自动保存草稿、提交记录和学习进度。
7. 服务器重启后服务自动恢复。

当前静态页面仅作为 UI 原型。正式平台使用新仓库，个人主页保留项目介绍和跳转入口。

## 2. 默认前提

- 新仓库名：`algorithm-lab`。
- 服务器：Ubuntu 24.04 LTS、x86_64、4 vCPU、8 GB 内存、80 GB 可用磁盘。
- 已有公网 IPv4、域名和 80/443 端口。
- 部署方式：Docker Engine + Docker Compose v2。
- 初期规模：100 名以内注册用户、最多 5 个并发判题任务。
- 不需要 GPU。

如果服务器只有 2 vCPU / 4 GB 内存，将判题 Worker 并发降为 1，并只启用 JavaScript、Python。单服务器只能做到持续运行和自动恢复，不承诺主机故障下的高可用。

## 3. MVP 范围

### 必须实现

- GitHub OAuth 登录和游客只读访问。
- 30 道原创或许可证允许使用的题目。
- 题目列表、标签、难度和完成状态筛选。
- 刷题工作台：题面、Monaco Editor、用例、结果。
- JavaScript、Python 两种语言。
- 公开用例运行、自定义用例运行、隐藏用例提交。
- 编译错误、运行错误、答案错误、超时、内存超限反馈。
- 代码草稿自动保存、提交历史、题目进度和总览看板。
- Docker Compose 一键部署、HTTPS、健康检查、日志轮转和数据库备份。

### 暂不实现

- C++、Java 等更多语言。
- 比赛、排行榜、讨论区、支付和管理员可视化后台。
- AI 提示与解题 Agent。
- 移动端完整代码编辑，仅保证题库和进度可查看。

## 4. 技术选型

| 模块 | 选型 | 说明 |
| --- | --- | --- |
| Web 与 API | Next.js 稳定版、TypeScript | MVP 使用同一应用，减少独立 API 服务 |
| UI | Tailwind CSS、Monaco Editor | 迁移现有刷题页设计 |
| 登录 | Auth.js、GitHub Provider | 与开发者用户群匹配 |
| 数据库 | PostgreSQL、Prisma | 保存题库、提交和学习进度 |
| 队列 | Redis、BullMQ | 异步执行判题任务 |
| 判题 | 自托管 Judge0 CE | 独立网络和资源限制 |
| 反向代理 | Caddy | 自动申请和续期 HTTPS 证书 |
| 测试 | Vitest、Playwright | 单元、集成和端到端测试 |
| 工程 | pnpm workspace、Docker Compose | 统一依赖和部署入口 |

依赖必须锁定具体版本；生产镜像锁定已验证的版本或 digest，不使用 `latest`。

## 5. 系统结构

```text
浏览器
  └─ HTTPS / Caddy
      └─ Next.js Web + API
          ├─ PostgreSQL：账号、题库、草稿、提交、进度
          ├─ Redis：限流、BullMQ 判题队列
          └─ Worker
              └─ Judge0：编译和运行不可信代码
```

生产 Compose 包含：

- `caddy`
- `web`
- `worker`
- `postgres`
- `redis`
- Judge0 官方服务及其专用数据库、Redis

PostgreSQL、Redis、Judge0 API 不映射公网端口，只允许内部 Docker 网络访问。

## 6. 仓库结构

```text
algorithm-lab/
├─ apps/
│  ├─ web/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ lib/
│  │  └─ tests/
│  └─ worker/
│     ├─ src/
│     └─ tests/
├─ packages/
│  ├─ db/
│  │  └─ prisma/schema.prisma
│  ├─ shared/
│  └─ problem-kit/
├─ content/problems/
│  └─ two-sum/
│     ├─ problem.yaml
│     ├─ statement.md
│     ├─ solution.md
│     └─ tests.json
├─ infra/
│  ├─ compose.dev.yml
│  ├─ compose.prod.yml
│  ├─ Caddyfile
│  ├─ judge0/
│  └─ scripts/
│     ├─ deploy.sh
│     ├─ backup.sh
│     └─ restore.sh
├─ docs/
├─ .env.example
├─ pnpm-workspace.yaml
└─ README.md
```

## 7. 核心数据模型

| 模型 | 必要字段 |
| --- | --- |
| `User` | `id`、`name`、`email`、`image`、`createdAt` |
| `Problem` | `id`、`slug`、`title`、`difficulty`、`statement`、`functionName`、`inputSchema`、`outputSchema`、`checkerType`、`status`、`version` |
| `ProblemLanguage` | `problemId`、`language`、`starterCode`、`runnerTemplate` |
| `TestCase` | `problemId`、`visibility`、`input`、`expected`、`sortOrder` |
| `CodeDraft` | `userId`、`problemId`、`language`、`code`、`updatedAt` |
| `Submission` | `id`、`userId`、`problemId`、`mode`、`language`、`code`、`status`、`runtimeMs`、`memoryKb` |
| `SubmissionCase` | `submissionId`、`testCaseId`、`status`、`runtimeMs`、`memoryKb`、`message` |
| `UserProblemProgress` | `userId`、`problemId`、`state`、`attempts`、`firstSolvedAt`、`lastSolvedAt`、`nextReviewAt` |
| `Tag`、`ProblemTag` | 标签及题目关系 |
| `StudyPlan`、`StudyPlanItem` | 学习计划及题目顺序 |

关键约束：

- `CodeDraft` 唯一键：`userId + problemId + language`。
- `UserProblemProgress` 唯一键：`userId + problemId`。
- `Submission` 只追加，不覆盖历史记录。
- 隐藏用例只由 Worker 读取，任何题目接口都不得返回。
- 题目和判题数据带 `version`，提交记录保存当时版本。

进度状态：`NOT_STARTED → ATTEMPTED → SOLVED → MASTERED`。

## 8. API 契约

| 方法 | 路径 | 行为 |
| --- | --- | --- |
| `GET` | `/api/problems` | 分页、标签、难度、进度筛选 |
| `GET` | `/api/problems/:slug` | 返回题面、公开用例和语言模板 |
| `GET` | `/api/problems/:id/drafts/:language` | 获取当前用户草稿 |
| `PUT` | `/api/problems/:id/drafts/:language` | 幂等保存草稿 |
| `POST` | `/api/executions` | 创建运行或提交任务，返回 `submissionId` |
| `GET` | `/api/submissions/:id` | 轮询判题状态和允许展示的结果 |
| `GET` | `/api/submissions` | 当前用户提交历史 |
| `GET` | `/api/progress/summary` | 已完成数量、标签掌握度、连续学习天数 |
| `GET` | `/api/study-plans` | 学习计划及完成进度 |

`POST /api/executions` 请求示例：

```json
{
  "problemId": "problem-id",
  "language": "javascript",
  "code": "function twoSum(nums, target) {}",
  "mode": "RUN",
  "customCases": []
}
```

接口返回 `202 Accepted`。前端每 500 毫秒轮询一次，任务进入终态后停止；60 秒仍未完成则提示服务繁忙。

## 9. 判题规则

### 运行

- `RUN` 只执行公开用例或用户自定义用例。
- 返回输入、预期输出、实际输出和错误信息。
- 记录运行任务，但不将题目标记为已解决。

### 提交

- `SUBMIT` 执行公开和隐藏用例。
- 隐藏用例只返回序号、状态、耗时和内存，不返回输入与预期答案。
- 全部用例通过后，在同一事务中更新进度为 `SOLVED`。

### Worker

1. 从 BullMQ 获取 `submissionId`。
2. 从数据库读取代码、语言和测试用例。
3. 使用 `problem-kit` 生成 JavaScript 或 Python 包装代码。
4. 调用内部 Judge0 API，设置 CPU、内存、进程、文件和输出限制。
5. 标准化 Judge0 状态并保存逐用例结果。
6. 更新提交终态和学习进度。
7. 失败任务最多自动重试两次；用户代码错误不重试。

默认限制：代码 64 KB、运行 2 秒、内存 128 MB、输出 64 KB、同时最多 5 个任务。限制值可由题目覆盖，但不得超过平台上限。

MVP 的 `input`、`expected` 使用 JSON。Worker 按 `inputSchema` 将参数注入题目函数，并通过 Judge0 批量接口让每个用例独立运行，避免一个用例超时掩盖其他结果。校验器支持：

- `EXACT`：JSON 结构和值完全一致。
- `UNORDERED`：数组忽略顺序后比较。
- `FLOAT`：按题目设置的误差范围比较。
- `CUSTOM`：使用平台内置且经过测试的可信校验函数，例如验证“两数之和”返回的两个下标确实满足目标值。

自定义校验器属于平台代码，不从题目 Markdown 或用户输入动态执行。

进度更新规则：首次运行或提交后进入 `ATTEMPTED`；首次全部通过后进入 `SOLVED` 并设置 3 天后复习；到期后再次通过依次延长到 7 天、14 天和 30 天，完成三次到期复习后进入 `MASTERED`。

## 10. 题库规范

首批 30 道题按六组组织：

- 数组与哈希：6 道
- 双指针与滑动窗口：5 道
- 栈、队列与链表：5 道
- 二叉树：5 道
- 二分与排序：4 道
- 动态规划与回溯：5 道

每道题必须具备：

- 原创中文题面或清晰的可再分发许可证。
- JavaScript、Python 初始模板与参考答案。
- 3 个以上公开用例。
- 正常、边界、异常倾向和性能隐藏用例。
- 时间、空间复杂度说明。
- 题目导入校验脚本。

不得抓取或复制力扣题面、题解及会员内容。经典算法模式可以借鉴，但题面、示例和解析必须自行编写。

## 11. 安全与稳定性

- Web 容器不能访问 Docker Socket。
- Judge0 使用独立数据库、Redis 和内部网络。
- 判题环境禁止公网访问，文件系统临时化。
- 所有容器设置 CPU、内存和日志大小上限。
- `web`、`worker`、数据库和队列设置健康检查与 `restart: unless-stopped`。
- 登录、运行和提交接口按用户与 IP 限流。
- Markdown 使用白名单清洗；错误输出按长度截断并转义。
- Cookie 使用 `HttpOnly`、`Secure`、`SameSite=Lax`。
- 生产环境只开放 SSH、HTTP、HTTPS；数据库和 Redis 端口不开放。
- 每日备份 PostgreSQL，保留最近 7 份日备份和 4 份周备份。
- Docker 日志轮转：单文件 10 MB，最多 3 个文件。
- `/api/health/live` 只检查进程；`/api/health/ready` 检查数据库和 Redis。

## 12. 环境变量

`.env.example` 至少包含：

```dotenv
APP_URL=https://algo.example.com
DATABASE_URL=postgresql://algorithm:待配置@postgres:5432/algorithm
REDIS_URL=redis://redis:6379
AUTH_SECRET=待生成
AUTH_GITHUB_ID=待配置
AUTH_GITHUB_SECRET=待配置
JUDGE0_URL=http://judge0-server:2358
JUDGE0_TOKEN=
MAX_CODE_BYTES=65536
RUN_TIMEOUT_MS=2000
SUBMISSION_CONCURRENCY=5
ADMIN_GITHUB_LOGINS=待配置
TZ=Asia/Shanghai
```

真实密钥只存在服务器 `.env`，不得提交到 Git。

## 13. 实施任务与依赖

| 编号 | 工作包 | 依赖 | 主要交付物 | 可并行 |
| --- | --- | --- | --- | --- |
| W0 | 仓库脚手架与规范 | 无 | workspace、CI、共享类型、环境模板 | 否 |
| W1 | Prisma 数据模型与题目导入 | W0 | schema、migration、seed、题目校验器 | 是 |
| W2 | 题库和编辑器前端 | W0 | 列表、详情、Monaco、用例和结果界面 | 是 |
| W3 | 队列与 Judge0 Worker | W0 | BullMQ、包装器、状态映射、限制和重试 | 是 |
| W4 | 登录、草稿与进度 | W1 | Auth.js、草稿同步、提交历史、进度看板 | 否 |
| W5 | 30 道题目内容 | W1、W3 规范 | 题面、模板、答案、测试数据 | 是 |
| W6 | 生产部署 | W0、W3 | Compose、Caddy、备份、恢复、健康检查 | 是 |
| W7 | 集成与加固 | W2～W6 | E2E、限流、安全检查、性能和故障恢复 | 否 |

建议一个主 Agent 负责 W0 和集成，其他 Agent 在 W0 完成后分别认领 W1、W2、W3/W6；W5 应拆成多批，但必须由 W3 的题目校验器统一验收。

## 14. 分阶段执行

### M0：骨架可运行

- 完成 W0。
- 本地 `pnpm lint`、`pnpm typecheck`、`pnpm test` 通过。
- 开发 Compose 能启动 Web、PostgreSQL、Redis。

### M1：一道题完整闭环

- 完成“两数之和”的题库、编辑、运行、提交、草稿和进度。
- JavaScript、Python 正确答案通过。
- 语法错误、运行错误、错误答案和死循环均得到正确状态。

### M2：MVP 功能完整

- 完成 30 道题和学习计划。
- 登录、筛选、提交历史和进度看板可用。
- 完成单元、集成和关键 E2E 测试。

### M3：生产上线

- 使用正式域名和 HTTPS 部署。
- 验证服务器重启后自动恢复。
- 验证数据库备份和恢复。
- 连续运行 72 小时，无未处理异常、队列阻塞或明显内存增长。

## 15. 验收标准

以下条件全部满足才算 MVP 完成：

- 新用户能从登录到完成一道题，全流程无人工干预。
- 30 道题均能以 JavaScript、Python 正确答案通过。
- 每道题至少一个错误实现会被隐藏用例拒绝。
- 死循环在限制时间后终止，不能拖垮 Web 服务。
- 刷新页面后草稿、提交记录和进度仍存在。
- 用户无法通过接口获得隐藏用例。
- 非登录用户不能写入草稿、提交或进度。
- 生产环境只有 80、443 和受控 SSH 端口暴露。
- 重启服务器后所有容器自动启动且健康检查通过。
- 备份文件能够恢复到一个空数据库。
- `lint`、`typecheck`、单元测试、集成测试和 Playwright 关键流程全部通过。

## 16. 部署和运维命令

由执行 Agent 在新仓库实现以下命令：

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
docker compose -f infra/compose.prod.yml config
docker compose -f infra/compose.prod.yml build
docker compose -f infra/compose.prod.yml up -d
docker compose -f infra/compose.prod.yml ps
curl -fsS https://algo.example.com/api/health/ready
```

生产更新采用：拉取指定提交、构建镜像、执行数据库迁移、启动新容器、健康检查。迁移前自动备份；健康检查失败时回滚到上一镜像。

## 17. Agent 执行提示词

将以下内容连同本文档交给主 Agent：

> 按 `docs/plan-list.md` 实现算法训练平台 MVP。先完成 W0，并把所有假设、依赖版本和服务器差异记录在计划中；随后按依赖关系拆分 W1～W6，最后由主 Agent 完成 W7。每个工作包必须包含代码、测试、文档和验证结果。不得把隐藏用例发送到浏览器，不得让 Web 服务直接运行用户代码或访问 Docker Socket。先在本地完成 M1，再扩展题库；所有验收项通过后才能部署。遇到服务器规格、域名、GitHub OAuth 或 SSH 信息缺失时，只完成不依赖这些信息的工作并列出阻塞项，不得虚构配置。

## 18. 当前阻塞项

- 新仓库或目标目录尚未创建。
- 服务器操作系统、CPU、内存、磁盘和公网端口尚未确认。
- 正式域名和 DNS 管理方式尚未确认。
- GitHub OAuth 应用尚未创建。
- Judge0 最终版本和镜像 digest 需要在实施时验证并锁定。
