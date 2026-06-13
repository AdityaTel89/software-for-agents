# MVP Build Plan: Agent-Ready API Layer (MCP Server + Eval Harness)

**Category:** Software for Agents — Machine-Readable Documentation & Schema Layer for Existing APIs
**Stack:** TypeScript / Node.js
**Target timeline:** 6–8 weeks, solo builder

---

## 1. Vision & Positioning

Instead of building "yet another OpenAPI-to-MCP converter" (a now-commoditized category), this MVP builds **hand-tuned, tested, agent-ready MCP servers** for popular APIs that currently have weak or no agent support — and proves quality with a public eval score.

The pitch in one line: *"We don't just generate an MCP server from your API — we test it with real AI agents until it actually works, and prove it with a score."*

---

## 2. Tech Stack

- **Language:** TypeScript (Node.js 20+)
- **MCP SDK:** `@modelcontextprotocol/sdk` (official Anthropic SDK)
- **Transport:** Remote MCP server over HTTP/SSE (not stdio) — must be reachable by hosted agents, not just local dev tools
- **Hosting:** Fly.io or Railway (simple, cheap, supports long-running Node processes)
- **Eval runner:** Anthropic API (`@anthropic-ai/sdk`) — Claude calls your MCP server in a loop and you score the transcript
- **Landing page:** Next.js + Tailwind (deploy on Vercel)
- **Auth storage:** Environment variables / per-session tokens for MVP (no need for a full secrets vault yet)
- **Logging/observability:** Simple structured JSON logs to start (e.g., Pino) — enough to debug tool-call failures

---

## 3. Target API Selection Criteria

Pick **2–3 APIs** for the MVP. Selection checklist:

1. **Popular enough to matter** — agent builders are likely to need it (CRM, project management, email/calendar, note-taking, scheduling).
2. **Simple auth** — API key or basic OAuth2 client-credentials flow. Avoid enterprise SSO/SAML for v1.
3. **Currently underserved** — check `mcpmarket.com` and the official MCP servers list; look for APIs with no MCP server, or only a low-quality auto-generated one.
4. **Has a free/cheap developer tier** — so you can build and test without paying for production access.
5. **Has clear core objects** — e.g., "contacts," "tasks," "events" — so a 10–15 tool subset can cover most real use cases.

**Suggested categories to scan first:** smaller CRMs (e.g., not Salesforce — too complex for v1), task/project tools, email-sending services, calendar/scheduling tools, note-taking/knowledge-base tools.

---

## 4. Architecture Overview

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  AI Agent /      │ MCP  │  Your MCP Server      │ REST │  Target API      │
│  Claude / agent  │◄────►│  (Node + TS, hosted)  │◄────►│  (CRM, etc.)     │
│  framework       │ SSE  │  - tool definitions    │ HTTP │                  │
└─────────────────┘      │  - auth handling        │      └─────────────────┘
                          │  - error normalization  │
                          └──────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │  Eval Harness          │
                          │  - task definitions     │
                          │  - Claude runs tasks    │
                          │  - scores results        │
                          └──────────────────────┘
