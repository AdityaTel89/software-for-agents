# RULES.md — AgentReady API Layer (MVP)

**Purpose:** This file defines the rules that must be followed throughout implementation, whether work is done by a human or an AI coding assistant ("vibe coding"). These rules exist to keep the codebase consistent, safe, and aligned with the PRD/technical spec — even across many small, incremental sessions.

**If any instruction in a chat session conflicts with this file, this file wins, unless the user explicitly says otherwise for that specific change.**

---

## 1. General Working Principles

1. **Read before writing.** Before editing or adding to any file, view its current contents and the contents of related files (e.g., before adding a tool, look at an existing tool in the same package as a reference pattern).
2. **Small, scoped changes.** One logical change per work session/commit — e.g., "implement `create_task` tool," not "implement all tools + deploy + write blog post." Large phases (per `IMPLEMENTATION_PLAN.md`) should be broken into single-task steps.
3. **Follow the plan, flag deviations.** Work should map to a task in `IMPLEMENTATION_PLAN.md` / `TRACKER.md`. If a needed change isn't in the plan, or the plan needs to change, say so explicitly rather than silently going off-script.
4. **Update the tracker.** After completing any task, update `TRACKER.md`: change status, add a one-line note. Do not let the tracker drift from actual code state.
5. **No speculative features.** Do not build anything listed under "Out of Scope / Future" in the PRD unless explicitly requested for this session. Resist the urge to add "nice to have" extras (auth systems, databases, extra tools) not called for by the current task.

---

## 2. Code Style & Structure

