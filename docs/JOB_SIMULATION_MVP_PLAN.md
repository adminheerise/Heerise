# Job Simulation — MVP 产品与落地 Plan（整合版）

> **状态**: 方案 · 以本文件为 MVP 真源  
> **日期**: 2026-11-21  
> **产品名**: **Job Simulation**（不再用 Rehearsal Room / Zero-Risk Workplace Internship Simulator）  
> **原型**: `job_simulation_career_simulation_mvp.html`（Gemini）→ 改造成可交互 MVP，并接 Heerise API  
> **承接文档**: 原 `CAREER_SIMULATION_DEPLOYMENT_PLAN.md`（架构/安全）+ `JOB_SIM_PATH_B_FALLBACK_PLAN.md`（Path B 保底池）  
> **分支**: 本地始终在 `zhibo` 上实现 / 合并  

---

## 0. MVP 一句话

两条入口（有 JD / 探索职业）汇合到同一条短时体验：

**Understand → Explore Projects → Simulation → AI Debrief → Retry**

- **不做** Self-assess（自评）  
- 单次目标 **10–15 min**（对话约 5–7 轮，最多 8 轮 user turns + 2–3 min debrief）  
- LLM **服务端 Gemini 代理**；key 不进浏览器（先占位，无 key 则预置/catalog fallback）  
- Path B：**先预置**职业卡 + 探索结果写入**全局保底池**（规范化职称，每方向最多 3，不绑账号）  
- 路由：**Job Simulation**（`/job-simulation/`）；Logo 与 homepage 一致  

---

## 1. 用户一开始需要知道什么（Homepage）

### 1.1 文案（已定）

| 项 | 内容 |
|----|------|
| 产品名 | Job Simulation |
| 去掉 | Rehearsal Room；Zero-Risk Workplace Internship Simulator；旧长段 “Turn no experience…” 全删 |
| Hero 方向 | **Get Ready for the Job You Want** |
| 价值主张（短） | 提前演练真实岗位核心场景、常见坑与协作冲突；无求职风险的「实习」式练习；把「无经验」变成「已实战」 |
| 主问题（显眼） | **Where are you in your career journey?** |

### 1.2 两个清晰入口

| | Path A | Path B |
|--|--------|--------|
| 标题 | I have a job in mind | I'm exploring career options |
| 副文 | I found a job posting… prepare and practice the work | I'm not sure… discover roles and experience the work |
| 标签 | For active job seekers | For career explorers |
| 适合 | 针对特定岗位准备 | 迷茫 / 转型 / 看行业 |

左上角：**HeeRise Academy Logo**（勿用 “JS” 字标）。  
主题色：**navy `#022A3A`** + 白 + 黑；**Headings: Roboto**；**Body: Montserrat**；无 em dash；无 AI-like icons；注意 accessibility（字号层级、对比度、mobile）。

### 1.3 Email gate（MVP 保留）

进入主流程前：**声明制**姓名 + 邮箱 + 同意条款（现有 `job_sim` register / `X-Job-Sim-Token`）。OTP 非 MVP。

---

## 2. 两类用户分别获得什么

### Path A — I have a job in mind

四个阶段（**无自评**）：

#### A1. Understand the Job

- 用户粘贴 JD（sample 用 **Product Manager** JD，不用 LXD）。  
- AI 不只抽 skills：用大白话解释岗位真正做什么。  
- 输出 **3–5 条 typical responsibilities**（示例风格见产品 brief：Senior LXD 那种列表）。  
- JD 质量差：降级文案 + 仍给出可用 responsibilities / 引导用户补全或换 sample。  
- 动作要少、按钮显眼，避免字多点不到。

#### A2. Explore Real Work & Projects

- 职责 → 具体项目；首次固定 **3 个**：Easy / Medium / Hard 各 1。  
- 每项目必须含：Business context、Objective、Your role、Deliverables、Challenges、Skills applied；并标注对齐的 responsibility。  
- Disclaimer：Illustrative AI-generated… not verified employer projects.  
- **Generate more projects**：每点一次再生成 Easy+Medium+Hard 各 1；**最多 2 次**（+6）；触顶提示先试现有项目。  
- Rubric（How you will be evaluated）= accordion，默认 **collapse**，可点开；样式要像可点击 hint。

#### A3–A4. Shared Simulation + Debrief

进入 §3 共享体验（不再单独叫 “Build Job-Relevant Experience / Rehearse” 为两套产品；对用户就是选项目 → 模拟 → 反馈）。

### Path B — I'm exploring career options

#### B1. Explore Career Paths 页

