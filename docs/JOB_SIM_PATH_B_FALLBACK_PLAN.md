# Job Simulation — Path B 探索保底池（Fallback Catalog）方案

> **状态**: 方案 · 未实现 · **已并入** `docs/JOB_SIMULATION_MVP_PLAN.md` §5  
> **日期**: 2026-11-21  
> **前端原型**: `job_simulation_career_simulation_mvp.html`（Gemini）  
> **承接**: `JOB_SIMULATION_MVP_PLAN.md` + `CAREER_SIMULATION_DEPLOYMENT_PLAN.md` + 现有 `job_sim` register/sessions  
> **分支约定**: 在本地 `zhibo` 上实现 / 合并

---

## 0. 背景与目标

Path B（Career Explorers）允许用户搜索任意职业；成功时 Gemini 生成完整 **career guide + 3 个 leveled projects**。

**新需求**：

1. 用户搜索并成功生成后，把该探索 **固定进可展示池**（原型 homepage / Path B 入口可见，不只一次性会话）。  
2. **按方向（direction）最多存 1–3 条** 生成结果。  
3. **不与账号绑定**：全局公共目录，任何人 API 失败 / 超时都可拿来替补。  
4. 某方向已满 3 条 → **不再写入**（只读复用）。  
5. 目的：预防 LLM API 崩溃，保证 user 始终有保底可做。

---

## 1. 现有数据库核对（字段是否够用）

### 已有表

| 表 | 用途 | 是否满足本需求 |
|----|------|----------------|
| `job_sim_users` | 声明制注册（姓名/邮箱/订阅） | ❌ 与账号绑定；不是探索内容池 |
| `job_sim_sessions` | 某用户进行中的 simulation（role/project/results） | ❌ 按 `user_id`；不是全局探索目录 |

### 结论

**现有两表不够。** 需要新建 **全局、无 user_id** 的 Path B 探索目录表（建议名下方）。  
`job_sim_sessions.project_json` 的单项目结构可复用为 JSON 形状参考，但生命周期与归属不同，不要混用。

---

## 2. 建议新表：`job_sim_explore_catalog`

> 一名一义：**direction** = 规范化后的职业方向键（见 §3）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string PK | uuid |
| `direction_key` | string, index | 规范化方向键，如 `product_manager` |
| `display_title` | string | 展示用标准职称，如 `Product Manager` |
| `source_query` | string | 用户原始搜索词（审计用） |
| `career_json` | text/json | 完整 Path B career 对象（见原型 schema） |
| `slot_index` | int 1..3 | 该方向下的槽位 |
| `created_at` | datetime | 写入时间 |
| `updated_at` | datetime | 可选 |

**约束（关键）**：

- `UNIQUE (direction_key, slot_index)`  
- 写入前：`COUNT(*) WHERE direction_key = ?`；若 `>= 3` → **跳过插入**（仍可返回已有 3 条给前端）  
- **无 `user_id`**

### `career_json` 最小齐全字段（对齐原型）

与 HTML 生成 schema 对齐，缺字段则拒写或补默认后再存：

```
title, shortDesc, whatTheyDo, typicalWorkday, typicalProjects,
skillsAndTools[], challenges, relatedCareers[],
projects[3] { id, difficulty, title, shortDesc, tags, businessContext,
  objective, yourRole, deliverables, challenges, skillsApplied, rubric,
  simulationSetup { stakeholderName, stakeholderRole, setScene, openingLine } }
```

可选：`extraBatches`（默认可 `[]`）。

---

## 3. Direction（方向）怎么定义

| 步骤 | 规则 |
|------|------|
| 输入 | 用户搜索词 / 模型返回的 `title` |
| 规范化 | trim → lower → 去标点 → 空白变 `_`；可选同义词表（`pm` → `product_manager`） |
| 键 | `direction_key` |
| 预置 12 职业 | 可预 seed 进 catalog，或继续用前端 `CAREERS_POOL_PATH_B` 作静态保底；**自定义搜索**的成果写入本表 |

「每个方向 1–3 个」= 每个 `direction_key` 最多 3 条完整 career 探索（各含 Easy/Medium/Hard 三项目）。

---

## 4. 「固定到 homepage」产品含义

原型 Path B 首页目前是：预置 4 格轮播 + 自定义搜索框。

建议行为：

