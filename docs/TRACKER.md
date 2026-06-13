# TRACKER.md — AgentReady API Layer (MVP)

Living progress tracker. Update this file as tasks are completed — do not let it drift from reality. Status values: `Not Started`, `In Progress`, `Blocked`, `Done`.

**How to use this file (for AI-assisted/"vibe coding" sessions):**
- Before starting work, check this file to see what's next.
- After completing a task, update its status and add a one-line note (date + what was done / any deviation from plan).
- If a task is `Blocked`, note why in the "Notes" column — don't silently skip it.
- Never mark a phase's "Exit Criteria" row as `Done` until it has been actually verified (tests run, deploy confirmed, etc.) — not just "code written."

---

## Phase 0: Project Foundations

| Task | Status | Notes |
|---|---|---|
| pnpm workspace initialized | Done | Monorepo pnpm workspaces created |
| Root TS/ESLint/Prettier/Vitest config | Done | Configured ESLint Flat Config, Prettier, TS, Vitest |
| `.gitignore` and `.env.example` created | Done | Created with placeholders |
| GitHub Actions skeleton (lint/typecheck/test) | Done | Created .github/workflows/ci.yml |
| **Exit criteria: `pnpm install/lint/typecheck/test` pass** | Done | Verified locally, lint/typecheck/test passing |

---

## Phase 1: Shared Core Library (`@agentapi/core`)

| Task | Status | Notes |
|---|---|---|
| Package scaffolded | Done | Scaffolded packages/core directory |
| `errors.ts` (ToolError, ToolErrorCode) | Done | Implemented standard shapes and isToolError guard |
| `logger.ts` (Pino + redaction) | Done | Configured Pino logger with standard credential redactions |
| `retry.ts` (withRetry) | Done | Implemented configurable exponential backoff |
| `httpErrors.ts` (normalizeHttpError) | Done | Implemented asynchronous HTTP and JS error normalizer |
| `types.ts` (ToolDefinition, JSONSchemaProperty) | Done | Defined standard MCP types |
| Unit tests written | Done | Created retry.test.ts, httpErrors.test.ts, logger.test.ts |
| **Exit criteria: core package tests pass** | Done | Verified locally, all 13 tests passed |

---

## Phase 2: API #1 Selection & Integration Spec

| Task | Status | Notes |
|---|---|---|
| Candidate APIs shortlisted (3-5) | Not Started | List candidates here |
| API #1 chosen | Not Started | Name: _______ |
| Sandbox credentials obtained, curl test passed | Not Started | |
| `INTEGRATION.md` filled out for API #1 | Not Started | |
| **Exit criteria: spec confirmed feasible** | Not Started | |

---

## Phase 3: MCP Server #1 — Core Implementation

| Task | Status | Notes |
|---|---|---|
| Package scaffolded | Not Started | |
| `auth.ts` implemented | Not Started | |
| `client.ts` implemented (all needed endpoints) | Not Started | |
| Tools implemented (target: 10-15) | Not Started | List tool names + status individually below |
| → `create_<object>` | Not Started | |
| → `get_<object>` | Not Started | |
| → `list_<objects>` | Not Started | |
| → `update_<object>` | Not Started | |
| → `delete_<object>` | Not Started | |
| → `search_<objects>` | Not Started | |
| → (add rows as more tools are defined) | Not Started | |
| `index.ts` + `/health` endpoint | Not Started | |
| Unit tests (2-3 representative tools) | Not Started | |
| Manual smoke test via Claude Desktop/Code (3-5 tasks) | Not Started | |
| **Exit criteria: all tools implemented + smoke tests pass** | Not Started | |

---

## Phase 4: Eval Harness

| Task | Status | Notes |
|---|---|---|
| Package scaffolded | Not Started | |
| Task schema defined | Not Started | |
| 10-20 tasks written for API #1 | Not Started | |
| `runEval.ts` implemented | Not Started | |
| `verify.ts` implemented | Not Started | |
| `scoreResult.ts` implemented | Not Started | |
| `pnpm run eval --server=<name>` works end-to-end | Not Started | |
| **Exit criteria: scoring report generated** | Not Started | |

