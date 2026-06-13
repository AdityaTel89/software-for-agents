# AppFlow.md — AgentReady API Layer (MVP)

This document maps every end-to-end flow in the MVP: who does what, in what order, across the landing page, MCP servers, and eval harness. Use this as the single reference for "what happens when X happens."

---

## 0. Actors

| Actor | Description |
|---|---|
| **Visitor** | Anyone browsing the landing page (agent developer, curious SaaS team member, etc.) |
| **Agent Developer** | A developer connecting their AI agent to one of our MCP servers |
| **AI Agent** | The running agent (e.g., Claude via Claude Code, or another framework) that calls tools at runtime |
| **Founder (You)** | Builds MCP servers, runs evals, publishes content, does outreach |
| **SaaS Company** | The team behind the target API we've wrapped (recipient of outreach) |

---

## Flow 1: Visitor → Directory → Server Detail (Discovery Flow)

**Goal:** A visitor finds and understands what's available.

```
1. Visitor lands on Home (/)
     │
     ▼
2. Sees: hero/intro, list of available MCP servers as cards
   Each card shows: API name, short description, agent-readiness
   score (e.g., "92% task success"), category tag
     │
     ▼
3. Visitor clicks a server card
     │
     ▼
4. Lands on Server Detail page (/servers/[server-slug])
     │
     ▼
5. Sees:
     - What this server connects to (target API)
     - List of tools exposed (with short descriptions)
     - Agent-readiness score + breakdown
     - Example tasks it handles well
     - "How to connect" instructions
     - Link to eval write-up (blog post)
```

**Screens involved:** Home, Server Detail.

---

## Flow 2: Agent Developer → Connect → First Successful Task (Activation Flow)

**Goal:** A developer goes from "interested" to "their agent successfully calls a tool."

```
1. Developer is on Server Detail page (from Flow 1)
     │
     ▼
2. Clicks "Connect" / scrolls to "How to Connect" section
     │
     ▼
3. Sees:
     a. MCP server URL (e.g., https://mcp-toolA.fly.dev/sse)
     b. Auth setup instructions:
          - "Get an API key from [Target API]'s developer settings"
          - "Add it to your agent's MCP config as TARGET_API_KEY"
     c. Sample MCP config snippet (JSON) ready to copy-paste
     │
     ▼
4. Developer copies config into their agent framework
   (Claude Desktop / Claude Code / LangChain / custom)
     │
     ▼
5. Developer's agent connects → MCP transport handshake
   → tool list (10-15 tools) becomes available to the agent
     │
     ▼
6. End user gives agent a task (e.g., "create a task to review
   the budget, due Friday")
     │
     ▼
7. Agent selects the right tool (per Section 4.3 of tech spec —
   description tells it when/how to use it)
     │
     ▼
8. Agent calls tool → MCP server processes (auth, API call,
   response mapping, error normalization) → returns result
     │
     ▼
9. Agent confirms completion to end user
```

**Screens involved:** Server Detail (connection instructions).
**Key dependency:** Tool descriptions must be clear enough that step 7 happens correctly without developer intervention — this is the core quality bar.

---

## Flow 3: Founder → Build New MCP Server (Build Flow)

**Goal:** Repeatable process for adding a new target API to the system.

```
1. Founder selects target API (per selection criteria:
   popular, simple auth, underserved, has free dev tier)
     │
     ▼
2. Fill out Integration Specification template
   (base URL, auth type, rate limits, core objects)
     │
     ▼
3. Scaffold new package: packages/mcp-server-<name>
   (copy structure from @agentapi/core template)
     │
     ▼
4. Implement:
     - client.ts (typed wrapper around target REST API)
     - auth.ts (API key / OAuth handling)
     - tools/*.ts (10-15 tool handlers)
     │
     ▼
5. Local test: connect Claude Desktop/Code to local server,
   manually try a few tasks
     │
     ▼
6. Deploy to Fly.io (staging)
     │
     ▼
7. → proceeds to Flow 4 (Eval Flow)
```

**Screens involved:** None (developer/CLI workflow).

---

## Flow 4: Founder → Eval & Iterate (Quality Loop)

**Goal:** Measure and improve agent task-success rate before publishing.

