# Technical Specification: Agent-Ready API Layer (MCP Server + Eval Harness)

**Version:** MVP v1.0
**Stack:** TypeScript / Node.js, MCP SDK, Anthropic API

---

## 1. System Architecture Overview

The system has four main components, each independently deployable:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM OVERVIEW                             │
└────────────────────────────────────────────────────────────────────────┘

   ┌───────────────┐        ┌────────────────────┐        ┌──────────────┐
   │  AI Agent /     │  MCP   │  MCP Server(s)       │  REST  │  Target API   │
   │  Agent Framework│◄──────►│  (one per target API)│◄──────►│  (3rd party)  │
   │  (Claude, etc.) │  SSE/  │  - tools             │  HTTPS │               │
   │                 │  HTTP  │  - auth manager       │        │               │
   └───────────────┘        │  - error normalizer  │        └──────────────┘
                              │  - logger             │
                              └─────────┬────────────┘
                                         │
                                         │ (used identically by)
                                         ▼
                              ┌────────────────────┐
                              │  Eval Harness        │
                              │  - task definitions  │
                              │  - Claude runner      │
                              │  - scoring engine     │
                              └─────────┬────────────┘
                                         │
                                         ▼
                              ┌────────────────────┐
                              │  Landing Page /       │
                              │  Directory (Next.js) │
                              │  - server listings    │
                              │  - eval scores         │
                              │  - connection guides  │
                              └────────────────────┘
