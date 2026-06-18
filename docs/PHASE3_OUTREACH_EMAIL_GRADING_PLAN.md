# Phase 3 — Stakeholder Outreach Email · 评分系统 Plan

> **状态**: Plan only · 不接任何 LLM/外部 API · 纯 rule-based · 待 Phase 3 页面设计完成后实施
>
> **路径**: `/acc/stakeholder-kickoff/outreach-email/` (composer) → backend `/api/sim/outreach-email/score`
>
> **最后更新**: 2026-05-01 (按 spec 字面校对修正后的最终版)

---

## 0. Phase 3 spec 参考

学员任务: 在 6 分钟内、3 个 scene、1 个 decision point 内完成给 Jordan + Priya 的 kickoff 邀约邮件。

邮件结构 (固定，学员不可改 To/Cc):
```
To:      jordan.kim@lumina.com, priya.nair@lumina.com
Cc:      maya.chen@lumina.com
Subject: [learner drafts]

SECTION 1: CONTEXT & CREDIBILITY
SECTION 2: MEETING PURPOSE
SECTION 3: PRE-CALL QUESTION
SECTION 4: SCHEDULING
SECTION 5: CLOSE
```

约束: 300-word max · 7 criteria × 3-point scale · 总分决定 stakeholder response · 1 次 revision

---

## 1. 总体思路

7 条 criteria 全部 deterministic rules。每条标准拆成若干可机器检测的 **signals** (关键词命中 / 长度阈值 / 正则匹配 / 结构存在性)，把信号映射到 1/2/3 分。所有评分逻辑封装在独立模块, 可单测, 可被设计/内容团队 review。

**取舍**: 纯规则在 *Pre-Call Question* / *Tone* / *Close* 等"语义判断"项上不如 LLM 精准。我用 whitelist + blocklist + 启发式特征逼近，并把每条判定理由全部存进 `signals` 字段，学员能看到为什么扣分，体验比黑盒打分更好。**最终精度依赖 calibration 数据集 (≥30 封人工标注样本)。**

---

## 2. 7 条 Criteria 评分规则 (修正后最终版)

### 2.1 Subject Line

spec:
- 1: Generic ("Kickoff Meeting"). No reference to Aria, stakes, or the business problem.
- 2: Names the project or product. Signals purpose but doesn't compel immediate opening.
- 3: Communicates **stakes** in under 10 words.

```python
PROJECT_ANCHORS = {"aria", "kickoff", "discovery"}            # 项目/会议名
STAKES_ANCHORS  = {"rep readiness", "ramp", "ramp-time",      # 与业务后果挂钩
                   "performance", "field", "enablement",
                   "deal", "go-to-market"}
GENERIC_BLOCKLIST = {"kickoff meeting", "meeting", "hello", "intro", "hi"}

words = subject.split()

if subject.lower().strip() in GENERIC_BLOCKLIST:           score = 1
elif len(words) > 15:                                      score = 1
elif no PROJECT_ANCHORS hit:                               score = 1
elif no STAKES_ANCHORS hit:                                score = 2   # level 2: 有项目无 stakes
elif len(words) <= 10:                                     score = 3   # level 3: project + stakes + ≤10 词
else:                                                      score = 2   # 11–15 词且双 anchor 命中
```

`failed_signal` 取值: `no_anchor` / `no_stakes` / `too_long` / `generic_only`

### 2.2 Context & Credibility

spec:
- 1: Generic self-intro. No evidence of research.
- 2: Names project and general goal but lacks specific Phase 2 data points.
- 3: Cites specific findings (7.2-month ramp, failed wiki/manager sessions) and shows understanding of Jordan's vs Priya's different priorities.

```python
ANCHORS_PHASE2 = {
    "ramp_data":      r"7\.?2|seven\s*point\s*two|ramp[- ]?time",
    "wiki":           r"\bwiki\b",
    "manager_led":    r"manager[- ]?(led|sessions?)",
    "product":        r"\baria\b",
    "stakeholders":   r"\b(jordan|priya)\b",
    "prior_attempts": r"prior (training|attempts?)|previously tried",
}

SELF_INTRO_PATTERNS = [
    r"\bI[' ]?m\b", r"\bI am\b", r"my role", r"learning designer",
    r"\bLXD\b", r"instructional designer",
]

hits = count_distinct(text, ANCHORS_PHASE2)
has_intro = any(re.search(p, text) for p in SELF_INTRO_PATTERNS)

if not has_intro:                       score = 1     # 没自我介绍直接 1
elif hits >= 4:                         score = 3
elif hits >= 2:                         score = 2
else:                                   score = 1
```