```
1. Write/update task definitions:
   eval-harness/tasks/<server-name>-tasks.json (10-20 tasks)
     │
     ▼
2. Run eval harness: `pnpm run eval --server=<server-name>`
     │
     ▼
3. For each task:
     a. Fresh Claude conversation, MCP server's tools available
     b. Claude attempts task (up to max_steps)
     c. Verification step confirms outcome via API call
     d. Result logged: pass/fail, steps used, errors
     │
     ▼
4. Harness outputs: eval-harness/results/<server-name>.json
   { success_rate, avg_steps_used, common_failure_modes }
     │
     ▼
5. Review failures:
     ├── Ambiguous tool description? → rewrite (Section 4.3)
     ├── Schema too loose/strict? → adjust zod schema
     └── Unhelpful error message? → fix Error Normalizer
     │
     ▼
6. Redeploy updated server → repeat from step 2
     │
     ▼
7. Once success_rate ≥ 85% (or stable plateau):
   → mark server as "published"
   → results JSON feeds Server Detail page score
   → proceed to Flow 5
```

**Screens involved:** None directly, but output feeds Flow 1's Server Detail page.

---

## Flow 5: Founder → Publish & Distribute (Go-to-Market Flow)

**Goal:** Turn a finished, scored MCP server into visibility and outreach opportunities.

```
1. Server marked "published" (Flow 4 complete)
     │
     ▼
2. Write eval write-up (MDX blog post):
     - What we built
     - What broke initially (concrete before/after tool
       description examples)
     - Final score + methodology
     │
     ▼
3. Add server to Home directory + create Server Detail page
     │
     ▼
4. Push to main → CI deploys landing page (Vercel)
     │
     ▼
5a. Branch: Community distribution
     - Post write-up to relevant communities (agent framework
       Discords, X/Twitter, Reddit)
     - Goal: agent developers discover & connect (→ Flow 2)
     │
5b. Branch: SaaS company outreach
     - Identify contact at the target API's company
       (dev relations, product team)
     - Send outreach referencing the published write-up + score
     - Goal: conversation about official adoption/co-branding
     │
     ▼
6. Monitor: connection attempts (logs on MCP server),
   community engagement, outreach replies
     │
     ▼
7. Feed signals back into roadmap:
     - Strong developer interest → prioritize marketplace direction
     - Strong SaaS interest → prioritize certification-service direction
```

**Screens involved:** Home (updated directory), Server Detail (new page), Blog/Write-up page.

---

## Screen Inventory (Landing Page)

### Home (`/`)
- Hero section: one-line positioning ("Agent-ready APIs, tested and scored")
- Grid of server cards: name, category, score badge, short description
- Link to "How it works" (brief explanation of the eval methodology)
- Link to blog/write-ups index

### Server Detail (`/servers/[slug]`)
- Header: API name, category, overall agent-readiness score
- Section: "Tools available" — list of 10-15 tools with one-line descriptions each
- Section: "Score breakdown" — success rate, avg steps, link to full eval results JSON
- Section: "Example tasks this handles well" — 3-5 sample prompts
- Section: "How to connect" — server URL, auth setup steps, copy-paste MCP config snippet
- Link: "Read the full eval write-up"

### Blog / Write-ups (`/blog` and `/blog/[slug]`)
- Index of all eval write-ups
- Individual post: methodology, before/after examples, final score, link back to Server Detail

### How It Works (`/how-it-works`)
- Static page explaining: why generic MCP servers often fail agents, what we do differently (curated tools + eval-driven iteration), how the scoring works

---

## End-to-End Summary Diagram

```
Founder builds & evals server  ──►  Published to directory  ──►  Visitor discovers
        (Flows 3 & 4)                      (Flow 5)                  (Flow 1)
                                                                          │
                                                                          ▼
                                                              Developer connects agent
                                                                    (Flow 2)
                                                                          │
                                                                          ▼
                                                              Agent completes real task
                                                              using hosted MCP server
                                                                          │
                                                                          ▼
                                                          Signals (connections, replies,
                                                          engagement) feed back into
                                                          roadmap decisions (Flow 5, step 7)
```

---

## Notes on MVP vs. Future Flows

- **No login/auth flow for visitors or developers in MVP** — all MCP servers use a shared dev credential for the target API; "connecting" just means pointing an agent config at our hosted URL. A per-user auth flow (OAuth to the target API on behalf of each end user) is a clearly-flagged future flow once moving toward production usage.
- **No payment flow in MVP** — distribution is free; monetization flows (subscription to directory, certification service for SaaS companies) are designed for after traction signals from Flow 5.