---

## Phase 5: Iterate Server #1 to Target Quality

| Task | Status | Notes |
|---|---|---|
| Initial eval run completed | Not Started | First score: ___% |
| Failure modes classified | Not Started | |
| Fixes applied (descriptions/schemas/errors) | Not Started | Track iteration count: ___ |
| Re-run(s) completed | Not Started | Latest score: ___% |
| Before/after examples documented | Not Started | |
| **Exit criteria: score ≥ 85% or documented plateau** | Not Started | |

---

## Phase 6: Deploy Server #1

| Task | Status | Notes |
|---|---|---|
| `Dockerfile` written | Not Started | |
| Fly.io app created | Not Started | App name: _______ |
| Secrets configured | Not Started | |
| Deployed, `/health` returns 200 | Not Started | URL: _______ |
| Eval re-run against deployed URL | Not Started | Score: ___% |
| CI auto-deploy configured | Not Started | |
| **Exit criteria: deployed eval results match local** | Not Started | |

---

## Phase 7: Server #2 (repeat Phases 2-6)

| Task | Status | Notes |
|---|---|---|
| API #2 chosen + INTEGRATION.md | Not Started | Name: _______ |
| Core implementation complete | Not Started | |
| Eval tasks written | Not Started | |
| Iterated to target score | Not Started | Score: ___% |
| Deployed | Not Started | URL: _______ |
| **Exit criteria: server #2 live and scored** | Not Started | |

### Server #3 (optional)

| Task | Status | Notes |
|---|---|---|
| API #3 chosen + INTEGRATION.md | Not Started | Name: _______ |
| Core implementation complete | Not Started | |
| Eval tasks written | Not Started | |
| Iterated to target score | Not Started | Score: ___% |
| Deployed | Not Started | URL: _______ |

---

## Phase 8: Landing Page & Content

| Task | Status | Notes |
|---|---|---|
| `landing-page` scaffolded (Next.js + Tailwind + MDX) | Not Started | |
| Home page (server cards from results JSON) | Not Started | |
| Server Detail page template | Not Started | |
| "How It Works" page | Not Started | |
| Eval write-up #1 published | Not Started | |
| Eval write-up #2 published (if server #2 done) | Not Started | |
| Deployed to Vercel + custom domain | Not Started | Domain: _______ |
| **Exit criteria: 5-minute "discover → connect" manually verified** | Not Started | |

---

## Phase 9: Distribution & Outreach

| Task | Status | Notes |
|---|---|---|
| Write-up posted to community #1 | Not Started | Where: _______ |
| Write-up posted to community #2 | Not Started | Where: _______ |
| SaaS company #1 contact identified | Not Started | |
| SaaS company #1 outreach sent | Not Started | |
| SaaS company #2 contact identified | Not Started | |
| SaaS company #2 outreach sent | Not Started | |
| Engagement signals logged | Not Started | Replies / connections / stars: _______ |
| **Exit criteria: signals documented for Phase 10 decision** | Not Started | |

---

## Phase 10: Post-MVP Direction (do not start until Phase 9 signals exist)

| Task | Status | Notes |
|---|---|---|
| Direction decided (marketplace vs. certification) | Not Started | Decision + rationale: _______ |

---

## Overall MVP Status

| Metric | Current Value |
|---|---|
| MCP servers live | 0 / 2-3 |
| Average eval success rate across live servers | — |
| Write-ups published | 0 |
| Outreach sent | 0 / 2+ |
| Monthly infra cost (actual) | $0 |

---

## Change Log

| Date | Change |
|---|---|
| 2026-06-13 | Shared core library (Phase 1) completed: errors, logger, retry, and http error mapping implemented and tested. |
| 2026-06-13 | Setup and installation (Phase 0) completed: monorepo workspaces and tooling configs created, lint/typecheck/test passing. |
| _(start here)_ | Project initialized |