1. Path B 入口 / homepage 探索区除预置职业外，展示 **catalog 中已收录的方向**（标题卡即可）。  
2. 用户新搜索成功 → 若该方向未满 3 → 后台写入 → 下次进入 Path B 可见。  
3. 不绑定登录；未 register 也可读 catalog（只读 public）。  
4. 写入可在 LLM 成功后 fire-and-forget；失败不影响当前用户继续玩刚生成的内容。

---

## 5. API 草案（挂在现有 `/api/job-sim` 或 `/api/career-sim`）

| Method | Path | 鉴权 | 说明 |
|--------|------|------|------|
| GET | `/explore-catalog` | 可选/公开 | 列表：方向 + title；或 `?direction_key=` 取该方向最多 3 条 |
| GET | `/explore-catalog/{direction_key}` | 公开 | 取该方向全部槽位（≤3），供 fallback |
| POST | `/explore-catalog` | 服务端内部或带 gate（防刷） | LLM 成功后尝试入库；已满 3 则 `stored: false, reason: "full"` |

**写入策略**：

```
LLM 生成成功
  → normalize direction_key
  → count(direction_key)
  → if count >= 3: 不存，返回 existing
  → else: insert slot_index = count+1，存 career_json
```

**读取 / Fallback 策略（前端）**：

```
用户搜索 query
  → 先查 catalog（direction 匹配或模糊）
  → 若有 ≥1 条：可直接用（或仍尝试 LLM，超时/失败则用 catalog）
  → LLM 超时/失败：用该方向已有条目；若该方向为空 → 用静态 CAREERS_POOL 或通用 fallback
  → LLM 成功：渲染给用户；并 POST 尝试入库（未满才存）
```

限流：POST 按 IP；禁止匿名狂刷灌库。内容仍建议过 Filter（脏话等）后再入库。

---

## 6. 与既有 plan / 代码的关系

| 能力 | 状态 |
|------|------|
| Email gate + sessions（账号侧进度） | 已有 `job_sim` register/sessions（按用户） |
| Path B 全局探索保底池 | **本方案新建**；与 session **分离** |
| 服务端代理 LLM / Filter / sticky 等 | 仍按 `CAREER_SIMULATION_DEPLOYMENT_PLAN.md` |
| 预置 12 careers | 可继续前端静态；或一次性 seed 进 catalog |

**不要**把全局探索写入 `job_sim_sessions`（会绑 user、会被 recent 3 条逻辑清掉）。

---

## 7. 字段齐全性检查清单

实现前对每条入库 JSON 校验：

- [ ] career 级：title / shortDesc / whatTheyDo / typicalWorkday / projects.length === 3  
- [ ] 每个 project：difficulty ∈ Easy\|Medium\|Hard；simulationSetup 四字段齐全  
- [ ] openingLine 以一个问句结尾（与原型 prompt 一致）  
- [ ] 无超长 payload（建议与 session 类似上限，如 50KB/条）

缺字段 → 不入库（避免坏数据占满 3 槽）。

---

## 8. 里程碑（建议）

| M | 交付 |
|---|------|
| M0 | 本方案确认（direction 定义、homepage 展示范围） |
| M1 | 建表 `job_sim_explore_catalog` + GET/POST API + 满 3 拒写 |
| M2 | 前端：搜索成功后尝试入库；API 失败时读 catalog 替补 |
| M3 | Path B / homepage 展示已收录方向卡；可选 seed 预置职业 |
| M4 | Filter + 限流 + 监控（入库成功率 / fallback 命中率） |

---

## 9. 待确认

- [ ] 「direction」是否 = 规范化职称（推荐），还是固定若干大类（产品/数据/设计…）？  
- [ ] homepage 固定：只显示「曾被搜索入库」的卡，还是混排预置 12 + catalog？  
- [ ] 满 3 之后新生成的更好内容：丢弃（当前方案）还是日后支持替换最旧？  
- [ ] POST 入库是否要求 `X-Job-Sim-Token`（防刷）还是仅 IP 限流公开写？

---

## 10. 一句话

在现有 **按用户** 的 `job_sim_users/sessions` 之外，新增 **全局、每方向最多 3 条** 的 Path B 探索目录；搜索生成成功就尝试写入，满则停写；LLM 挂了用这 3 条保底，并在 Path B / homepage 固定展示。
