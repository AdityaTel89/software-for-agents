// Scores are loaded dynamically at runtime from /api/scores — no static imports needed.

export interface ToolInfo {
  name: string;
  description: string;
}

export interface ServerInfo {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: "verified" | "staging" | "alpha";
  successRate: number;
  totalTasks: number;
  avgSteps: number;
  sseUrl: string;
  authEnvVar: string;
  authDocUrl: string;
  sampleConfig: string;
  tools: ToolInfo[];
  exampleTasks: string[];
}

export const servers: ServerInfo[] = [
  {
    slug: "notion",
    name: "Notion MCP Server",
    tagline: "Productivity & Knowledge Base Integration",
    category: "Productivity",
    status: "verified",
    successRate: 33,   // fallback — overridden at runtime by /api/scores
    totalTasks: 3,     // fallback
    avgSteps: 3.2,
    sseUrl: "https://software-for-agents.onrender.com/sse",
    authEnvVar: "NOTION_API_KEY",
    authDocUrl: "https://www.notion.so/my-integrations",
    sampleConfig: `{
  "mcpServers": {
    "notion": {
      "transport": {
        "type": "sse",
        "url": "https://software-for-agents.onrender.com/sse"
      }
    }
  }
}`,
    tools: [
      { name: "search", description: "Search pages and databases by title or properties" },
      { name: "get_page", description: "Retrieve metadata and block content of a specific page" },
      { name: "create_page", description: "Create a new page inside a parent database or page" },
      { name: "update_page_properties", description: "Update properties (status, tags, relations) of a page" },
      { name: "get_block_children", description: "Retrieve children blocks of a page or layout block" },
      { name: "append_block_children", description: "Add paragraph, heading, list, or todo blocks to a page" },
      { name: "get_database", description: "Retrieve database schema and structure" },
      { name: "query_database", description: "Filter and sort database rows by properties" }
    ],
    exampleTasks: [
      "Find the page titled 'Product Backlog' and summarize its top-level tasks.",
      "Create a sub-page named 'Meeting Notes' under the current project page.",
      "Query the Bug Tracker database for all open bugs with critical priority.",
      "Update the 'Launch Date' property of the 'V1 Release' page to next Friday."
    ]
  },
  {
    slug: "freshsales",
    name: "Freshsales CRM Server",
    tagline: "Customer Relationship Management & Pipeline Tracking",
    category: "CRM",
    status: "staging",
    successRate: 92,   // fallback — overridden at runtime by /api/scores
    totalTasks: 12,   // fallback
    avgSteps: 4.1,
    sseUrl: "https://freshsales-mcp.agentready.dev/sse",
    authEnvVar: "FRESHSALES_API_KEY",
    authDocUrl: "https://developer.freshsales.io/api/",
    sampleConfig: `{
  "mcpServers": {
    "freshsales": {
      "transport": {
        "type": "sse",
        "url": "https://freshsales-mcp.agentready.dev/sse"
      }
    }
  }
}`,
    tools: [
      { name: "list_accounts", description: "Retrieve sales accounts with pagination" },
      { name: "get_account", description: "Get detailed information about a specific account" },
      { name: "create_account", description: "Create a new sales account for a company" },
      { name: "update_account", description: "Update details of an existing sales account" },
      { name: "list_contacts", description: "List contacts / leads associated with accounts" },
      { name: "get_contact", description: "Get complete details about a specific contact" },
      { name: "create_contact", description: "Create a new customer contact in CRM" },
      { name: "update_contact", description: "Update properties or stage of a contact" },
      { name: "delete_contact", description: "Delete a contact from CRM database" },
      { name: "list_deals", description: "Retrieve CRM sales deals and pipelines" },
      { name: "get_deal", description: "Get specific deal information" },
      { name: "create_deal", description: "Create a new sales deal / opportunity" },
      { name: "update_deal", description: "Update deal amount, close date, or pipeline stage" }
    ],
    exampleTasks: [
      "Find the contact 'Jane Doe' and update her phone number.",
      "Create a new deal of $15,000 named 'Q3 Expansion' for Acme Corp.",
      "List all accounts created in the last 30 days.",
      "Move deal 'Enterprise Pilot' to the Closed-Won stage."
    ]
  }
];

