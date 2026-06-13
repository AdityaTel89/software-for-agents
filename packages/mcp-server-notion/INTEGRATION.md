# Notion Integration Specification

Detailed integration specification for the Notion MCP Server.

## 1. API Profile

- **Base URL:** `https://api.notion.com/v1`
- **Auth Type:** API Key / Internal Integration Secret
- **Auth Location:** Header
- **Required Headers:**
  - `Authorization: Bearer {TARGET_API_KEY}`
  - `Notion-Version: 2022-06-28`
  - `Content-Type: application/json`
- **Rate Limits:** 
  - Notion enforces a rate limit of approximately **3 requests per second**.
  - Returns `429 Too Many Requests` on breach.
  - Backoff strategy: exponential backoff retries managed by core wrapper `withRetry`.
- **Pagination Style:** Cursor-based.
  - Request properties: `start_cursor` (string), `page_size` (number, default 50, max 100).
  - Response properties: `next_cursor` (string/null), `has_more` (boolean), `results` (array).

## 2. Core Objects

### 2.1 Page
- **Description:** A document containing properties and a hierarchy of block contents.
- **Endpoints:**
  - `GET /v1/pages/{page_id}` (Retrieve a page)
  - `POST /v1/pages` (Create a page)
  - `PATCH /v1/pages/{page_id}` (Update page properties)

### 2.2 Block
- **Description:** The structural unit of content in Notion (e.g., text paragraphs, lists, images, headings).
- **Endpoints:**
  - `GET /v1/blocks/{block_id}/children` (Retrieve block children)
  - `PATCH /v1/blocks/{block_id}/children` (Append block children)

### 2.3 Database
- **Description:** A schema-defined collection of Notion pages.
- **Endpoints:**
  - `GET /v1/databases/{database_id}` (Retrieve a database)
  - `POST /v1/databases/{database_id}/query` (Query a database with filters)

### 2.4 Search
- **Description:** Full-text search across all pages and databases shared with the integration.
- **Endpoints:**
  - `POST /v1/search` (Search pages and databases by title)

## 3. Exposed Tools

### 3.1 `search`
- **Description:** Search all pages and databases shared with the integration. Returns a list of pages and databases matching the title query.
- **Endpoints:** `POST /v1/search`
- **Input Parameters:**
  - `query` (string, optional): The search term.
  - `filter` (object, optional): `{ value: "page" | "database", property: "object" }`
  - `page_size` (integer, optional, default 50)
  - `start_cursor` (string, optional)

### 3.2 `get_page`
- **Description:** Retrieve a single Notion page metadata and property details by page ID. Note that this does *not* retrieve block contents (use `get_block_children` for block content).
- **Endpoints:** `GET /v1/pages/{page_id}`
- **Input Parameters:**
  - `page_id` (string, required): The UUID of the Notion page.

### 3.3 `create_page`
- **Description:** Creates a new page. Can be created under a parent page or inside a database. Required to define properties if creating inside a database.
- **Endpoints:** `POST /v1/pages`
- **Input Parameters:**
  - `parent` (object, required): `{ database_id: string }` OR `{ page_id: string }`
  - `properties` (object, required for database parent): Notion property values.
  - `children` (array of objects, optional): Block content to insert into the page.

### 3.4 `update_page_properties`
- **Description:** Updates specific property values of a page by ID (e.g. changing status, select fields, dates, text).
- **Endpoints:** `PATCH /v1/pages/{page_id}`
- **Input Parameters:**
  - `page_id` (string, required)
  - `properties` (object, required): Property values to update.

### 3.5 `get_block_children`
- **Description:** Retrieve the list of child blocks (content elements) belonging to a parent block or page by ID. Essential for reading document content.
- **Endpoints:** `GET /v1/blocks/{block_id}/children`
- **Input Parameters:**
  - `block_id` (string, required): Page ID or block ID.
  - `page_size` (integer, optional, default 100)
  - `start_cursor` (string, optional)

### 3.6 `append_block_children`
- **Description:** Append new block content elements (paragraphs, headings, lists, etc.) to a parent block or page.
- **Endpoints:** `PATCH /v1/blocks/{block_id}/children`
- **Input Parameters:**
  - `block_id` (string, required)
  - `children` (array of objects, required): List of block objects to append.

### 3.7 `get_database`
- **Description:** Retrieve schema details, title, and properties definition of a database by ID.
- **Endpoints:** `GET /v1/databases/{database_id}`
- **Input Parameters:**
  - `database_id` (string, required)

### 3.8 `query_database`
- **Description:** Filter and query pages within a database by database ID. Supports filters on property values.
- **Endpoints:** `POST /v1/databases/{database_id}/query`
- **Input Parameters:**
  - `database_id` (string, required)
  - `filter` (object, optional): Query filter object matching Notion's query schema.
  - `sorts` (array, optional): Sort criteria.
  - `page_size` (integer, optional, default 50)
  - `start_cursor` (string, optional)
