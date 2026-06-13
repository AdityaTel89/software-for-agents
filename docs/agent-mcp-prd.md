# Product Requirements Document (PRD)

## Product Name (working title): AgentReady API Layer

**Category:** Software for Agents — Machine-Readable Documentation & Schema Layer for Existing APIs
**Document version:** 1.0
**Date:** June 2026
**Owner:** Founder / Solo builder

---

## 1. Problem Statement

### 1.1 The core problem

AI agents are increasingly being used to perform real tasks on behalf of users — booking, research, CRM updates, scheduling, customer support actions, and more. To do this, agents need to call external APIs and services programmatically.

However, almost every API in existence today was designed and documented for **human developers**, not for AI agents. This creates several concrete failure modes:

- **Documentation is unstructured.** API docs are written as prose, FAQs, and code samples in multiple languages — formats an LLM can misread, hallucinate from, or fail to parse reliably.
- **Tool descriptions (when they exist) are too sparse.** Auto-generated MCP servers built directly from OpenAPI specs inherit terse, human-oriented field names and descriptions (e.g., `due` instead of "due date in ISO 8601 format"), causing agents to guess formats incorrectly, call the wrong endpoint, or get stuck.
- **Errors are not agent-readable.** A raw `400 Bad Request` with an HTML body or a generic JSON error gives an agent nothing actionable. Agents can't self-correct without structured, explained errors.
- **No quality signal exists.** A developer integrating an agent with a third-party API has no way to know, in advance, whether that API's MCP server will work reliably with an LLM-driven agent — there's no equivalent of a "compatibility score" or "tested with agents" badge.
- **Most APIs have no MCP server at all**, and the ones generated automatically by existing tools (Speakeasy, Stainless, FastMCP, etc.) are functional but largely untested against real agent behavior — they convert structure but don't validate usability.

### 1.2 Why now

- MCP has become the de facto standard for connecting agents to tools, supported across Claude, ChatGPT, Cursor, and major agent frameworks (LangChain, CrewAI, etc.).
- The number of AI agents performing autonomous, multi-step tasks is growing rapidly — but the software layer they depend on hasn't caught up.
- Generic OpenAPI-to-MCP conversion has become commoditized and is often low quality; there is a clear gap for a **quality and reliability layer** on top of raw conversion.

### 1.3 What we are NOT solving (out of scope for MVP)

- We are not building another generic OpenAPI-to-MCP code generator (that market is saturated).
- We are not building agents ourselves.
- We are not solving enterprise-grade auth (SSO/SAML) in the MVP — focus on API-key/simple OAuth services first.

---

## 2. Goals & Success Metrics

### 2.1 Primary goal

Prove that a **hand-tuned, eval-tested MCP server** measurably outperforms a generic auto-generated one on real agent task-completion rates — and that this quality difference is something both agent builders and API providers will pay for.

### 2.2 Success metrics (MVP phase)

| Metric | Target |
|---|---|
| Number of live, hosted MCP servers | 2–3 |
| Tools per server | 10–15 (curated, not exhaustive) |
| Agent task success rate (eval suite) | ≥ 85% on realistic multi-step tasks |
| Public content pieces published (eval write-ups) | ≥ 1 per server |
| Inbound interest (signups, replies to outreach, community engagement) | Qualitative signal — any genuine interest from agent builders or API providers |
| Direct outreach response rate from target SaaS companies | ≥ 1 meaningful conversation |

---

## 3. Users & Personas

### 3.1 Primary persona: "Agent Builder" (Developer)

**Who they are:** Engineers or small teams building AI agents (research agents, ops agents, shopping agents, internal automation) using frameworks like LangChain, CrewAI, or Claude-based agent SDKs.

**Their problem today:** They want their agent to interact with third-party services (CRMs, project tools, calendars, etc.), but either:
- The service has no MCP server, so they write custom integration code, or
- The service has an auto-generated MCP server that works inconsistently, causing their agent to fail mid-task in ways that are hard to debug.

**What they want from us:** A reliable, pre-tested MCP server they can plug in immediately, with documented success rates so they know what to expect — reducing their integration and debugging time.

**How they find us:** Directory/landing page, community posts (Discord, X/Twitter, Reddit), word of mouth from other builders.

### 3.2 Secondary persona: "SaaS Product Owner / API Team"

**Who they are:** Product managers or engineers at small-to-mid-size SaaS companies (CRMs, project management tools, scheduling tools, etc.) who are aware that "agent compatibility" is becoming a feature customers ask about, but don't have bandwidth to build and maintain an MCP server themselves.

**Their problem today:** They either ignore agent compatibility (risking being left out as agents become a major traffic source) or attempt a quick auto-generated MCP server that's untested and may reflect poorly on their product if agents fail using it.