1. **TypeScript strict mode** is enabled at the root `tsconfig.base.json` and must not be weakened in individual packages.
2. **File/folder structure** must match the structure defined in the technical spec (`packages/mcp-server-<name>/src/{index.ts, tools/, client.ts, auth.ts, errors.ts}`). New packages should copy this structure, not invent a new one.
3. **One tool = one file** in `tools/`, named after the tool (e.g., `createTask.ts` for `create_task`).
4. **No duplication of `@agentapi/core` logic.** If a new MCP server needs error handling, logging, or retry logic, import from `@agentapi/core` — do not reimplement. If `@agentapi/core` is missing something needed, add it there (with tests) rather than duplicating locally.
5. **Use `zod` for all tool input schemas**, and derive the JSON Schema sent to the MCP SDK from the zod schema (don't maintain two separate schema definitions for the same tool).
6. **No `any` types** except where unavoidable when interfacing with untyped third-party API responses — and even then, define a local interface for the expected shape and cast once, at the boundary.

---

## 3. Tool Definition Rules (Critical — this is the product's core value)

Every tool **must** satisfy all of the following before being considered done:

1. **Naming convention:** `create_<object>`, `get_<object>`, `list_<objects>`, `update_<object>`, `delete_<object>`, `search_<objects>` — snake_case, verb_noun.
2. **Description must cover all 5 points:**
   - What it does (one sentence)
   - When to use it (what user intent triggers it)
   - Format requirements with concrete examples (dates, IDs, enums)
   - What it returns
   - Common pitfalls (explicitly called out, e.g., "convert relative dates before calling")
3. **Curated, not exhaustive.** Only implement tools that map to real tasks a user would ask an agent to do. If an endpoint doesn't clearly map to a tool a user would need, do not implement it just because it exists in the API.
4. **Every tool must return either a successful, trimmed response (per Section 5.2 of the technical spec) or a `ToolError`** — never a raw exception, never the raw upstream API response shape.
5. **Every new tool requires a corresponding eval task** in `eval-harness/tasks/<server>-tasks.json` before the tool is considered complete (see Section 6).

---

## 4. Error Handling Rules

1. All errors returned to the agent must use the `ToolError` shape from `@agentapi/core`:
   ```typescript
   { error: true, code: ToolErrorCode, message: string, retryable: boolean, details?: {...} }
   ```
2. All upstream HTTP calls must go through `normalizeHttpError` — never let a raw `fetch` error or HTTP status propagate unhandled.
3. `message` must be written for an LLM to read and act on (explain *what* was wrong and, where possible, *how to fix it* — e.g., correct date format).
4. Never swallow errors silently (no empty `catch` blocks). If an error is truly expected and ignorable, log it at `debug` level with a comment explaining why.

---

## 5. Security & Secrets Rules

1. **Never commit secrets.** No API keys, tokens, or credentials in code, config files, or commit messages — ever, including in `.env` files (must be gitignored).
2. **`.env.example` must stay in sync** — when a new environment variable is introduced, add it to `.env.example` with a placeholder value and a comment explaining what it's for.
3. **Logs must not contain secrets.** Use `@agentapi/core`'s logger, which redacts known secret field names. Never `console.log` raw request/response objects that might contain auth headers or tokens.
4. **Before deploying anything that costs money or uses external API quota** (Fly.io deploys, Anthropic API eval runs against real APIs, etc.), confirm with the user first — do not assume permission for actions with cost implications.

---

## 6. Eval-Driven Development Rules

1. **No tool ships without an eval task.** Every new or modified tool must have at least one corresponding task in the eval harness that exercises it.
2. **Eval failures are bugs.** A failing eval task is treated the same as a failing unit test — it must be triaged (classified per Phase 5 of the implementation plan: ambiguous description / schema issue / error message issue / missing tool) and fixed before the task is marked done, not deferred indefinitely.
3. **Don't overfit to the eval set.** When fixing a failure, fix the underlying tool definition (description, schema, error handling) — not the eval task itself, unless the eval task was genuinely wrong (e.g., incorrect success criteria).
4. **Document before/after examples** when a description fix measurably improves eval results — these feed directly into the public write-ups (Phase 8/9).

---

## 7. Testing Rules

1. Every `client.ts` function and every tool handler should have at least one unit test (mocking the upstream API call).
2. Every shared `@agentapi/core` module must have unit tests covering its main code paths, including error cases.
3. `pnpm lint && pnpm typecheck && pnpm test` must pass before any change is considered complete — this is the minimum bar, not an optional extra step.
4. Do not write tests that depend on live external APIs or live network calls in the standard test suite — mock the HTTP layer. (Eval harness runs against real/deployed services separately and intentionally, per Section 6 — that's a different category from unit tests.)

---

## 8. Database & Infrastructure Rules

1. **Do not introduce a database** unless explicitly working on a Phase 10 (post-MVP) task that requires it. The MVP is intentionally database-free (per the infra spec) — adding one prematurely adds operational overhead with no MVP benefit.
2. **Do not add new hosting providers or services** beyond those defined in the infra spec (Fly.io, Vercel, GitHub Actions, UptimeRobot) without discussing first — every new service is a new thing to maintain and pay for.
3. **Any new dependency** (npm package) should be justified: prefer the existing stack (`zod`, `pino`, `@modelcontextprotocol/sdk`, `@anthropic-ai/sdk`, native `fetch`) before adding something new. If a new dependency is genuinely needed, note why in the commit/PR description.

---

## 9. Documentation Rules

1. Every new `mcp-server-<name>` package must have an `INTEGRATION.md` (per the template in the technical spec) before implementation starts.
2. Every tool's description (Section 3) **is** its primary documentation — do not write separate human-readable docs that duplicate/diverge from the tool description. Keep one source of truth.
3. `README.md` at the repo root should always reflect the current monorepo structure and how to run things locally (install, build, test, eval, run a server locally) — update it when structure changes.

---

## 10. Git & Workflow Rules

1. Commit messages should be descriptive and scoped: `feat(mcp-server-toolA): add create_task tool` rather than `update stuff`.
2. Do not mix unrelated changes in one commit (e.g., a new tool implementation + an unrelated lint config change should be separate commits).
3. CI (`lint`, `typecheck`, `test`) must pass before merging to `main`. Deploys are triggered from `main` per the infra spec — broken `main` means broken production.
4. After completing a task, update `TRACKER.md` in the same commit/session — tracker updates are not a separate "later" task.

---

## 11. Communication Rules (for AI-assisted sessions)

1. **State which phase/task** (from `IMPLEMENTATION_PLAN.md` / `TRACKER.md`) a session's work corresponds to at the start of the session.
2. **Surface ambiguity instead of guessing silently** — if a task is underspecified (e.g., which API to pick, what a field's exact format should be), ask or flag the assumption being made explicitly.
3. **Summarize what changed** at the end of a session: files touched, tests run, tracker updates made, and what the next logical task is.
4. **Do not deploy, spend API credits on large eval runs, or send outreach/content publicly** without explicit go-ahead — these are checkpoints, not automated steps.

---

## 12. Definition of "Done" (applies to every task)

A task is only `Done` when **all** of the following are true:
- [ ] Code implements exactly what the task in `IMPLEMENTATION_PLAN.md` describes (no more, no less)
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass
- [ ] New tools have descriptions meeting all 5 points (Section 3) and a corresponding eval task (Section 6)
- [ ] No secrets committed; `.env.example` updated if new env vars introduced
- [ ] `TRACKER.md` updated to reflect the new status
- [ ] Any deviations from the plan are explicitly noted (in the tracker notes and/or commit message)
