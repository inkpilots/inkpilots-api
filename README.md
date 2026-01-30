# @inkpilots/sdk

Official InkPilots API SDK for Node.js. A type-safe, production-ready client for the InkPilots V1 API.

## Installation

```bash
npm i @inkpilots/sdk
```

## Quick Start

```ts
import { InkPilotsClient, InkPilotsQuotaExceededError, InkPilotsApiError } from "@inkpilots/sdk";

const client = new InkPilotsClient({
  apiKey: process.env.INKPILOTS_API_KEY, // or use INKPILOTS_API_KEY env var
});

try {
  const agents = await client.fetchAgents({ limit: 10 });
  console.log(`Found ${agents.data.length} agents`);
} catch (err) {
  if (err instanceof InkPilotsQuotaExceededError) {
    console.error("API quota exceeded:", err.message);
  } else if (err instanceof InkPilotsApiError) {
    console.error("API error:", err.status, err.code, err.message);
  } else {
    console.error("Unknown error:", err);
  }
}
```

## Configuration

### Client Options

```ts
new InkPilotsClient({
  apiKey?: string;        // API key (defaults to INKPILOTS_API_KEY env var)
  baseUrl?: string;       // API base URL (defaults to https://inkpilots.com/api/v1)
  timeoutMs?: number;     // Request timeout in milliseconds (defaults to 30000)
})
```

## API Methods

### 1. Fetch Agents

List all agents with optional filtering and pagination.

```ts
const response = await client.fetchAgents({
  limit?: number;                           // 1-100, default 10
  skip?: number;                            // Pagination offset, default 0
  sortBy?: string;                          // Sort field, default "createdAt"
  sortOrder?: "asc" | "desc";              // Sort direction, default "desc"
  status?: "active" | "inactive";           // Filter by agent status
  executionMode?: "scheduled" | "batched";  // Filter by execution mode
  model?: string;                           // Filter by model
  search?: string;                          // Search query
});

// Response
{
  data: Agent[];                  // Array of agents
  pagination: {
    skip: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }
}
```

### 2. Fetch Single Agent

Get a specific agent by ID.

```ts
const response = await client.fetchAgent(agentId);

// Response
{
  agent: {
    id: string;
    workspaceId: string;
    name: string;
    description?: string;
    model: string;
    status?: "active" | "inactive";
    executionMode?: "scheduled" | "batched";
    schedule?: string;              // Cron expression
    tone?: string;
    language?: string;
    systemPrompt?: string;
    userPrompt?: string;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
  }
}
```

### 3. Fetch Articles

List all articles with optional filtering and pagination.

```ts
const response = await client.fetchArticles({
  limit?: number;                              // 1-100, default 10
  skip?: number;                               // Pagination offset, default 0
  sortBy?: string;                             // Sort field, default "createdAt"
  sortOrder?: "asc" | "desc";                 // Sort direction, default "desc"
  agentId?: string;                            // Filter by agent
  status?: "draft" | "published" | "archived"; // Filter by status
  language?: string;                           // Filter by language (e.g., "en", "tr")
  model?: string;                              // Filter by model
  tags?: string | string[];                    // Filter by tags
  search?: string;                             // Search query
  slug?: string;                               // Filter by article slug
});

// Response
{
  data: Article[];                // Array of articles
  pagination: { ... }             // Pagination metadata
}
```

### 4. Fetch Single Article

Get a specific article by ID.

```ts
const response = await client.fetchArticle(articleId);

// Response
{
  article: {
    id: string;
    workspaceId: string;
    agentId?: string;
    author?: string;
    title: string;
    slug?: string;
    description?: string;
    language?: string;
    tone?: string;
    coverImage?: string;
    blocks?: ArticleBlock[];       // Content blocks
    meta?: {
      description?: string;
      keywords?: string | string[];
      tags?: string[];
    };
    status: "draft" | "published" | "archived";
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string | null;
    createdBy?: string;
    updatedBy?: string;
  }
}
```

### 5. Fetch Agent Articles

Get articles for a specific agent with optional filtering.

```ts
const response = await client.fetchAgentArticles(agentId, {
  limit?: number;                              // 1-100, default 50
  skip?: number;                               // Pagination offset, default 0
  status?: "draft" | "published" | "archived"; // Filter by status, default "published"
  slug?: string;                               // Filter by slug
  sort?: "createdAt" | "updatedAt" | string;   // Sort field
  order?: "asc" | "desc";                      // Sort direction
});

// Response
{
  articles: Article[];            // Array of articles
  pagination: { ... }             // Pagination metadata
}
```

