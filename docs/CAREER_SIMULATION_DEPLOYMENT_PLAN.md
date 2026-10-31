# Career Simulation（Rehearsal Room）— 部署到现站方案（细化版）

> **状态**: 方案保留 · 尚未实现  
> **来源 artifact**: https://claude.ai/public/artifacts/9c422816-caf6-4bf8-a43d-0d115054a59e  
> **Artifact 标题**: `career_simulation.html` / Rehearsal Room – Career Simulation  
> **记录日期**: 2026-10-18 · **细化**: 2026-10-19 · **需求更新**: 2026-10-19（晚）  
> **模型默认**: **Claude（Anthropic）**（经 Cloud Run 代理；禁止浏览器直连）  
> **目标环境**: https://www.heeriseacademy.com（Hugo Firebase Hosting + Cloud Run FastAPI）  
> **本地工作分支约定**: 始终在 `zhibo` 上合并 / 实现

---

## 0. 目标与非目标

### 目标
- 把 artifact 的完整体验接到现有 `/career-simulation/`（并按下方新产品需求增强）  
- 所有 LLM 调用经 Cloud Run 代理，默认 **Claude**（**禁止浏览器持有 API key**）  
- **内容安全过滤器**：脏话 / 越狱 / 违规内容前置拦截，降低厂商封号风险  
- **脏话词表语言**：中 / 英 / 法 / 日 / 阿 / 韩 / 俄 / 西（见 §5）  
- **Scenario 更具体**：贴近真实工作细节，帮助用户理解该领域实操  
- **Sticky 题干**：Simulation 时场景问题吸顶（见 §4.2 范围说明）  
- **Email 绑定 History**：开始前收集邮箱；history **必须含 JD、scenario、user 回答（transcript）**  
- 控制成本与滥用（rate limit、长度上限、轮次上限）

### 非目标（MVP 不做）
- 完整语音 / 视频  
- 多人协作  
- 与 Lumina Kickoff 共用同一会话状态  
- 原样静态托管 artifact HTML（会直连 Anthropic，不可用）  
- 完整 Heerise 账号体系强制登录（MVP 用 **邮箱登记 + session token** 即可；可选日后升级为正式 User）

---

## 1. 用户流程（更新后）

```
[0] Email gate  →  填写邮箱（同意记录练习历史）
        ↓
[1] Intake      →  粘贴 JD
[2] Confirm     →  确认解析结果
[3] Menu        →  选择具体 scenario（更细的场景卡）
[4] Simulation  →  对话（题干 sticky 置顶）
[5] Self-assess →  自评
[6] Debrief     →  反馈 + retry
        ↓
     写入 History（按 email）
```

| Stage | 用户动作 | LLM | 持久化 |
|-------|----------|-----|--------|
| 0 Email | 提交邮箱 | 0 | 创建/绑定 `career_sim_learner` |
| 1 Intake | 粘贴 JD | 1 parse | 草稿可挂在 session |
| 2 Confirm | 确认 / 重来 | 0 | — |
| 3 Menu | 选场景 | 1 scenarios（**具体化 prompt**） | 保存生成的 scenarios |
| 4 Simulation | 对话 | 1 start + N turns（≤10） | 追加 transcript |
| 5 Self-assess | 评分 + 反思 | 0 | 保存 ratings |
| 6 Debrief | 看反馈 | 1 debrief | **整场 run 写入 history（含 JD + scenario + 全部 user/character 回合）** |

**单场成本**：约 **4 + N** 次 LLM（N≤10）。必须限流。

---

## 2. 与现站落点

| 层 | 现状 | 方案落点 |
|----|------|----------|
| 路由 | `/career-simulation/`、`/career-simulation/casting/` | **单页状态机**；casting 可 redirect 到主页或并入 |
| Frontend | 硬编码 demo | 真实 API + sticky scenario bar + history UI |
| Backend | 站内其它模块用 Gemini；本产品用 **Claude** | `career_sim` router + safety + **email/history 存储** |
| 部署 | Firebase + Cloud Run | 同 pipeline |

---

## 3. 总体架构（Filter + Email History）

```
Browser (Hugo /career-simulation/)
        │  POST /api/career-sim/*
        ▼
┌────────────────────────────────────────────────┐
│ Cloud Run FastAPI                              │
│  1) Email session (X-Career-Sim-Token / cookie)│
│  2) Rate limit (IP + email)                    │
│  3) Schema / length validation                 │
│  4) Content Safety Filter                      │
│  5) Prompt assembly (server-owned)             │
│  6) LLM — Claude（Anthropic Messages API）     │
│  7) Output validate                            │
│  8) Persist run：JD + scenario + transcript    │
└────────────────────────────────────────────────┘
        ▼
   Anthropic API（key 仅在 Cloud Run）
        +
   Postgres/SQLite（history by email）
```