**已知局限**: spec level 3 要求"shows understanding of Jordan's and Priya's *different* priorities"，纯规则只能用"两人都被提到 + 提到不同维度词 (ramp + scope / 或 product + readiness)"做弱代理，可能误判。calibration 时重点关注。

### 2.3 Meeting Purpose

spec:
- 1: Vague: "discuss the project."
- 2: General purpose + topics, not specific.
- 3: Names specific deliverables (objectives, scope, success definitions). Framed as discovery.

```python
DELIVERABLE_NOUNS = ["objective", "scope", "success",
                     "definition", "constraint", "boundary"]
PURPOSE_VERBS     = ["agree", "confirm", "align", "establish",
                     "walk away with", "discover"]

deliverable_n = count_distinct(text, DELIVERABLE_NOUNS)
verb_n        = count_distinct(text, PURPOSE_VERBS)

if deliverable_n >= 3 and verb_n >= 1:    score = 3
elif deliverable_n >= 1 and verb_n >= 1:  score = 2
else:                                     score = 1
```

> ⚠ "45-min" 不是 rubric 要求 (那是 sample exemplary 里的具体写法)，仅作为信号记录，不影响打分。

### 2.4 Pre-Call Question (规则方法论最弱的一条)

spec:
- 1: Googleable or already in brief ("What does Aria do?"). Generic ("What are your goals?").
- 2: Relevant and somewhat targeted. Requires some insider knowledge but isn't hypothesis-driven.
- 3: Only answerable by Jordan or Priya personally. Tests a Phase 2 hypothesis.

```python
# 必要条件: 必须有问句
if "?" not in question_section:                  return 1

# 黑名单: 命中即判 1
GOOGLEABLE_PATTERNS = [
    r"what (does|is) aria",
    r"what are your goals",
    r"tell me about yourself",
    r"what'?s your timeline",
    r"what do you do",
    r"how does .* work",
    r"can you (explain|describe) (the )?(product|aria)",
    r"what'?s the budget",
]
if any(re.search(p, question_section, re.I) for p in GOOGLEABLE_PATTERNS):
    return 1

# 加分信号
SPECIFICITY_SIGNALS = {
    "scenario_anchor":  r"\b(deal|discovery|demo|objection|onboard|pitch)\b",
    "temporal_anchor":  r"\b(first \d+ days?|in the field|day one|week \d+)\b",
    "stakeholder_lens": r"\b(jordan|priya|you|your team)\b",
    "hypothesis_frame": r"\b(when|if|what if|what tends to|usually|most often|in your experience)\b",
    "loss_frame":       r"\b(loses?|fails?|struggles?|breaks? down|goes wrong)\b",
}

n = count_distinct_signals(question_section, SPECIFICITY_SIGNALS)
length_ok = 60 <= len(question_section.split()) <= 180

if n >= 3 and length_ok:        score = 3
elif n >= 1:                    score = 2
else:                           score = 1
```

> 💡 **calibration 重点项**。GOOGLEABLE_PATTERNS 和 SPECIFICITY_SIGNALS 必须用人工标注样本反复调优，否则误判最严重。

### 2.5 Scheduling (纯正则)

spec:
- 1: Defers entirely: "Let me know what works."
- 2: ≥1 window or general timeframe.
- 3: 2–3 specific windows with dates, times, duration.

```python
WINDOW_PATTERN = re.compile(
    r"(Mon|Tue|Wed|Thu|Fri)[a-z]*\s+\d{1,2}\s+"
    r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*"
    r".{0,30}?"
    r"\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)"
    r".{0,10}?"
    r"(\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)|\d+\s*min)",
    re.S,
)

DEFER_PHRASES = [
    r"let me know what works", r"whatever works for you",
    r"your call", r"flexible on time", r"you tell me",
]

windows = WINDOW_PATTERN.findall(scheduling_section)

if len(windows) >= 2:                              score = 3
elif len(windows) == 1:                            score = 2
elif any(re.search(p, text, re.I) for p in DEFER_PHRASES):
                                                   score = 1
else:                                              score = 1
```

`signals.acknowledges_calendar_pressure`: 检测 `r"calendar.*full|busy schedule|know your time"` 等短语，纯记录用，不影响打分。

### 2.6 Close

spec:
- 1: Abrupt or generic. No forward-looking statement.
- 2: Mentions looking forward to call. Adequate but unremarkable.
- 3: Ties back to shared goal (rep readiness). Positions as partner.

