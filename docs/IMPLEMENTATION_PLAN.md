# Implementation Plan — AgentReady API Layer (MVP)

Phase-wise execution plan. Each phase has a goal, detailed steps, deliverables, and exit criteria — exit criteria for one phase are the entry condition for the next. Designed for AI-assisted ("vibe coding") implementation, one phase at a time.

---

## Phase 0: Project Foundations
**Goal:** A working monorepo skeleton with tooling configured, before any product logic is written.

**Steps:**
1. Initialize monorepo with pnpm workspaces (`pnpm init`, `pnpm-workspace.yaml`).
2. Create top-level folders: `packages/`, with placeholders for `core`, `eval-harness`, `landing-page`.
3. Configure shared tooling at root: TypeScript base config (`tsconfig.base.json`), ESLint, Prettier, Vitest config.
4. Set up Git repo, `.gitignore` (node_modules, `.env`, build output, eval results that contain raw transcripts if too large).
5. Create `.env.example` at root documenting all environment variables that will eventually be needed (placeholders only).
6. Set up GitHub Actions skeleton: a workflow that runs `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test` on every PR (even with no packages yet, this should pass trivially).

**Deliverables:** Empty but fully wired monorepo; CI passes on an empty/no-op build.

**Exit criteria:** `pnpm install && pnpm lint && pnpm typecheck && pnpm test` all succeed locally and in CI.

---

## Phase 1: Shared Core Library (`@agentapi/core`)
**Goal:** Build the shared package that every MCP server will depend on, so it's never duplicated.