原则：

1. Key 只在 Cloud Run env（`ANTHROPIC_API_KEY`）；**不要**把 Gemini 作为本产品默认（Lumina 其它模块可继续用 Gemini）  
2. System prompt 永远在服务端  
3. 用户文本进 LLM 前必须过 Filter；拒绝则不调 LLM  
4. **所有可回看的 history 以 email 为键**（规范化小写）  
5. History 最小必存：**JD 全文（或全文+hash）、scenario 完整 JSON、user 每一轮回答**（建议连 character 回复一并存 transcript，否则回放不完整）

---

## 4. 新产品需求（本轮补充）

### 4.1 Scenario 生成要更具体（真实工作细节）

**问题**：artifact 默认场景偏短（2 句 description），不够支撑“了解领域细节 / 面对真实工作”。

**产品要求**：每个 scenario 必须像 **真实工单 / 会议议题**，包含可行动的上下文，而不是泛泛的 soft-skill 标签。

#### 生成 schema（升级）

```json
{
  "scenarios": [
    {
      "id": "s1",
      "title": "string (具体、可执行)",
      "workplace_context": "string — 组织/团队/约束（预算、期限、工具、合规）",
      "stakeholders": [
        { "name": "string", "role": "string", "stance": "string — 他们在乎什么/阻力" }
      ],
      "your_goal": "string — 本场用户要达成的具体结果",
      "domain_details": [
        "string — 该领域真实细节线索（工具名、流程、指标、文档类型等，从 JD 抽取或合理推断并标注为 rehearsal）"
      ],
      "opening_tension": "string — 开场冲突/时间压力",
      "success_signals": ["string — 怎样算谈妥/推进"],
      "description": "string — 2–4 句面向选卡 UI 的摘要（由上面字段压缩）"
    }
  ]
}
```

MVP 可先要求模型输出上述字段；选卡 UI 展示 `title` + `description`，进入 Simulation 后 sticky 区展示完整题干（goal / stakeholders / domain_details）。

#### Prompt 约束（写入 `prompts.py`）

- 必须 **紧扣用户 JD** 的职责与技能，禁止万能模板（“和 SME 聊聊”这类空场景）  
- 至少覆盖不同工作面，例如（按 JD 动态选择，不必写死）：  
  - 需求澄清 / stakeholder 冲突  
  - 交付物与质量标准（accessibility、LMS、评估）  
  - 时间/范围/资源不够时的取舍  
  - 数据或反馈驱动的迭代  
- 每个场景包含 **可观察的领域细节**（工具、工件、会议类型、成功标准）  
- 难度可标 `level: foundational | stretch`（可选）  
- 生成后做 JSON schema 校验；缺字段则重试 1 次或 502  

#### 与 Simulation start 的衔接

`scene/start` 的 system prompt 必须注入该 scenario 的 **完整具体字段**，要求角色台词引用具体细节（文档名、期限、指标），避免空洞对话。

---

### 4.2 Sticky 指的是什么

**Sticky** = 滚动时某块 UI **钉在视口上方**，不跟着内容滚走。

本产品中 sticky **只指 Simulation 阶段的「当前 scenario 题干条」**：

| 钉住 | 不钉住（站点仍保留） |
|------|----------------------|
| scenario 的 title / your_goal / 开场张力 | Email gate、Intake、场景菜单列表 |
| 可折叠的长题干 / Details（stakeholders、domain_details…） | 对话气泡本身、输入框（输入框可另做 bottom sticky，非本需求） |

**站点全局 navbar：必须保留**（不要 `no_navbar`）。Sticky 题干条钉在 **navbar 下方**（`top: var(--navbar-height)` 或等价固定偏移），避免盖住导航。

用户上下滑动聊天时，**场景问题仍停在 navbar 下沿**，避免聊着聊着忘记任务。

```
┌─────────────────────────────────────────┐
│  站点 navbar（保留）                      │
├─────────────────────────────────────────┤
│  STICKY：scenario 题干（可折叠）           │  ← 本需求范围
├─────────────────────────────────────────┤
│  可滚动：对话气泡                         │
├─────────────────────────────────────────┤
│  输入框                                  │
└─────────────────────────────────────────┘
```

#### 题干过长时可折叠（已定）

