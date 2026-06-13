# Freshsales Integration Specification

Detailed integration specification for the Freshsales CRM MCP Server.

## 1. API Profile

- **Base URL:** `https://{domain}.freshsales.io/api`
- **Auth Type:** API Key
- **Auth Location:** Header
- **Required Headers:**
  - `Authorization: Token token={TARGET_API_KEY}`
  - `Content-Type: application/json`
- **Rate Limits:**
  - Default limits are tier-dependent, typically starting at **100 requests per minute**.
  - Returns `429 Too Many Requests` when limit is exceeded.
  - Backoff strategy: exponential backoff retries managed by core wrapper `withRetry`.
- **Pagination Style:** Page-based.
  - Request properties: `page` (integer, 1-indexed), `per_page` (integer, default 25, max 250).
  - Response properties: The object list is wrapped under its collection name key (e.g., `contacts`, `deals`) and may include a metadata object with pagination details.

## 2. Core Objects

### 2.1 Contact
- **Description:** Represents individuals with whom the business communicates.
- **Endpoints:**
  - `POST /contacts` (Create a contact)
  - `GET /contacts/{id}` (Retrieve a contact)
  - `GET /contacts/view/{view_id}` or `GET /contacts` (List/filter contacts)
  - `PUT /contacts/{id}` (Update a contact)
  - `DELETE /contacts/{id}` (Delete a contact)

### 2.2 Sales Account
- **Description:** Represents companies/organizations that contacts belong to.
- **Endpoints:**
  - `POST /sales_accounts` (Create an account)
  - `GET /sales_accounts/{id}` (Retrieve an account)
  - `GET /sales_accounts` (List/filter accounts)
  - `PUT /sales_accounts/{id}` (Update an account)

### 2.3 Deal
- **Description:** Represents sales opportunities or transactions in progress.
- **Endpoints:**
  - `POST /deals` (Create a deal)
  - `GET /deals/{id}` (Retrieve a deal)
  - `GET /deals` (List/filter deals)
  - `PUT /deals/{id}` (Update a deal)

### 2.4 Lead
- **Description:** Represents potential sales contacts before qualification.
- **Endpoints:**
  - `POST /leads` (Create a lead)
  - `GET /leads/{id}` (Retrieve a lead)
  - `GET /leads` (List/filter leads)

## 3. Exposed Tools

### 3.1 `create_contact`
- **Description:** Create a new CRM contact. Returns the created contact object details including ID.
- **Endpoints:** `POST /contacts`
- **Input Parameters:**
  - `first_name` (string, optional)
  - `last_name` (string, required)
  - `email` (string, optional)
  - `mobile_number` (string, optional)
  - `sales_account_id` (string, optional): ID of the account this contact belongs to.

### 3.2 `get_contact`
- **Description:** Retrieve details of a single contact by ID.
- **Endpoints:** `GET /contacts/{id}`
- **Input Parameters:**
  - `id` (string, required)

### 3.3 `list_contacts`
- **Description:** List CRM contacts with pagination. Supports basic filtering by view or search.
- **Endpoints:** `GET /contacts`
- **Input Parameters:**
  - `page` (integer, optional, default 1)
  - `per_page` (integer, optional, default 25)

### 3.4 `update_contact`
- **Description:** Update properties of an existing contact by ID.
- **Endpoints:** `PUT /contacts/{id}`
- **Input Parameters:**
  - `id` (string, required)
  - `first_name` (string, optional)
  - `last_name` (string, optional)
  - `email` (string, optional)
  - `mobile_number` (string, optional)
  - `sales_account_id` (string, optional)

### 3.5 `delete_contact`
- **Description:** Delete a contact by ID.
- **Endpoints:** `DELETE /contacts/{id}`
- **Input Parameters:**
  - `id` (string, required)

### 3.6 `create_account`
- **Description:** Create a new sales account (company profile).
- **Endpoints:** `POST /sales_accounts`
- **Input Parameters:**
  - `name` (string, required): Company name.
  - `website` (string, optional)
  - `phone` (string, optional)

### 3.7 `get_account`
- **Description:** Retrieve details of a single sales account by ID.
- **Endpoints:** `GET /sales_accounts/{id}`
- **Input Parameters:**
  - `id` (string, required)

### 3.8 `list_accounts`
- **Description:** List sales accounts with pagination.
- **Endpoints:** `GET /sales_accounts`
- **Input Parameters:**
  - `page` (integer, optional, default 1)
  - `per_page` (integer, optional, default 25)

### 3.9 `update_account`
- **Description:** Update properties of an existing account by ID.
- **Endpoints:** `PUT /sales_accounts/{id}`
- **Input Parameters:**
  - `id` (string, required)
  - `name` (string, optional)
  - `website` (string, optional)
  - `phone` (string, optional)

### 3.10 `create_deal`
- **Description:** Create a new deal/opportunity.
- **Endpoints:** `POST /deals`
- **Input Parameters:**
  - `name` (string, required): Deal name.
  - `amount` (number, optional): Deal value.
  - `deal_stage_id` (string, optional): Stage ID of the deal (e.g. New, Contacted, In Progress).
  - `sales_account_id` (string, optional)

### 3.11 `get_deal`
- **Description:** Retrieve details of a single deal by ID.
- **Endpoints:** `GET /deals/{id}`
- **Input Parameters:**
  - `id` (string, required)

### 3.12 `list_deals`
- **Description:** List sales deals with pagination.
- **Endpoints:** `GET /deals`
- **Input Parameters:**
  - `page` (integer, optional, default 1)
  - `per_page` (integer, optional, default 25)

### 3.13 `update_deal`
- **Description:** Update properties of an existing deal by ID.
- **Endpoints:** `PUT /deals/{id}`
- **Input Parameters:**
  - `id` (string, required)
  - `name` (string, optional)
  - `amount` (number, optional)
  - `deal_stage_id` (string, optional)

### 3.14 `create_lead`
- **Description:** Create a new unqualified lead.
- **Endpoints:** `POST /leads`
- **Input Parameters:**
  - `first_name` (string, optional)
  - `last_name` (string, required)
  - `email` (string, optional)
  - `company_name` (string, optional)

### 3.15 `get_lead`
- **Description:** Retrieve details of a single lead by ID.
- **Endpoints:** `GET /leads/{id}`
- **Input Parameters:**
  - `id` (string, required)