- 文案：Not sure… explore what professionals actually do.  
- 卡片网格（如 PM / Data Analyst / UX / Financial Analyst…）。  
- **换一批**：每次换 4 个 careers。  
- **自定义输入**想探索的职业。  
- 点击卡片 → **先职业介绍，不直接进聊天**：  
  - What do they actually do?  
  - Typical workday?  
  - Projects?  
  - Skills & tools?  
  - Challenges?  
- 再给入口：**Try a real-world project**（同样 Easy/Medium/Hard ×1，可 Generate more ≤2 次）。

#### B2. 完成后 Debrief 额外解释

- 用了哪些能力、优势、待练、相关职业可探索。  

#### B3. 全局保底池（见 §5）

搜索/生成成功 → 尝试写入全局 catalog；每方向最多 3；API 失败时替补；可固定展示在 Path B / homepage 探索区。

---

## 3. 两条路径汇合 — Shared Experience（核心）

```
Path A: Paste JD → Understand role → Explore projects ─┐
                                                        ├→ Simulation → AI Debrief → Retry
Path B: Browse/search → Understand role → Projects   ─┘
```

统一心智模型：**Understand → Experience → Practice → Feedback → Improve**

| 阶段 | 时长目标 | 说明 |
|------|----------|------|
| Role / Project Context | 尽量短 | 尽快进任务；开始前告知预估时长与任务目标；**不强调倒计时/剩余轮数** |
| Simulation | ~10–15 min 内的对话段 | 一问一答；5–7 有效轮，**最多 8 user turns**；勿为凑轮数闲聊 |
| AI Debrief | 2–3 min | 可视化、可行动；基于预置 rubric + 对话证据 |
| Retry | 一次机会 | 同 competency，换/改情境；带上 improvement recommendations |

### Simulation 规则

- 结束看**任务完成度**，不机械看轮数：信息是否够、是否分析、是否有依据的建议、是否回应 stakeholder。  
- 提前完成可提前结束；触顶未完成则结束，Evaluation 标明已展示 / 证据不足。  
- Progress：**只显示进度条**，不要 “Turn 1 of 7” 等对用户暴露的 prompt 用语。  
- **未到约 3/4 进度前不显示 End & Debrief**。  
- Sticky：Simulation 时 **project brief + progress** 可钉在上方；用户可 Hide；展开后滚动仍可见（navbar 保留，条在 nav 下）。  
- 缺 data/info 时，simulation 应**提供必要信息**，别卡死用户。  
- Stakeholder：**一问一答**，单轮不堆多个问题。

### Scaffolding（Need a hint?）

常驻按钮；也可在卡住时主动提示。层级：

1. Open-ended prompt  
2. Directional hint  
3. Structured options（2–3 + trade-offs）  
4. Example response（鼓励改写）  
5. Model answer + 解释后继续  

跟踪 hint 级别；Debrief 区分 Independent / with Support / after Modeling / Not Yet Demonstrated。不因求助而羞辱或单纯扣分。

### AI Debrief — Predefined Rubric

- 开场前按角色 + 本任务定好 **3–4 条可观察行为**（勿结束后再编通用标准）。  
- 四级：Demonstrated Independently / with Support / after Modeling / Not Yet Demonstrated。  
- 每条引用对话证据；可视化 summary + 每条评级 + 1–2 条优先改进 + Retry 下一步。  
- Retry 沿用 competency，换情境；比较时区分独立 vs 有支持的进步。

---

## 4. MVP 明确砍掉 / 延后

| 不做（MVP） | 说明 |
|-------------|------|
| Self-assess 自评页 | 直接 Simulation → Debrief |
| 浏览器 API key | 一律 Cloud Run 代理 |
| OTP / 完整账号体系 | 声明制 gate 即可 |
| 用 CV 定难度 | Parking：难度暂由 Easy/Medium/Hard 项目标签；CV 上传非 MVP |
| 完整 recommendation system | Parking：见 §7 |

---

## 5. Path B 全局保底池（并入 MVP）

详见 `JOB_SIM_PATH_B_FALLBACK_PLAN.md`，MVP 采纳要点：

- 现有 `job_sim_users` / `job_sim_sessions` **不够** → 新建 `job_sim_explore_catalog`（无 user_id）。  
- 每 `direction_key` 最多 **3** 条完整 career JSON；满则不写。  
- 搜索生成成功 → 尝试入库；LLM 失败/超时 → 读 catalog 替补；可展示在 Path B/homepage。  
- 不与账号绑定。

---

## 6. 后端 / 数据（MVP）

### 已有

- `job_sim_users` + register → `gate_token`  
- `job_sim_sessions`：进行中/完成的 simulation + results（绑用户）

### 需补 / 改