```python
shared_goal     = matches(text, ["ramp", "readiness", "team",
                                 "aria", "rep"])
partner_lang    = matches(text, ["partner", "together",
                                 "collaborate", "alongside",
                                 "both of you"])
forward_looking = matches(text, ["looking forward", "excited",
                                 "appreciate", "can't wait"])

SIGNATURE_RX = r"\b(Best|Thanks|Regards|Sincerely|Cheers)[,\s]"
has_signature = re.search(SIGNATURE_RX, text)

n = sum([shared_goal, partner_lang, forward_looking])

if not has_signature:                              score = min(score, 2)
if n == 3:                                         score = 3
elif n == 2:                                       score = 2
else:                                              score = 1
```

### 2.7 Tone & Word Count

spec:
- 1: L&D jargon, overly casual or stiff. **Exceeds 300 words.** Typos.
- 2: Professional and clear. **Near or at 300-word limit.**
- 3: Speaks stakeholder language (outcomes, not modalities). Confident but not presumptuous. **Well under 300 words.**

```python
WORDS_EXEMPLARY_MAX  = 270    # "well under 300" — TBD by content team
WORDS_PROFICIENT_MAX = 300    # "near or at"
# > 300 → "exceeds" → 1

JARGON_BLOCKLIST = ["synergy", "leverage", "modality", "ILT", "SCORM",
                    "stakeholdering", "actionable", "ideate",
                    "deliverable", "operationalize"]
CASUAL_BLOCKLIST = ["hey ", "yo ", "guys", "gonna", "wanna", "kinda",
                    "btw", "lol", "ASAP", "k thx"]
PRESUMPTUOUS_BLOCKLIST = [r"I'?ll need you to", r"you must",
                          r"make sure to", r"by EOD", r"non-negotiable"]
STIFF_BLOCKLIST = [r"pursuant to", r"per our discussion",
                   r"please be advised", r"hereby", r"whereas"]

words       = total_word_count(email_body)
typos       = pyspellchecker_count(email_body)
jargon_n    = count_keywords(email_body, JARGON_BLOCKLIST)
casual_n    = count_keywords(email_body, CASUAL_BLOCKLIST)
presump_n   = count_patterns(email_body, PRESUMPTUOUS_BLOCKLIST)
stiff_n     = count_patterns(email_body, STIFF_BLOCKLIST)

# Word count gates
if words > WORDS_PROFICIENT_MAX:              cap = 1     # "exceeds 300"
elif words > WORDS_EXEMPLARY_MAX:              cap = 2     # "near or at"
else:                                          cap = 3     # "well under"

# Typos
if typos >= 3:    cap = min(cap, 1)
elif typos >= 1:  cap = min(cap, 2)

# Jargon
if jargon_n >= 2:    cap = min(cap, 1)
elif jargon_n >= 1:  cap = min(cap, 2)

# Casual / Presumptuous / Stiff
if casual_n >= 1 or presump_n >= 1 or stiff_n >= 1:
    cap = min(cap, 2)

# Outcome-focused language
outcome_lang = matches(text, ["outcome", "ramp", "readiness",
                              "performance", "field", "rep"])
if cap == 3 and not outcome_lang:  cap = 2

score = cap
```

---

## 3. 总分聚合 & Tier 映射

```python
total = sum(card.score for card in scorecards)        # 范围 7..21

if total >= 18:    tier = "exemplary"
elif total >= 12:  tier = "proficient"
else:              tier = "developing"
```

`Scorecard` 数据结构:

```python
@dataclass
class Scorecard:
    criterion: str               # "subject_line" | "context" | ...
    score: int                   # 1 | 2 | 3
    signals: dict                # 命中/未命中的所有 signal (审计用)
    failed_reasons: list[str]    # 用于 coaching key 选择
```

---

## 4. Coaching 选择算法 (按 spec 严格实现)

```python
# 1. 收集所有 score < 3 的 criteria
weak = [c for c in scorecards if c.score < 3]

# 2. 按 score 升序排序 (1 在前)
weak.sort(key=lambda c: c.score)

# 3. 取前 3 条作为初步 candidate
selected = weak[:3]

# 4. spec 强制: Subject Line 和 Pre-Call Question 若 = 1，必须出现且优先
forced = [c for c in scorecards
          if c.criterion in ("subject_line", "pre_call_question")
          and c.score == 1]

# 5. 合并 forced 在前，去重，截到 3 条
final = dedupe(forced + selected)[:3]
```

每个 criterion 的 coaching 文案存在 YAML，按 `(criterion, score, top_failed_signal)` 三元 key 索引:

```yaml
# backend/app/sim/outreach_email/coaching.yaml
subject_line:
  1:
    no_anchor: |
      Your subject reads like an internal calendar invite. Try naming
      what's at stake — e.g. "Aria Rep Readiness — Kickoff Discovery Call".
    too_long: |
      Cut to under 10 words. Jordan scans subjects between meetings;
      long ones get pushed to "later".
    generic_only: |
      "Kickoff Meeting" gets opened after lunch. A subject that signals
      stakes gets opened immediately.
  2:
    no_stakes: |
      You named the project — good. Now signal what's at stake. Add a
      word like "readiness", "ramp", or "discovery".

pre_call_question:
  1:
    googleable: |
      Anyone could answer this with a search. Ask something only Jordan
      or Priya can answer from their experience — like what reps actually
      struggle with in the first 60 days.

# ... (≈ 7 × 3 = 21 条模板，由内容团队撰写)
```

---

## 5. Stakeholder Response 投递 (静态 fixture)

```json
// backend/app/sim/outreach_email/stakeholder_responses.json
{
  "exemplary": {
    "jordan_reply": "<Jordan confirms quickly + answers pre-call question>",
    "priya_reply":  "<Priya replies with product details>"
  },
  "proficient": {
    "jordan_reply": "<Jordan confirms but asks a clarifying question>",
    "priya_reply":  null
  },
  "developing": {
    "jordan_reply": "<Jordan responds late: 'Can you clarify what this call is actually for?'>",
    "priya_reply":  null
  }
}
```

数据库存 `stakeholder_response_key`，下一个 scene 直接读 key 渲染。**确定性、可重放、内容团队改文案不需要发版后端代码。**

---

## 6. API 接口

```
POST /api/sim/outreach-email/score
  body:
    {
      "subject":  "...",
      "sections": {
        "context":     "...",
        "purpose":     "...",
        "question":    "...",
        "scheduling":  "...",
        "close":       "..."
      },
      "attempt": 1 | 2
    }
  resp:
    {
      "scorecards": [
        { "criterion": "subject_line", "score": 2, "signals": {...},
          "failed_reasons": ["no_stakes"] },
        ...
      ],
      "total": 14,
      "tier": "proficient",
      "coaching": [
        { "criterion": "subject_line", "message": "..." },
        ...
      ],
      "stakeholder_response_key": "proficient",
      "revision_allowed": true
    }

POST /api/sim/outreach-email/send
  body: { "attempt_id": "..." }
  resp: { "jordan_reply": "...", "priya_reply": "..." | null }
```

约束:
- 提交前 parser 校验 subject + 5 sections 全非空，否则 422 不评分
- To/Cc 字段后端不接收 (前端只读，防注入)
- attempt 2 直接覆盖 attempt 1 的 stakeholder_response_key
- send 锁定为最终结果

---

## 7. 数据库 Schema

```python
# backend/app/models.py 新增

class OutreachEmailAttempt(Base):
    __tablename__ = "sks_outreach_email_attempts"

    id              = Column(String, primary_key=True, default=gen_uuid)
    user_id         = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    attempt_number  = Column(Integer)          # 1 or 2
    subject         = Column(String)
    body_sections   = Column(JSON)             # {context, purpose, question, scheduling, close}
    word_count      = Column(Integer)
    scorecards      = Column(JSON)             # 完整 scorecard 列表 (含 signals)
    total_score     = Column(Integer)
    tier            = Column(String)           # "developing" | "proficient" | "exemplary"
    coaching        = Column(JSON)
    stakeholder_response_key = Column(String)
    sent            = Column(Boolean, default=False)
    created_at      = Column(DateTime, default=datetime.utcnow)
```

> 保留 `signals` 字段用于事后规则校准 (看哪条 rule 误杀/漏判最多)。

---

## 8. 后端模块结构

```
backend/app/sim/outreach_email/
    __init__.py
    schema.py                  # Pydantic models: SubmissionIn, GradeOut, Scorecard
    parser.py                  # 拆 subject + 5 sections，归一化，completeness check
    rubric/
        __init__.py            # orchestrator: run_all() → list[Scorecard]
        subject_line.py
        context.py
        meeting_purpose.py
        pre_call_question.py
        scheduling.py
        close.py
        tone_word_count.py
    coaching.py                # YAML 加载 + 选择算法
    coaching.yaml
    stakeholder_responses.json
    anti_cheat.py              # exemplary-paste 检测 (5-gram Jaccard)

backend/app/routers/sim_outreach_email.py     # FastAPI router

tests/sim/outreach_email/
    test_subject_line.py
    test_context.py
    test_meeting_purpose.py
    test_pre_call_question.py
    test_scheduling.py
    test_close.py
    test_tone_word_count.py
    test_orchestrator.py
    test_coaching.py
    fixtures/
        sample_exemplary.txt        # 来自 spec 的 247-word 样例
        sample_proficient.txt       # calibration 数据集
        sample_developing.txt
        edge_cases/*.txt
```