```

**Component responsibilities:**

| Component | Responsibility |
|---|---|
| MCP Server (per API) | Exposes a curated set of tools over MCP; handles auth, calls the target API, normalizes responses/errors |
| Eval Harness | Runs Claude against each MCP server using predefined tasks; scores success and logs failure modes |
| Landing Page / Directory | Public-facing catalog of available MCP servers, their scores, and connection instructions |
| Shared library (`@agentapi/core`) | Common types, error schema, logging setup, auth helpers reused across servers |

---

## 2. Component Architecture: MCP Server

Each MCP server follows a consistent internal layering:

```
┌──────────────────────────────────────────────────────────┐
│                     MCP Server (per API)                   │
│                                                              │
│  ┌────────────────┐                                        │
│  │ Transport Layer  │  ← MCP SDK (SSE/HTTP), handles        │
│  │                  │     session lifecycle, tool discovery │
│  └────────┬─────────┘                                        │
│           │                                                  │
│  ┌────────▼─────────┐                                        │
│  │ Tool Registry      │  ← Tool definitions (name,           │
│  │                    │     description, input schema)       │
│  └────────┬─────────┘                                        │
│           │                                                  │
│  ┌────────▼─────────┐                                        │
│  │ Tool Handlers      │  ← Business logic per tool           │
│  │ (tools/*.ts)       │     (validates input, calls client)  │
│  └────────┬─────────┘                                        │
│           │                                                  │
│  ┌────────▼─────────┐    ┌──────────────────┐               │
│  │ API Client         │◄──►│ Auth Manager       │             │
│  │ (client.ts)        │    │ (auth.ts)          │             │
│  └────────┬─────────┘    └──────────────────┘               │
│           │                                                  │
│  ┌────────▼─────────┐                                        │
│  │ Error Normalizer   │  ← Converts HTTP errors to           │
│  │ (errors.ts)        │     structured agent-readable errors │
│  └────────┬─────────┘                                        │
│           │                                                  │
│  ┌────────▼─────────┐                                        │
│  │ Logger             │  ← Structured JSON logs              │
│  │ (Pino)             │     (per tool call, latency, errors) │
│  └──────────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Integration Specification Template

Use this template for each target API integration. Fill in per-API.

```yaml
integration:
  name: "Target API Name"
  base_url: "https://api.example.com/v1"
  auth:
    type: "api_key" | "oauth2_client_credentials" | "oauth2_authorization_code"
    location: "header" | "query"
    header_name: "Authorization"        # if applicable
    token_format: "Bearer {token}"      # if applicable
  rate_limits:
    requests_per_minute: 100
    burst_handling: "exponential backoff, max 3 retries"
  pagination:
    style: "cursor" | "offset" | "page_number"
    default_page_size: 50
    max_page_size: 100
  core_objects:
    - name: "task"
      endpoints_used:
        - "GET /tasks"
        - "POST /tasks"
        - "PATCH /tasks/{id}"
        - "DELETE /tasks/{id}"
    - name: "project"
      endpoints_used:
        - "GET /projects"
        - "GET /projects/{id}"
  tools_exposed: 12   # target: 10-15
```

**Per-API checklist before building tools:**
1. Confirm sandbox/dev credentials work via a raw `curl` test.
2. Map each core object to CRUD operations actually needed (don't expose every endpoint).
3. Document rate limits and error response formats from the API's own docs.
4. Identify which fields are required vs. optional, and which need format conversion (dates, enums).

---

## 4. Tool Schema Specification

### 4.1 Standard Tool Definition Shape

Every tool follows this shape (MCP `Tool` type):

```typescript
interface ToolDefinition {
  name: string;              // snake_case, verb_noun, e.g. "create_task"
  description: string;       // LLM-oriented; see Section 4.3
  inputSchema: {
    type: "object";
    properties: Record<string, JSONSchemaProperty>;
    required: string[];
  };
}
```

### 4.2 Naming Conventions

| Pattern | Example | Use for |
|---|---|---|
| `create_<object>` | `create_task` | POST/create operations |
| `get_<object>` | `get_task` | Single-item fetch by ID |
| `list_<objects>` | `list_tasks` | Collection fetch (with filters) |
| `update_<object>` | `update_task` | PATCH/PUT operations |
| `delete_<object>` | `delete_task` | DELETE operations |
| `search_<objects>` | `search_contacts` | Full-text/filtered search |

### 4.3 Description Requirements (per tool)

Every tool description must answer, in plain language:
1. **What it does** (one sentence)
2. **When to use it** (what user intent triggers this)
3. **Format requirements** (dates, enums, ID formats) with concrete examples
4. **What it returns** (so the agent knows what to expect / extract)
5. **Common pitfalls** (e.g., "due_date must be ISO 8601, convert relative dates first")

### 4.4 Standard Error Response Schema

All tool handlers catch errors and return this normalized shape instead of raw exceptions:

```typescript
interface ToolError {
  error: true;
  code: "NOT_FOUND" | "VALIDATION_ERROR" | "RATE_LIMITED" | "AUTH_ERROR" | "UPSTREAM_ERROR";
  message: string;          // human/agent-readable explanation
  retryable: boolean;
  details?: Record<string, unknown>;  // e.g., which field failed validation
}
```

Example:
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "The field 'due_date' must be in YYYY-MM-DD format. Received: 'next Tuesday'.",
  "retryable": true,
  "details": { "field": "due_date" }
}
```

This matters because an agent can act on `retryable: true` by reformatting and retrying, but a raw `400 Bad Request` with an HTML body gives it nothing to work with.

### 4.5 Example Full Tool Definition

```json
{
  "name": "create_task",
  "description": "Creates a new task in the user's task list. Use this when the user asks to add, create, or schedule a task or to-do item. The 'due_date' field, if provided, must be in ISO 8601 format (YYYY-MM-DD), e.g. '2026-06-20' — convert relative dates like 'next Tuesday' to an absolute date before calling this tool. Returns the created task's ID, title, and due date.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "The task's title, e.g. 'Follow up with Acme Corp about contract renewal'."
      },
      "due_date": {
        "type": "string",
        "description": "Due date in YYYY-MM-DD format, e.g. '2026-06-20'. Omit if no due date."
      },
      "project_id": {
        "type": "string",
        "description": "ID of the project this task belongs to. Use 'list_projects' first if unknown."
      }
    },
    "required": ["title"]
  }
}
```

---

## 5. Data Flow

### 5.1 Standard Tool Call Flow

```
1. Agent decides to call a tool
        │
        ▼
2. MCP transport receives tool_call request
   { name: "create_task", arguments: {...} }
        │
        ▼
3. Tool handler validates input against inputSchema
        │
        ├── invalid ─► return ToolError (VALIDATION_ERROR)
        │
        ▼ valid
4. Auth Manager attaches credentials (API key / token)
        │
        ▼
5. API Client makes HTTPS request to target API
        │
        ├── 4xx/5xx ─► Error Normalizer maps to ToolError
        │
        ▼ 2xx
6. Response Mapper transforms target API's response
   into a concise, agent-friendly shape
        │
        ▼
7. Logger records: tool name, latency, status, (truncated) payload
        │
        ▼
8. MCP transport returns result to Agent
```

### 5.2 Response Mapping Principle

Target APIs often return large, deeply nested objects with fields irrelevant to agents (internal IDs, metadata, links). The **Response Mapper** trims this to what an agent needs:

```typescript
// Raw API response (simplified)
{
  "id": "tsk_8f3a...",
  "attributes": { "title": "...", "due_on": "2026-06-20T00:00:00Z", ... },
  "relationships": { "project": { "data": { "id": "proj_..." } } },
  "links": { "self": "..." },
  "meta": { "created_by": "...", "internal_flags": [...] }
}

// Mapped tool response
{
  "id": "tsk_8f3a...",
  "title": "...",
  "due_date": "2026-06-20",
  "project_id": "proj_..."
}
```

---

## 6. User Flows

### 6.1 Flow A — Agent Developer Discovers & Connects (Primary user flow)

```
1. Developer visits landing page / directory
2. Browses available MCP servers, filters by category, views eval scores
3. Clicks "Connect" on a server → sees:
     - MCP server URL (e.g., https://mcp.yourdomain.com/tool-a)
     - Auth setup instructions (where to get API key, how to pass it)
     - Example tasks the server handles well (from eval results)
4. Developer adds server URL + credentials to their agent's MCP config
5. Developer's agent can now call tools against the target API
```

### 6.2 Flow B — End User Task Execution (via agent)

```
1. End user gives agent a natural-language instruction
   e.g., "Create a task to review the Q3 budget, due next Friday"
2. Agent (via Claude) determines it needs the "create_task" tool
3. Agent converts "next Friday" → "2026-06-19" (per tool description)
4. Agent calls create_task({ title: "...", due_date: "2026-06-19" })
5. MCP server processes (see Section 5.1), returns result
6. Agent confirms to user: "Created task 'Review Q3 budget', due June 19"
```

### 6.3 Flow C — Eval & Iteration Loop (internal, ongoing)

```
1. Define/update task list (eval-harness/tasks/*.json)
2. Run eval harness: Claude attempts each task against the MCP server
3. Harness logs: success/fail, tool calls made, errors encountered
4. Review failures:
     - Tool description ambiguous? → rewrite description
     - Schema too permissive? → tighten validation
     - Error message unhelpful? → improve Error Normalizer mapping
5. Redeploy MCP server, re-run eval
6. Repeat until success rate target (≥85%) is met
7. Publish score to landing page
```

### 6.4 Flow D — Onboarding a New Target API (repeatable build process)

```
1. Select API per Section 3 criteria
2. Fill in Integration Specification template (Section 3)
3. Scaffold new package: packages/mcp-server-<name>
4. Implement client.ts, auth.ts (reusing @agentapi/core helpers)
5. Implement 10-15 tools per Section 4 conventions
6. Write eval-harness/tasks/<name>-tasks.json (10-20 tasks)
7. Run Flow C until target success rate reached
8. Add listing to landing page directory
9. Deploy MCP server (Section 8)
```

---

## 7. Eval Harness — Technical Design

### 7.1 Task Definition Schema

```json
{
  "task_id": "crm-001",
  "description": "Find the contact named 'Jordan Lee' and add a note saying 'Sent proposal on Friday.'",
  "target_server": "mcp-server-crm",
  "max_steps": 6,
  "success_criteria": {
    "type": "tool_call_sequence_or_outcome",
    "expected_tools_used": ["search_contacts", "add_note"],
    "verification": "Query the API afterward to confirm the note was added to the correct contact."
  }
}
```

### 7.2 Eval Run Flow

```
For each task:
  1. Start a fresh Claude conversation with the target MCP server's
     tools registered (via Anthropic API + mcp_servers config)
  2. Send task.description as the user message
  3. Allow Claude to call tools in a loop (up to max_steps)
  4. Capture full transcript (messages + tool calls + tool results)
  5. Run success_criteria.verification (a follow-up API call,
     e.g., GET the contact and check the note exists)
  6. Record:
       - success: boolean
       - steps_used: number
       - errors_encountered: ToolError[]
       - transcript: full log (for manual review of failures)
```

### 7.3 Scoring Output Schema

```json
{
  "server": "mcp-server-crm",
  "run_date": "2026-06-13",
  "total_tasks": 15,
  "passed": 13,
  "success_rate": 0.867,
  "avg_steps_used": 3.2,
  "common_failure_modes": [
    { "task_id": "crm-007", "issue": "Agent used wrong date format for 'next Tuesday'" }
  ]
}
```

This output feeds directly into the landing page's "agent-readiness score" display.

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Fly.io / Railway                                              │
│                                                                 │
│   ┌────────────────────┐   ┌────────────────────┐            │
│   │ mcp-server-toolA     │   │ mcp-server-toolB     │            │
│   │ (Docker container)   │   │ (Docker container)   │            │
│   │ - Node 20             │   │ - Node 20             │            │
│   │ - exposes :8080/sse   │   │ - exposes :8080/sse   │            │
│   └────────────────────┘   └────────────────────┘            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Vercel                                                         │
│   ┌────────────────────┐                                       │
│   │ landing-page (Next.js)│                                      │
│   │ - server directory     │                                      │
│   │ - eval scores (static  │                                      │
│   │   JSON, regenerated     │                                      │
│   │   on each eval run)     │                                      │
│   └────────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Local / CI (eval runs)                                         │
│   ┌────────────────────┐                                       │
│   │ eval-harness          │ → calls deployed MCP servers       │
│   │ → calls Anthropic API │ → outputs scoring JSON              │
│   └────────────────────┘    → committed to landing-page repo   │
└─────────────────────────────────────────────────────────────┘
```

**Environment variables (per MCP server):**

```
TARGET_API_BASE_URL=https://api.example.com/v1
TARGET_API_AUTH_TYPE=api_key
TARGET_API_KEY=<injected via host secrets>
LOG_LEVEL=info
PORT=8080
```

---

## 9. Security Considerations (MVP scope)

- **Credential handling:** API keys for target services stored as host-level secrets (Fly.io secrets / Railway env vars), never committed to the repo.
- **Per-user auth (future):** MVP can use a single shared dev credential per target API for demo/eval purposes. A production version would need per-user OAuth tokens passed via MCP session context — flagged as a v2 concern, not MVP-blocking.
- **Rate limiting:** Each MCP server should implement basic backoff/retry against the target API to avoid getting the shared dev credential rate-limited or banned.
- **Logging hygiene:** Logs should truncate/redact sensitive fields (emails, tokens) — log tool names, status codes, and latencies, not full payloads, in production.

---

## 10. Shared Library (`@agentapi/core`)

To avoid duplicating code across MCP servers, extract common pieces into a shared internal package:

```typescript
// @agentapi/core exports:
export { ToolError, ToolErrorCode } from "./errors";
export { createLogger } from "./logger";
export { withRetry } from "./retry";       // exponential backoff wrapper
export { normalizeHttpError } from "./httpErrors";
export type { ToolDefinition, JSONSchemaProperty } from "./types";
```

Each `mcp-server-*` package depends on `@agentapi/core` for consistent error shapes, logging format, and retry behavior — this consistency is itself part of the "agent-ready" quality story.

---

## 11. Summary of Key Design Principles

1. **Curated over comprehensive** — 10-15 well-designed tools beat 100 auto-generated ones.
2. **LLM-first descriptions** — every tool description is written and tested for an LLM reader, not a human developer.
3. **Structured errors everywhere** — agents need machine-readable, actionable error responses.
4. **Eval-driven iteration** — tool quality is measured empirically, not assumed.
5. **Consistency via shared core** — every server behaves the same way for errors, logging, and retries, which becomes the basis for a trust/quality signal.