### 6. Fetch Workspace

Get workspace details including agents and their articles.

```ts
const response = await client.fetchWorkspace(workspaceId);

// Response
{
  workspace: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    visibility: boolean;
    header?: {
      websiteTitle?: string;
      description?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      blog?: string;
      documentation?: string;
      support?: string;
      socialAccounts?: {
        twitter?: string;
        facebook?: string;
        instagram?: string;
        linkedin?: string;
        github?: string;
        youtube?: string;
      };
    };
    createdAt: Date;
    updatedAt: Date;
  };
  agents: Array<Agent & { articles?: Article[] }>;
}
```

## Content Blocks

Articles contain structured content blocks. Each block has:

- `id`: Unique block identifier
- `type`: Block type
- `order`: Sort order

### Block Types

#### Header Block
```ts
{
  type: "header";
  level: 1 | 2 | 3 | 4;  // h1-h4
  text: string;
}
```

#### Paragraph Block
```ts
{
  type: "paragraph";
  text: string;
}
```

#### Image Block
```ts
{
  type: "image";
  url: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  prompt?: string;  // AI generation prompt
}
```

#### Video Block
```ts
{
  type: "video";
  url: string;
  caption?: string;
  provider?: "youtube" | "vimeo" | "uploaded";
}
```

#### List Block
```ts
{
  type: "list";
  ordered: boolean;
  items: string[];
}
```

#### Quote Block
```ts
{
  type: "quote";
  text: string;
  source?: string;
}
```

#### Divider Block
```ts
{
  type: "divider";
}
```

#### Code Block
```ts
{
  type: "code";
  text: string;
}
```

## Error Handling

The SDK provides two main error classes:

### InkPilotsApiError

Thrown for API errors (4xx, 5xx status codes).

```ts
try {
  await client.fetchArticles();
} catch (err) {
  if (err instanceof InkPilotsApiError) {
    console.error("Status:", err.status);      // HTTP status code
    console.error("Code:", err.code);          // Error code
    console.error("Message:", err.message);    // Human-readable message
    console.error("Request ID:", err.requestId); // For debugging
  }
}
```

### InkPilotsQuotaExceededError

Thrown when API quota is exceeded (HTTP 402).

```ts
try {
  await client.fetchArticles();
} catch (err) {
  if (err instanceof InkPilotsQuotaExceededError) {
    console.error("Quota exceeded:", err.message);
    // Handle quota exceeded scenario
  }
}
```

## Pagination

All list endpoints return pagination metadata:

```ts
{
  skip: number;           // Current offset
  limit: number;          // Items per page
  totalCount: number;     // Total items available
  totalPages: number;     // Total pages
  currentPage: number;    // Current page (1-indexed)
  hasNextPage: boolean;   // More items available
  hasPrevPage: boolean;   // Previous page exists
}
```

Usage example:
```ts
let allArticles: Article[] = [];
let page = 0;
let hasMore = true;

while (hasMore) {
  const response = await client.fetchArticles({
    skip: page * 10,
    limit: 10,
  });
  
  allArticles.push(...response.data);
  hasMore = response.pagination.hasNextPage;
  page++;
}
```

## Examples

See [examples/run.ts](./examples/run.ts) for comprehensive usage examples covering:

- Listing and filtering agents
- Listing and filtering articles
- Fetching single resources
- Error handling and edge cases
- Pagination

Run examples:
```bash
npm run build
npm run try
```

## Authentication

The SDK uses the `X-API-KEY` header with Bearer prefix for authentication:

```
X-API-KEY: Bearer <your-api-key>
```

Set your API key via:
1. Environment variable: `INKPILOTS_API_KEY`
2. Constructor option: `new InkPilotsClient({ apiKey: "..." })`

## Type Exports

All types are exported for use in your application:

```ts
import {
  InkPilotsClient,
  InkPilotsApiError,
  InkPilotsQuotaExceededError,
  type FetchAgentsOptions,
  type FetchArticlesOptions,
  type FetchAgentArticlesOptions,
  type InkPilotsClientOptions,
  type Article,
  type Agent,
  type ArticleBlock,
  type ListPagination,
  type AgentsListResponse,
  type ArticlesListResponse,
  type AgentArticlesResponse,
  type WorkspaceGetResponse,
} from "@inkpilots/sdk";
```

## License

MIT