**Steps:**
1. Scaffold `packages/core` with its own `package.json`, `tsconfig.json`.
2. Implement `errors.ts`: `ToolError` type and `ToolErrorCode` enum (`NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `AUTH_ERROR`, `UPSTREAM_ERROR`).
3. Implement `logger.ts`: `createLogger(serviceName)` returning a configured Pino instance (JSON output, redaction for common secret field names).
4. Implement `retry.ts`: `withRetry(fn, options)` — exponential backoff wrapper for HTTP calls.
5. Implement `httpErrors.ts`: `normalizeHttpError(response)` — maps HTTP status codes + body shapes to `ToolError`.
6. Implement `types.ts`: shared `ToolDefinition`, `JSONSchemaProperty` types matching the MCP SDK's expected shapes.
7. Write unit tests for each module (especially `normalizeHttpError` with several mock response shapes, and `withRetry` with simulated failures).
8. Export everything from `index.ts`.

**Deliverables:** `@agentapi/core` package, fully tested, ready to be imported by MCP server packages.

**Exit criteria:** `pnpm --filter @agentapi/core test` passes with good coverage on error mapping and retry logic.

---

## Phase 2: First Target API Selection & Integration Spec
**Goal:** Lock in the first target API and document its integration before writing code.

**Steps:**
1. Shortlist 3-5 candidate APIs against the selection criteria (popular, simple auth, underserved on MCP, free dev tier, clear core objects).
2. For the top candidate, get a sandbox/dev API key and verify basic auth works via a raw `curl` request.
3. Fill out the Integration Specification template (from the technical spec doc) for this API: base URL, auth type, rate limits, pagination style, core objects, target tool list (10-15).
4. Save this as `packages/mcp-server-<name>/INTEGRATION.md`.

**Deliverables:** A filled-in integration spec document for API #1.

**Exit criteria:** Spec reviewed and confirmed feasible (auth works, core objects mapped to a concrete list of ≤15 tools).

---

## Phase 3: MCP Server #1 — Core Implementation
**Goal:** A working, locally-runnable MCP server for API #1 with all planned tools implemented.

**Steps:**
1. Scaffold `packages/mcp-server-<name>` (copy structure pattern, depend on `@agentapi/core`).
2. Implement `auth.ts`: handles API key (or OAuth client-credentials) per the integration spec.
3. Implement `client.ts`: typed wrapper functions for each endpoint needed (one function per endpoint, using `fetch` + `withRetry` + `normalizeHttpError`).
4. Implement `tools/` — one file per tool:
   - Define `zod` input schema.
   - Write the LLM-oriented description (per the 5-point requirement: what/when/format/returns/pitfalls).
   - Implement handler: validate input → call client → map response → return result or `ToolError`.
5. Implement `index.ts`: register all tools with the MCP SDK server, configure SSE transport, expose `/health` endpoint.
6. Write unit tests for at least 2-3 representative tool handlers (mocking the client layer).
7. Run locally; connect via Claude Desktop or Claude Code's MCP config pointing at `http://localhost:8080`.
8. Manually run 3-5 sample tasks end-to-end to confirm basic functionality before moving to formal evals.

**Deliverables:** Locally working MCP server, 10-15 tools, basic test coverage, manually verified.

**Exit criteria:** All planned tools implemented; manual smoke tests via Claude Desktop/Code succeed for at least 3 representative tasks.

---

## Phase 4: Eval Harness
**Goal:** Build the eval runner and scoring pipeline, generic enough to point at any MCP server.

**Steps:**
1. Scaffold `packages/eval-harness`.
2. Define the task schema (`task_id`, `description`, `target_server`, `max_steps`, `success_criteria`).
3. Write 10-20 task definitions for API #1's MCP server (`tasks/<name>-tasks.json`), covering common real workflows.
4. Implement `runEval.ts`:
   - For each task: open a fresh Claude conversation via `@anthropic-ai/sdk`, register the target MCP server's tools (via `mcp_servers` config pointing at the deployed/local server URL).
   - Loop until task completion or `max_steps` reached, capturing the full transcript.
5. Implement `verify.ts`: per-task verification logic — typically a follow-up read call to the target API confirming the expected state.
6. Implement `scoreResult.ts`: aggregate pass/fail, steps used, and error logs into the scoring JSON schema (`success_rate`, `avg_steps_used`, `common_failure_modes`).
7. Add a script command: `pnpm run eval --server=<name>`.

**Deliverables:** Working eval harness producing `eval-harness/results/<name>.json`.

**Exit criteria:** Eval harness runs end-to-end against MCP server #1 and produces a scoring report (regardless of score quality at this point).

---

## Phase 5: Iterate Server #1 to Target Quality
**Goal:** Reach ≥85% task success rate on API #1's eval suite.

**Steps:**
1. Run the eval harness; review `common_failure_modes`.
2. For each failure, classify the root cause: ambiguous description, schema too loose/strict, bad error message, or missing tool.
3. Fix the corresponding tool definition, schema, or error mapping.
4. Re-run the eval harness; repeat until success rate plateaus at or above target, or diminishing returns are clear.
5. Document 2-3 concrete "before/after" examples of tool description fixes that improved scores — these become content for Phase 8.

**Deliverables:** Final eval score for server #1 ≥ 85% (or a documented, justified plateau below that with clear reasons).

**Exit criteria:** Eval results JSON committed; before/after examples documented in a scratch file for later use.

---

## Phase 6: Deploy Server #1
**Goal:** Server #1 is live and reachable as a remote MCP server.

**Steps:**
1. Write `Dockerfile` for `mcp-server-<name>`.
2. Create Fly.io app (`flyctl launch`), configure region, `min_machines_running: 1`.
3. Set secrets via `flyctl secrets set` (target API credentials).
4. Deploy (`flyctl deploy`), confirm `/health` returns 200.
5. Re-run the eval harness against the **deployed** URL (not localhost) to confirm parity.
6. Add a GitHub Actions job that deploys this package on merge to `main` when its files change.

**Deliverables:** Live MCP server URL for API #1, CI auto-deploy configured.

**Exit criteria:** Eval harness against the deployed URL matches local results within a small margin.

---

## Phase 7: Repeat for Server #2 (and optionally #3)
**Goal:** Apply Phases 2-6 to a second (and optionally third) target API, faster this time using the established patterns.

**Steps:** Repeat Phases 2-6 for API #2. Reuse `@agentapi/core`; reuse the eval harness (just add new task files). Expect significantly less time than server #1 since scaffolding, patterns, and tooling are proven.

**Deliverables:** A second live, scored MCP server.

**Exit criteria:** Same as Phases 5-6, applied to server #2.

---

## Phase 8: Landing Page & Content
**Goal:** Public-facing directory and write-ups are live.

**Steps:**
1. Scaffold `packages/landing-page` (Next.js + Tailwind + MDX).
2. Build Home page: server cards pulling from `eval-harness/results/*.json` (read at build time).
3. Build Server Detail page template (`/servers/[slug]`): tools list, score breakdown, example tasks, "how to connect" section with copy-paste MCP config.
4. Build "How It Works" static page.
5. Write eval write-up(s) as MDX blog posts, using the before/after examples from Phase 5.
6. Deploy to Vercel, connect custom domain.

**Deliverables:** Live landing page with at least 1-2 server listings and at least 1 published write-up.

**Exit criteria:** A new visitor can go from landing page → server detail → working MCP config in under 5 minutes (manually test this yourself).

---

## Phase 9: Distribution & Outreach
**Goal:** Get the work in front of both potential users (agent developers) and potential customers (SaaS companies).

**Steps:**
1. Post eval write-up(s) to relevant communities (agent framework Discords, X/Twitter, Reddit).
2. Identify contacts at the SaaS companies behind each wrapped API (dev relations, product, or general support as fallback).
3. Send outreach referencing the published write-up and score, framed as "here's a tested MCP server for your API — useful to you?"
4. Monitor: MCP server connection logs, community engagement (replies, stars, upvotes), outreach replies.

**Deliverables:** At least one published write-up shared publicly; outreach sent to all wrapped APIs' companies.

**Exit criteria:** Documented in `TRACKER.md` — engagement and reply signals logged for the next planning cycle (marketplace vs. certification-service direction).

---

## Phase 10 (Post-MVP, not started until signals from Phase 9)
**Goal:** Decide and begin the next direction based on traction.

**Possible branches:**
- **Marketplace direction:** introduce database (Neon/Supabase), user accounts, subscription billing (Stripe), expand server count.
- **Certification-service direction:** formalize the eval harness into a "submit your API, get an audit report" productized service; build a simple intake form.

This phase is intentionally left undetailed until Phase 9 produces real signal — premature planning here would be guesswork.