| 能力 | 建议 |
|------|------|
| Explore catalog | 新表 + GET/POST（§5） |
| LLM 代理 | `/api/job-sim/...`：parse-jd、projects、career-guide、turn、hint、debrief（**Gemini，仅服务端**；key 占位） |
| Filter | 脏话等词表（中英+法日阿韩俄西）进 LLM 前拦截 |
| Session 内容 | results 含 transcript、rubric scores、hint levels、recommendations |
| History | 按 email：JD/role、project/scenario、user 回答、debrief |

字段校验：project / career JSON 与原型 schema 对齐；缺字段不入库。

---

## 7. Parking lot（非 MVP，记录）

1. **Career interest recommendation（Zhibo）**  
   - 用户探索完某 career → 可选「感兴趣 / 不感兴趣」  
   - 不感兴趣带权重；所有用过的 career paths 系统记录 → 日后 recommendation system  

2. **CV 上传定难度**  

3. **满 3 条 catalog 后是否替换最旧**  

4. OTP / 正式账号  

---

## 8. UX / 设计清单（改原型时必做）

- [ ] Homepage：Job Simulation；Get Ready for the Job You Want；Journey 问题显眼；双入口清晰  
- [ ] Logo HeeRise Academy（参考 attachment 风格）  
- [ ] Sample JD → Product Manager  
- [ ] Rubric accordion 默认可折叠、可点击感  
- [ ] Path B：换 4 careers + 自定义搜索  
- [ ] Projects：E/M/H label；首次 3；Generate more ≤2  
- [ ] Progress 仅条，无 turn 文案；满格与轮次逻辑一致  
- [ ] End & Debrief 需 ≥ ~3/4 进度  
- [ ] Sticky brief + progress，可 hide  
- [ ] 一问一答；减少墙字；CTA 显眼  
- [ ] Navy `#022A3A`；Roboto / Montserrat；a11y；mobile  
- [ ] 无 em dash；无 AI-like icons  

---

## 9. 技术落地顺序（MVP）

| Phase | 内容 |
|-------|------|
| 0 | 本 plan 确认；prototype 文案/流程按 §1–3、§8 改（可先本地 HTML） |
| 1 | 接 `job_sim` register + sessions；LLM 全部改 API 代理 |
| 2 | Path A/B UI 汇合 Simulation/Debrief；去自评；hint + sticky + progress 规则 |
| 3 | `job_sim_explore_catalog` + fallback + Path B/homepage 展示 |
| 4 | Filter、限流、Hugo `/career-simulation/` 或 Job Simulation 路由上线 |

**交付形态**：可交互 prototype（先 HTML MVP 对齐产品）→ 再嵌站点 API。

---

## 10. 成功标准（MVP）

- 用户 30 秒内看懂双入口并选路  
- Path A：JD → 懂职责 → 选 E/M/H 项目 → 10–15 min 模拟 → 可视化 debrief → 可 retry  
- Path B：浏览/搜索 → 职业介绍 → 项目 → 同一套模拟/反馈  
- API 挂时 Path B 仍有 catalog/静态保底可练  
- 无浏览器 key；通知类邮件走公司邮箱（与 contact 默认 `admin@heeriseacademy.com` 一致策略）  

---

## 11. 与旧文档关系

| 文档 | 角色 |
|------|------|
| **本文件** | MVP 产品 + 落地真源 |
| `CAREER_SIMULATION_DEPLOYMENT_PLAN.md` | 安全/代理/Filter/sticky 技术细节仍有效；流程以本文件为准（无自评；产品名 Job Simulation） |
| `JOB_SIM_PATH_B_FALLBACK_PLAN.md` | Path B catalog 细节；已并入 §5 |

---

## 12. 已确认决策（2026-11-21）

- [x] LLM：**Gemini**（**仅服务端**代理；浏览器无 key）  
- [x] 路由 / 产品路径：**Job Simulation**（建议 `/job-simulation/`；旧 `/career-simulation/` 可 redirect）  
- [x] Path B / 探索展示：**先预置**职业卡（如现有 12 / 每次 4 个），再叠 catalog 保底与搜索入库  
- [x] Direction：**采用规范化职称**（同义词收成同一 `direction_key`，每方向最多 3 条）  
- [x] Logo：与 **homepage 同一套 HeeRise Academy 图标/品牌**  
- [x] API key：**先占位**（env 名如 `GEMINI_API_KEY` / `JOB_SIM_GEMINI_API_KEY`；未配置时走静态预置 + catalog fallback，不把 key 写进前端）

### 实现时注意

- 服务端读 key；为空则 LLM 调用失败并自动 fallback，勿阻塞整页。  
- Contact 等通知邮箱策略仍用公司邮箱 `admin@heeriseacademy.com`（与 Job Sim 门禁无关）。