- 默认折叠态：一行 **title** + 截断摘要（约 1–2 行）+ **Expand**
- 展开态：完整 your_goal / opening_tension / Details（stakeholders、domain_details…）+ **Collapse**
- 判定：文本超过阈值（如 ~120 字或两行）时显示折叠控件；短题干可不显示折叠
- 小屏默认 **折叠**；宽屏若仍过长也折叠，避免 sticky 区吃掉半屏
- Self-assess / Debrief 可只保留一行 title（可选）

实现：`position: sticky; top: <navbar-offset>` + 不透明底；`width: 100%` 防横向裁切。

---

### 4.3 Email 绑定 History（开始前必填）

**要求**：练习前填邮箱；history 按邮箱绑定。

**MVP 邮箱方式（已定）**：**A. 声明制 + session token**（填邮箱即可开始，不发 OTP）。OTP / magic link 列为日后可选升级。

**History 必存（已定）**：

1. **JD** — job description 全文  
2. **Scenario** — 该场完整 scenario JSON  
3. **User 的回答** — Simulation 每一轮用户输入  

建议同时存 character 回复，组成完整 `transcript`，否则回放只有半边。Debrief（summary / skillEvals / tryNext）挂同一 run。

#### 邮箱两种方式的区别（参考）

| | **A. 声明制 + session token（MVP 已定）** | **B. OTP / Magic link（日后可选）** |
|--|------------------------------|-------------------------|
| 用户操作 | 填邮箱 → 立刻开始 | 填邮箱 → 收邮件点链接或输验证码 → 再开始 |
| 证明力度 | 「这个浏览器声称是该邮箱」 | 「该邮箱收件人确认过」 |
| 安全 | 较低（设备/token 泄露则 history 可见） | 较高 |
| 成本 | 低（不发信） | 高（发信、防刷、过期逻辑） |
| 体验 | 最快 | 多一步 |

#### 产品流程

1. Email gate（声明制）→ token  
2. 练习全程带 token  
3. History 列表 / 详情：必须能打开 **JD + scenario + user 回答（+ transcript + debrief）**  

#### 数据模型（必存字段）

```
career_sim_learners     id, email (unique), …
career_sim_sessions     token_hash, learner_id, expires_at, …
career_sim_runs
  jd_raw                 # 必存 JD 全文
  jd_title, jd_org
  scenario_json          # 必存完整 scenario
  transcript_json        # 必存 [{role, content, ts}…] 含全部 user 回合
  self_ratings_json, reflection, debrief_json
  status, created_at, completed_at
```

#### API 增补

| Method | Path | 说明 |
|--------|------|------|
| POST | `/register` | 邮箱门禁 → token |
| GET | `/history` | 该邮箱 runs 列表 |
| GET | `/history/{run_id}` | 详情（含 JD / scenario / user turns） |

LLM 接口均需 `X-Career-Sim-Token`；禁止仅凭 `?email=` 查 history。

---

## 5. Content Safety Filter

**摘要**：Layer A 词表/越狱/长度 → 拒绝且不调 Claude；Layer B 依赖 Anthropic 默认安全；Layer C 可选二次分类。  
**JD / turn / reflection** 必须过 Filter；邮箱只做格式校验。

### 5.1 脏话词表语言覆盖（已定）

词表文件建议按语言分片，启动时合并：

| 代码 | 语言 |
|------|------|
| `zh` | 中文 |
| `en` | English |
| `fr` | Français（法语） |
| `ja` | 日本語（日语） |
| `ar` | العربية（阿拉伯语） |
| `ko` | 한국어（韩语） |
| `ru` | Русский（俄语） |
| `es` | Español（西语） |

实现注意：

- 归一化：小写、去符号、简单 leetspeak；阿拉伯语等注意双向文本与变体字型  
- 命中 → `CONTENT_BLOCKED` / `reason: profanity`，**不调用 Claude**  
- 日志只存 reason + hash，不存脏话全文  
- 词表可运营迭代；误杀用 allowlist 补丁  

命中 → `CONTENT_BLOCKED`；与越狱/超长等共用错误码体系。

---

## 6. Backend API 总表（更新）

前缀：`/api/career-sim`

| Method | Path | 说明 |
|--------|------|------|
| POST | `/register` | 邮箱门禁，发 token |
| GET | `/history` | 该邮箱的 runs 列表 |
| GET | `/history/{run_id}` | 详情 |
| POST | `/parse-jd` | 解析 JD（需 token） |
| POST | `/scenarios` | **具体化** 4 scenarios（需 token） |
| POST | `/scene/start` | 开场（需 token） |
| POST | `/scene/turn` | 回合（需 token） |
| POST | `/debrief` | 复盘并 **写入 completed history**（需 token） |

统一管道：

```
auth token → rate_limit → validate → safety_filter → LLM → persist (as needed)
```