```

Each MCP server is a standalone Node service. The eval harness is a separate script/project that talks to each MCP server the same way a real agent would.

---

## 5. Project Structure

```
agent-mcp-mvp/
├── packages/
│   ├── mcp-server-toolA/        # e.g., mcp-server-notion
│   │   ├── src/
│   │   │   ├── index.ts          # server entrypoint
│   │   │   ├── tools/            # one file per tool
│   │   │   │   ├── createTask.ts
│   │   │   │   ├── listTasks.ts
│   │   │   │   └── updateTask.ts
│   │   │   ├── client.ts         # wrapper around target API's REST client
│   │   │   ├── auth.ts           # auth handling
│   │   │   └── errors.ts         # error normalization
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── mcp-server-toolB/
│   └── eval-harness/
│       ├── tasks/
│       │   ├── toolA-tasks.json
│       │   └── toolB-tasks.json
│       ├── src/
│       │   ├── runEval.ts
│       │   └── scoreResult.ts
│       └── package.json
├── landing-page/                 # Next.js app
└── README.md
```

---

## 6. Week-by-Week Roadmap

### Week 1 — Setup & API Selection
- Finalize the 2–3 target APIs using the criteria in Section 3.
- Set up dev accounts/API keys for each.
- Scaffold the monorepo (pnpm workspaces or npm workspaces).
- Read each API's docs end-to-end; identify the 10–15 core endpoints to expose per API.

### Week 2–3 — Build MCP Server #1
- Implement `client.ts`: thin TypeScript wrapper around the target API's REST endpoints (typed request/response).
- Implement `auth.ts`: API key or OAuth client-credentials handling.
- Implement 10–15 tools, each with:
  - Clear, LLM-oriented name (e.g., `create_task`, not `POST /v2/items`)
  - Detailed description written for an LLM (see Section 7)
  - Input schema with examples in field descriptions
  - Normalized error handling (return structured `{error: string, retryable: boolean}` instead of raw HTTP errors)
  - Pagination handled internally where possible (don't make the agent manage page tokens unless necessary)
- Deploy to Fly.io/Railway as a remote MCP server (SSE transport).
- Manually test with Claude Desktop or Claude Code connected to your local/remote server.

### Week 4 — Build MCP Server #2 (repeat, faster now)
- Apply the same pattern. This should take less time since you've built the scaffolding once.

### Week 5 — Eval Harness
- Write 10–20 realistic multi-step tasks per API (see Section 8 for examples).
- Build `runEval.ts`: for each task, spin up a Claude conversation with your MCP server's tools available, let it run to completion (or a max step limit), capture the full transcript.
- Build `scoreResult.ts`: score each run on:
  - Task completion (did it achieve the goal?)
  - Tool-call efficiency (number of calls vs. ideal)
  - Error recovery (did it get stuck on a bad tool description?)
- Run the eval suite, log results, and **fix tool descriptions based on failures**. Re-run until you hit a strong success rate (aim for 85%++).

### Week 6 — Build MCP Server #3 (optional, if time allows)
- Same pattern as #2.

### Week 7 — Landing Page & Packaging
- Next.js page per MCP server: what it connects to, connection instructions, agent-readiness score, example tasks it can handle.
- A simple "how to connect" guide (MCP server URL + auth setup).
- Overall site framing: "Agent-ready APIs, tested and scored."

### Week 8 — Validation & Outreach
- Publish write-ups: "I tested how well [Tool]'s API works with AI agents — here's what broke and how I fixed it."
- Post in relevant communities (agent-framework Discords, r/LocalLLaMA, X/Twitter AI builder circles).
- Reach out directly to the 2–3 SaaS companies whose APIs you wrapped — show them the working server + eval score as a conversation starter.

---

## 7. Writing Good Tool Descriptions (the core skill)

This is the single highest-leverage part of the project. Generic converters fail here because they just copy OpenAPI's often-sparse descriptions.

**Bad (auto-generated style):**
```json
{
  "name": "post_items",
  "description": "Create a new item.",
  "inputSchema": {
    "properties": {
      "title": { "type": "string" },
      "due": { "type": "string" }
    }
  }
}
```

**Good (agent-oriented):**
```json
{
  "name": "create_task",
  "description": "Creates a new task in the user's task list. Use this when the user asks to add, create, or schedule a task or to-do item. Returns the created task's ID and a confirmation. If 'due' is provided, it must be an ISO 8601 date (e.g., '2026-06-20'), not a relative phrase like 'next Tuesday' — convert relative dates before calling this tool.",
  "inputSchema": {
    "properties": {
      "title": {
        "type": "string",
        "description": "The task's title, e.g., 'Follow up with Acme Corp about contract renewal'"
      },
      "due": {
        "type": "string",
        "description": "Due date in ISO 8601 format (YYYY-MM-DD), e.g., '2026-06-20'. Omit if no due date."
      }
    },
    "required": ["title"]
  }
}
```

Key principles: be explicit about *when* to use the tool, specify exact formats with examples, call out common mistakes (like relative dates) proactively, and describe what the tool returns.

---

## 8. Example Eval Tasks (per API)

For a CRM-like API:
1. "Find the contact named 'Jordan Lee' and add a note saying 'Sent proposal on Friday.'"
2. "Create a new contact for 'Maria Gomez' at 'Acme Inc' with email 'maria@acme.com', then create a follow-up task for next Tuesday."
3. "List all contacts created in the last 7 days and summarize them."

For a task/project tool:
1. "Create a task called 'Review Q3 budget' due next Friday, assign it to the 'Finance' project."
2. "Find all overdue tasks and mark the one about 'invoice reconciliation' as complete."
3. "Move the task 'Update website copy' from 'To Do' to 'In Progress'."

Score each on: completed (yes/no), number of tool calls used, whether any tool call failed or required a retry, and whether the agent asked for clarification it shouldn't have needed.

---

## 9. Requirements Checklist

**Technical:**
- [ ] Node.js 20+, TypeScript, pnpm/npm workspaces
- [ ] `@modelcontextprotocol/sdk` familiarity
- [ ] Anthropic API key (for eval runs — budget ~$20–50 for iterative eval runs across 2–3 APIs)
- [ ] Fly.io or Railway account for hosting MCP servers
- [ ] Vercel account for landing page
- [ ] Dev/sandbox API keys for each target API

**Skills:**
- [ ] REST API integration (auth, pagination, error handling)
- [ ] Writing clear technical descriptions (the core differentiator)
- [ ] Basic Next.js/React for the landing page
- [ ] Comfort reading agent transcripts to debug tool-use failures

**Budget estimate (8 weeks):**
- Hosting: ~$10–20/month (Fly.io/Railway free tiers often sufficient initially)
- Anthropic API usage for evals: ~$30–60 total during iteration
- Domain name: ~$10–15/year
- Total cash outlay: well under $200 for the MVP phase

---

## 10. Success Criteria for the MVP

By end of week 8, you should have:
- 2–3 live, hosted MCP servers for real APIs, each exposing 10–15 well-designed tools
- A documented eval suite with published success rates (target 85%+ on realistic multi-step tasks)
- A landing page presenting these as "agent-ready, tested" integrations
- At least one piece of public content (blog/thread) demonstrating the eval methodology and results
- Direct outreach sent to the underlying SaaS companies

This gives you a concrete portfolio, a validation signal (does anyone care/respond?), and a foundation to expand into either a directory/marketplace model or a managed "agent-readiness certification" service depending on which direction gets traction.

---

## 11. Next Steps After MVP

- If outreach to SaaS companies gets traction → pivot toward a "build and certify your MCP server" service model (B2B, recurring revenue via maintenance retainers).
- If agent-builder communities show strong interest in the directory → expand into a curated marketplace of verified MCP servers, monetized via subscription access for agent developers.
- Either path benefits from the eval harness becoming more sophisticated — this is your long-term moat.