**What they want from us:** A done-for-you, tested MCP server (or a credible audit of their existing one) that they can officially adopt, link to from their docs, or co-brand — positioned as "agent-ready, verified."

**How they find us:** Direct outreach from us, or discovery via the eval write-ups/content we publish about their API.

### 3.3 Tertiary persona (future): "Agent end-user" (indirect)

The actual person whose task gets completed (e.g., "create a task," "find a contact"). They never interact with our product directly, but task success/failure directly affects their experience — this is the ultimate quality bar our evals are measuring against.

---

## 4. Core Features (MVP Scope)

### 4.1 Curated MCP Servers (per target API)

**What it is:** For each selected API, a hosted, remote MCP server exposing 10–15 hand-designed tools covering the most common real-world actions (create/read/update/list/search on core objects).

**Why it matters:** This is the actual product agents connect to. Quality here (descriptions, schemas, error handling) is the core value proposition.

**Requirements:**
- Each tool has an LLM-oriented name, detailed description (what it does, when to use it, format requirements, what it returns), and a tightly-scoped input schema.
- Structured error responses (`ToolError` schema) for all failure modes.
- Pagination and response-shape simplification handled internally (agents shouldn't manage cursors or parse nested API responses).
- Hosted as a remote MCP server (SSE/HTTP), reachable without local setup.

### 4.2 Eval Harness & Agent-Readiness Score

**What it is:** A repeatable test suite where Claude attempts realistic multi-step tasks against each MCP server, with automated scoring of task success, steps used, and failure modes.

**Why it matters:** This is the differentiator versus generic converters — it turns "we made an MCP server" into "we made an MCP server, and here's proof it works, with a number to back it up."

**Requirements:**
- 10–20 tasks per API, covering common real-world workflows.
- Automated success verification (where possible, via a follow-up API call confirming the action took effect).
- Output: a score (success rate), average steps used, and a log of common failure modes.
- Score is iterated against — failures feed back into tool description/schema improvements.

### 4.3 Directory / Landing Page

**What it is:** A public page listing each available MCP server, its agent-readiness score, connection instructions, and example tasks it handles well.

**Why it matters:** This is the discovery and trust layer — both for agent builders looking for reliable integrations, and as a portfolio for outreach to SaaS companies.

**Requirements:**
- One page per MCP server: description, connection URL, auth setup steps, score, example tasks.
- Overview page listing all available servers, sortable/filterable by category and score.
- Clear "how to connect" instructions usable by a developer in under 5 minutes.

### 4.4 Public Content / Eval Write-ups

**What it is:** Blog-style write-ups documenting the eval process and results for each API — "what we tested, what broke, how we fixed it, and the resulting score."

**Why it matters:** Drives discovery (SEO, community sharing), establishes credibility, and serves as a natural outreach artifact when contacting the underlying SaaS companies.

**Requirements:**
- One write-up per MCP server built.
- Concrete before/after examples (e.g., a task that failed with a generic converter's tool description, and how the rewritten description fixed it).

---

## 5. Out-of-Scope / Future Features (Post-MVP)

These are explicitly **not** part of the MVP but inform the roadmap:

- **Marketplace/subscription model** — paid access to a growing library of verified MCP servers for agent builders.
- **"Agent-readiness certification" service** — a productized audit/certification offering for SaaS companies, with a public badge.
- **Per-user OAuth flows** — supporting individual end-user authentication rather than a shared dev credential, needed for any real production usage beyond demos/evals.
- **Self-serve onboarding** — letting a SaaS company submit their API and get an auto-generated draft MCP server plus eval report, with our team refining it.
- **Expanded eval coverage** — adversarial tasks, multi-server workflows (an agent using two MCP servers together), and regression testing on API version changes.

---

## 6. Risks & Open Questions

| Risk | Notes |
|---|---|
| Generic converter tools improve quality fast, eroding the differentiation | Mitigated by focusing on the eval/scoring layer as the moat, not just the conversion itself |
| Target SaaS companies are unresponsive to outreach | Mitigated by leading with public content/proof rather than cold pitches |
| Eval results don't generalize (overfit to test tasks) | Mitigate by keeping a held-out task set separate from the tasks used during iteration |
| Shared dev credentials hit rate limits during eval runs | Build in backoff/retry; keep eval suite size reasonable (10–20 tasks) |
| Single-founder bandwidth limits number of integrations | MVP intentionally scoped to 2–3 APIs to stay achievable in 6–8 weeks |

---

## 7. Summary

This product solves the gap between **"an API technically has an MCP server"** and **"an AI agent can actually use this API reliably to complete real tasks."** The MVP proves this gap is real and closeable by building 2–3 hand-tuned, eval-scored MCP servers, publishing the results, and using them to open conversations with both agent-builder communities (as users) and SaaS companies (as potential customers/partners) — setting up the foundation for either a marketplace or a certification-service business model depending on where traction emerges.