export const blogPosts = [
  {
    slug: "notion-iteration",
    title: "Iterating Notion MCP Server from 0% to 100% Success Rate",
    summary: "A deep dive into how we established an evaluation harness, diagnosed LLM failures, and iterated tool descriptions and validation schemas to achieve perfect tool calling reliability.",
    date: "June 14, 2026",
    readTime: "6 min read",
    content: `### The Challenge

When we first built our Notion MCP server, we ran it through a series of multi-step autonomous tasks (e.g., search for page → find children blocks → update page status). Our initial evaluation score was **0%**. 

The agent kept getting stuck, calling the wrong tools, or failing on type mismatches. 

Here is how we established our evaluation loop, diagnosed the core failure modes, and iterated our way to **100% success rate** in mock environments.

---

### Failure Classification & Diagnostics

By reading the evaluation transcripts, we categorized the failures into three distinct classes:

#### 1. Ambiguous Tool Descriptions (The "Guessing" Problem)
* **Problem**: The agent had to choose between \`create_page\` and \`append_block_children\`. When asked to "write a subpage under X," the agent called \`append_block_children\` with block contents instead of creating a page object, or vice-versa.
* **Resolution**: We rewrote tool descriptions to follow a strict 5-point requirement: what it does, when to use it, formatting expectations, what it returns, and common pitfalls. For example, we explicitly added to \`create_page\`: *"Use this tool ONLY to create new pages/database rows. If you want to insert content inside an existing page, use append_block_children instead."*

#### 2. Zod Schema Mismatches
* **Problem**: Notion API expects page parent IDs to have a specific type union (either \`database_id\` or \`page_id\`). The generic tool schema accepted a raw string, but the API returned a 400 Bad Request because the agent passed it under the wrong key.
* **Resolution**: We updated the Zod schema to validate parent shapes and mapped the input schema dynamically to handle union objects, rejecting invalid parent references before reaching the Notion API.

#### 3. Unhelpful Errors (No Self-Correction)
* **Problem**: When a request failed, the server returned raw HTTP 400 structures or uncaught exceptions. The LLM agent received a cryptic JSON string and would loop infinitely or crash.
* **Resolution**: We implemented a structured error normalizer (\`normalizeHttpError\` in \`@agentapi/core\`). When a tool fails, it returns a readable explanation: *"Error: Parents of type page must use parent_id. You passed a database ID instead. Convert the ID or use the database parent type."* This allowed the agent to self-correct in the next step!

---

### Before/After Descriptions Impact

| Tool | Before (Standard Spec) | After (AgentReady Optimized) | Result |
|---|---|---|---|
| \`create_page\` | "Creates a page in a database or parent page." | "Create a new page/database row. Must specify parent type (page_id vs database_id). Pitfall: do not write blocks here." | **Success** (Agent correctly nests pages) |
| \`get_page\` | "Returns page properties." | "Retrieve page metadata. To read the page content/text, you must call get_block_children with the page ID." | **Success** (Agent no longer assumes get_page returns text) |

---

### Conclusion

Autonomously executing tasks requires a different kind of integration. By treating tool-calling as a software interface that needs its own evals, schemas, and readable compiler errors, we can make any REST API completely **AgentReady**.`
  },
  {
    slug: "freshsales-iteration",
    title: "Tuning Freshsales CRM MCP Server to 92% Task Success",
    summary: "How we resolved multi-step pipeline errors and contact schema validation issues when connecting Claude Code to our Freshsales CRM server.",
    date: "June 15, 2026",
    readTime: "5 min read",
    content: `### The Challenge

Integrating CRM tools with agents is notoriously hard due to complex record schemas (Contacts, Accounts, Deals) and strict association rules. Initially, when evaluated, the agent failed to link newly created Deals with custom Accounts, resulting in a low success rate of **15%**.

Here's how we tuned the Freshsales server to reach a **92%** verified success rate.

---

### Key Iterations

#### 1. Entity Association Tool Guidance
* **Problem**: When asked to "create a deal for Acme Corp," the agent tried to call \`create_deal\` with a raw string for the account name, which failed.
* **Resolution**: We added explicit descriptions to \`create_deal\`: *"You must first search/list accounts to retrieve the account_id. Pass the account_id under the parent_id block."* This forced a correct multi-step execution.

#### 2. Optional Fields Normalization
* **Problem**: Freshsales API expects contact payloads to have nested custom fields under a specific block. The agent was passing them flat.
* **Resolution**: We updated the Zod schema in \`createContact.ts\` to enforce the correct nesting structure and normalize flat inputs dynamically in the handler.

---

### Conclusion

By providing semantic boundary hints and schema normalizers, we transformed a rigid CRM REST API into an intuitive interface for agentic workflows.`
  }
];
