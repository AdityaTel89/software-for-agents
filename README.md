# AgentReady: The Agent-Ready API Layer for LLMs

[![CI Status](https://github.com/AdityaTel89/software-for-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/AdityaTel89/software-for-agents/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/package%20manager-pnpm-orange.svg)](https://pnpm.io)

> *“We don’t just auto-generate MCP servers from OpenAPI specs — we test them in feedback loops with real AI agents until they actually work, and prove it with an empirical eval score.”*

---

## 💡 The Problem

Most APIs in existence today were designed and documented for **human developers**, not for AI agents. When you connect an LLM-driven agent to a generic or auto-generated Model Context Protocol (MCP) server, it frequently fails due to:

1. **Terse, Sparse Descriptions**: Auto-generated tools often lack detail (e.g., exposing a field `due` instead of describing it as `"due date in absolute ISO 8601 format (YYYY-MM-DD), convert relative phrases like 'next Friday' before calling"`).
2. **Unstructured Prose/HTML Errors**: A raw `400 Bad Request` or an HTML error page gives the agent nothing actionable to resolve the issue or self-correct.
3. **Response Overhead**: Returning massive, deeply nested payloads that waste context window tokens and confuse the LLM's reasoning engine.

## 🚀 Our Solution: AgentReady

**AgentReady** bridges this gap by building **hand-tuned, agent-tested, and scored MCP servers** for popular APIs. Every server is verified using an automated **Evaluation Harness** that runs Claude inside a mock sandbox, executes a series of multi-step tasks, and programmatically asserts the outcome.

### Core Design Principles

* **Curated over Comprehensive**: Expose 10–15 highly optimized tools that satisfy 90% of real-world workflows rather than 100+ auto-generated ones.
* **LLM-Oriented Tooling**: Every description explicitly defines *what* it does, *when* to use it, *exact format requirements* with examples, *expected return shapes*, and *common pitfalls*.
* **Actionable Normalized Errors**: Catch and transform raw HTTP errors into a structured `ToolError` object containing a `retryable` boolean, giving the agent a blueprint to fix issues dynamically.
* **Response Mapping**: Flatten and trim API payloads to return only essential fields, conserving token budgets.

---

## 📂 Repository Structure

This codebase is managed as a `pnpm` monorepo:

```
software-for-agents/
├── packages/
│   ├── core/                    # Shared core library (@agentapi/core)
│   │                            # Common types, logging (Pino), retry helpers, error normalizers
│   ├── mcp-server-notion/       # Curated Notion MCP server (Express SSE server)
│   ├── mcp-server-freshsales/   # Curated Freshsales CRM MCP server (In Progress)
│   └── eval-harness/            # Evaluation runner & verification engine
│       ├── tasks/               # JSON task definitions with dynamic env interpolation
│       ├── src/runEval.ts       # Anthropic SDK Messages loop + MCP SSE connection
│       ├── src/verify.ts        # Direct-API state checkers with sandbox cleanup
│       └── src/scoreResult.ts   # Evaluator and statistics aggregator
├── docs/                        # Specifications, Roadmaps, and PRDs
└── package.json                 # Monorepo scripts
```

---

## ⚡ Quick Start

### Prerequisites

* [Node.js](https://nodejs.org) >= 20.0.0
* [pnpm](https://pnpm.io) package manager
* Active developer keys for **Notion** (if testing Notion integration) and **Anthropic** (for evaluation runner)

### Installation & Build

1. Clone this repository and install dependencies:
   ```bash
   pnpm install
   ```

2. Compile the TypeScript packages:
   ```bash
   pnpm run typecheck
   ```

3. Run the unit test suite:
   ```bash
   pnpm run test
   ```

---

## 🧪 Running the Evaluation Harness

The `eval-harness` package spins up a fresh conversation loop via the Anthropic Claude API, registers the MCP server's tools, and attempts to execute the tasks in a sandbox.

### Setup Environment Variables

Copy the `.env.example` file to `.env` at the root and fill in your keys:

```bash
# API Credentials
ANTHROPIC_API_KEY="your-anthropic-key"
NOTION_API_KEY="your-notion-internal-integration-token"

# Notion Sandbox IDs (Required for verifiers)
NOTION_TEST_DATABASE_ID="your-sandbox-database-id"
NOTION_TEST_PAGE_ID="your-sandbox-parent-page-id"
```

### Execution Steps

1. **Start the MCP Server** (in a separate terminal):
   ```bash
   pnpm --filter mcp-server-notion start
   ```

2. **Run the Evals**:
   ```bash
   pnpm run eval --server=notion
   ```

This will run all 10 Notion test cases (e.g. page creation, paragraph block append, subpage creation, database query) and output:
* A formatted **Evaluation Summary** directly in your terminal detailing success rate and average steps.
* A scoring report at `packages/eval-harness/results/notion.json`.
* Detailed transcripts and execution histories at `packages/eval-harness/results/notion-details.json`.

---

## 🤝 Verification & Validation

We maintain a strict quality bar. Before submitting pull requests, ensure that:

```bash
# 1. Formatting is clean
pnpm run format

# 2. ESLint checks pass with no warnings or errors
pnpm run lint

# 3. TypeScript compilation & references compile cleanly
pnpm run typecheck

# 4. All unit tests pass
pnpm run test
```

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