### 文件结构建议

```
backend/app/routers/career_sim.py
backend/app/services/career_sim/
  client.py / prompts.py / schemas.py / safety.py
  json_extract.py / rate_limit.py
  history.py          # learner / run CRUD
backend/app/models.py # CareerSimLearner, CareerSimSession, CareerSimRun
```

---

## 7. Frontend 细化（更新）

### 7.1 页面结构

1. **Email gate** 屏（首次 / token 失效）  
2. 主流程 1–6（单页状态机）  
3. **History** 抽屉或子路由 `/career-simulation/history/`（可用同一 SPA 内视图）  

### 7.2 Sticky scenario bar + navbar

- Simulation 阶段启用；实现见 §4.2  
- **保留站点 navbar**；sticky 题干 `top` = navbar 高度，叠在 nav 下方  
- 题干过长：默认折叠摘要 + Expand/Collapse（见 §4.2）  
- 不要对本页使用 `no_navbar`

### 7.3 History UI

- 列表：日期、JD title、scenario title、Completed / In progress  
- 空态： “No rehearsals yet — paste a JD to start.”  
- **详情必显**：JD 全文、scenario、user 每一轮回答；建议展示完整 transcript + debrief  

### 7.4 错误与校验

同前：`CONTENT_BLOCKED` / 429 / 401（请重新填写邮箱）/ 503  

### 7.5 Claude 客户端

- `client.py` 调 Anthropic Messages API（model 如 `claude-sonnet-4-6`，以当时可用型号为准）  
- Env：`ANTHROPIC_API_KEY`、`CAREER_SIM_MODEL`  
- 生产写入 Cloud Run secrets（deploy workflow）  

---

## 8. 部署阶段（更新）

| Phase | 内容 |
|-------|------|
| 0 | 安全底线 + Filter + Email/History 模型评审 |
| 1 | Backend：register + history 表 + 多语言词表 + Claude parse/scenarios |
| 2 | Frontend：email gate + 状态机 + **sticky scenario 题干** + history |
| 3 | 全链路 turn/debrief 写库（JD+scenario+user 回答）+ 限流按 email |
| 4 | 监控、词表迭代、（可选）邮箱 OTP |

---

## 9. 测试清单（增补）

| 用例 | 期望 |
|------|------|
| 无邮箱直接 parse | 401 |
| 登记后 history 空 | 200 [] |
| 完成 debrief | history 出现 1 条且属该 email |
| 换 token / 他邮箱 | 不能读到别人的 run_id |
| scenarios | 含 domain_details / stakeholders / your_goal 等字段 |
| Simulation 长对话滚动 | scenario 题干仍钉在 **navbar 下方** |
| 长题干 | 默认折叠；Expand/Collapse 正常 |
| 窗口缩窄 | sticky 不裁切关键 title；navbar 仍可见 |
| 本页 navbar | 始终显示（非 no_navbar） |
| JD/turn 脏话 | CONTENT_BLOCKED，且不写进成功 history |

---

## 10. 里程碑（更新）

| 里程碑 | 交付 |
|--------|------|
| M0 | 本方案（含 sticky / 具体 scenario / email history） |
| M1 | register + DB + Filter + parse-jd + **具体 scenarios API** |
| M2 | 前端 email gate + sticky simulation + history 列表 |
| M3 | 全链路 debrief 落库 + 限流/监控 + 可公开 |

---

## 11. 待确认决策

- [x] 模型：**Claude**（Cloud Run + `ANTHROPIC_API_KEY`）  
- [x] 邮箱：**声明制 + session token**（OTP 日后可选）  
- [x] History 必存：**JD + scenario + user 回答**  
- [x] Sticky：**Simulation 题干条**；钉在 **保留的 navbar 下方**  
- [x] 题干过长：**可折叠**（默认折叠摘要）  
- [x] 脏话词表：中英 + 法日阿韩俄西（§5.1）  
- [ ] 视觉：暗色 Rehearsal Room vs 品牌色

---

## 12. 一句话结论

**Claude 服务端代理** + **声明制邮箱** History（存 JD / scenario / user 回答）+ 八语脏话过滤 + 具体化 scenario + **保留 navbar** 下的可折叠 sticky 题干，部署在现有 Heerise 站点。

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-10-18 | 初稿方案 |
| 2026-10-19 | 细化 API / Filter / 测试 |
| 2026-10-19 | 具体化 scenario；sticky；email history |
| 2026-10-19 | 默认 Claude；邮箱 A/B 说明；history 必存三项；sticky 范围；词表 8 语 |
| 2026-10-19 | MVP 声明制邮箱；保留 navbar；题干过长可折叠 |