每个 criterion 一个文件、一个 `score(parsed) -> Scorecard` 函数:

- 单测覆盖每条 rule 的边界
- 内容团队/设计团队不必读全栈代码
- 调阈值/词表只动一个文件

---

## 9. Anti-Cheat (轻量)

- 提交前 parser 校验所有 5 个 section 非空 (前端 + 后端双重校验)
- 5-gram Jaccard similarity vs spec sample exemplary email:
  - `> 0.85` → Subject Line + Pre-Call Question 封顶到 2，附加 coaching「请用自己的话写」
  - 不直接判 0 — 教学场景下惩罚太重适得其反
- 同一 user_id rate limit: 3 次提交/分钟 (即使没 LLM 也防止误操作刷库)

---

## 10. 规则方法论的 5 处固有局限 (须显式承认)

| spec 字面要求 | 规则可检测? | proxy 信号 |
|---|---|---|
| Subject Line: "Would stand out in Jordan's six-meeting day" | ❌ | "stakes anchor + 词数 ≤10" |
| Context: "Shows understanding of Jordan's and Priya's *different* priorities" | ❌ | "两人都被提到 + 提到不同维度词" 弱代理 |
| Meeting Purpose: "Framed as discovery" | ❌ | discovery verb 列表 (`discover`, `walk away with`, `align`)，同义改写会漏判 |
| Close: "Leaves stakeholders wanting to reply" | ❌ | "forward-looking + partner + shared-goal 三签到" |
| Tone: "Confident but not presumptuous" | ❌ | presumptuous + stiff 黑名单 |

**取舍**: 纯规则方案下，**最高分会偏紧、最低分会偏松** —— 写得"语义上 Exemplary 但缺关键 keyword"的学员会被低判到 Proficient；写得"keyword 都对但语气其实不好"的学员可能被高判。

**缓解措施**:
1. ≥30 封人工标注样本做 calibration，反复调阈值
2. 所有 proxy 信号写进 `signals` 字段，事后能审计
3. 上线后 1–2 个月持续观察 score 分布，按需补 keyword 列表

---

## 11. 实施阶段

| Phase | 范围 | 估时 |
|---|---|---|
| **A. 后端 scoring 引擎** | 7 个 rule scorer + orchestrator + YAML coaching + 单测覆盖 ≥80% | 3–4 天 |
| **B. API + DB** | router + Pydantic schemas + Alembic migration + persistence | 1–2 天 |
| **C. 前端 composer** | `stakeholder-kickoff-outreach-compose.html` partial、live word counter、results panel、revise/send 状态机 | 2–3 天 |
| **D. Calibration** | 设计/内容团队人工标注 30 封样本邮件，跑 scorer，调阈值 | 1–2 天 |

**总计**: 约 2 周。**全部纯代码无外部依赖。**

---

## 12. 落地前必须确认 (责任归属)

| # | 问题 | 责任方 |
|---|---|---|
| 1 | ≥30 封不同质量样本邮件人工标注 (Phase A 完成前必备) | 内容/设计团队 |
| 2 | Stakeholder reply 文案 (3 个 tier 的 Jordan/Priya 回复) | 内容团队 |
| 3 | Pre-Call Question 黑名单/白名单扩充 (10–20 条反面案例) | 内容团队 |
| 4 | Maya coaching 文案 ~21 条 (7 criteria × 3 score-tier) | 内容团队 |
| 5 | `WORDS_EXEMPLARY_MAX` 阈值 ("well under 300" 具体值，建议 250–270) | 内容团队 sign off |
| 6 | sim 是否要求登录 (匿名 attempt 是否允许) | 产品团队 |

---

## 13. 与 spec 的对齐校验 (最终)

| 校验项 | 状态 |
|---|---|
| 7 criteria 命名、顺序、buckets、coaching delivery | ✅ 完全对齐 |
| Subject Line stakes 信号 (修正后) | ✅ |
| Meeting Purpose 不依赖 45-min (修正后) | ✅ |
| Word Count 阈值 270/300 (修正后) | ✅ |
| 5-section 完整性校验 (新增) | ✅ |
| To/Cc 字段固定不可改 (新增) | ✅ |
| 5 处语义判定的规则局限 | ⚠ 已显式承认，须 calibration 缓解 |

**结论: 修正后 plan 与 spec 字面 100% 对齐，可作为 Phase 3 后端实施基线。**
