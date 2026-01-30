// src/client.ts
import {
	InkPilotsApiError,
	InkPilotsQuotaExceededError,
	type InkPilotsErrorCode,
} from "./errors";
import type {
	AgentArticlesResponse,
	AgentsListResponse,
	AgentGetResponse,
	ArticlesListResponse,
	ArticleGetResponse,
	WorkspaceGetResponse,
} from "./types";

export type InkPilotsClientOptions = {
	apiKey?: string; // defaults to process.env.INKPILOTS_API_KEY
	baseUrl?: string; // defaults to https://www.inkpilots.com/api/v1
	timeoutMs?: number; // default 30s
};

export type FetchAgentsOptions = {
	limit?: number; // default 10
	skip?: number; // default 0
	sortBy?: string; // default createdAt
	sortOrder?: "asc" | "desc"; // default desc
	status?: "active" | "inactive";
	executionMode?: "scheduled" | "batched";
	model?: string;
	search?: string;
};

export type FetchArticlesOptions = {
	limit?: number; // default 10
	skip?: number; // default 0
	sortBy?: string; // default createdAt
	sortOrder?: "asc" | "desc"; // default desc
	agentId?: string;
	status?: "draft" | "published" | "archived";
	language?: string;
	model?: string;
	tags?: string | string[]; // comma-separated when sent
	search?: string;
  slug?: string; // article slug to filter by
};

export type FetchAgentArticlesOptions = {
	limit?: number; // default 50
	skip?: number; // default 0
	status?: "draft" | "published" | "archived"; // default "published"
	slug?: string; // optional article slug to filter by
	sort?: "createdAt" | "updatedAt" | string; // API expects `sort`
	order?: "asc" | "desc"; // API expects `order`
	/** @deprecated Use `sort` instead */
	sortBy?: "createdAt" | "updatedAt" | string;
	/** @deprecated Use `order` instead */
	sortOrder?: "asc" | "desc";
};

type RequestOptions = {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	path: string;
	query?: Record<string, string | number | boolean | undefined>;
	body?: unknown;
};

export class InkPilotsClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly timeoutMs: number;

	constructor(opts: InkPilotsClientOptions = {}) {
		const key = opts.apiKey ?? process.env.INKPILOTS_API_KEY;
		if (!key) {
			throw new Error(
				"Missing INKPILOTS_API_KEY (or pass { apiKey } to InkPilotsClient)."
			);
		}

		this.apiKey = key;
		this.baseUrl = (opts.baseUrl ?? "https://www.inkpilots.com/api/v1").replace(
			/\/+$/,
			""
		);
		this.timeoutMs = opts.timeoutMs ?? 30_000;
	}

	/**
	 * GET /agents?skip=&limit=&status=
	 */
	async fetchAgents(
		options: FetchAgentsOptions = {}
	): Promise<AgentsListResponse> {
		const limit = clampLimit(options.limit, 10);
		const skip = normalizeSkip(options.skip);
		const sortBy = options.sortBy ?? "createdAt";
		const sortOrder = options.sortOrder ?? "desc";

		return this.request<AgentsListResponse>({
			method: "GET",
			path: "/agents",
			query: {
				limit,
				skip,
				sortBy,
				sortOrder,
				status: options.status,
				executionMode: options.executionMode,
				model: options.model,
				search: options.search,
			},
		});
	}

	/**
	 * GET /agents/:agentId
	 */
	async fetchAgent(agentId: string): Promise<AgentGetResponse> {
		return this.request<AgentGetResponse>({
			method: "GET",
			path: `/agents/${encodeURIComponent(agentId)}`,
		});
	}

	/**
	 * GET /articles?skip=&limit=&status=
	 */
	async fetchArticles(
		options: FetchArticlesOptions = {}
	): Promise<ArticlesListResponse> {
		const limit = clampLimit(options.limit, 10);
		const skip = normalizeSkip(options.skip);
		const sortBy = options.sortBy ?? "createdAt";
		const sortOrder = options.sortOrder ?? "desc";
		const tags = formatTags(options.tags);

		return this.request<ArticlesListResponse>({
			method: "GET",
			path: "/articles",
			query: {
				limit,
				skip,
				sortBy,
				sortOrder,
				agentId: options.agentId,
				status: options.status,
				language: options.language,
				model: options.model,
				tags,
				search: options.search,
        slug: options.slug, // support slug search via `search` param
			},
		});
	}

	/**
	 * GET /articles/:articleId
	 */
	async fetchArticle(articleId: string): Promise<ArticleGetResponse> {
		return this.request<ArticleGetResponse>({
			method: "GET",
			path: `/articles/${encodeURIComponent(articleId)}`,
		});
	}

	/**
	 * GET /agents/:agentId/articles?limit=&skip=&status=
	 */
	async fetchAgentArticles(
		agentId: string,
		options: FetchAgentArticlesOptions = {}
	): Promise<AgentArticlesResponse> {
		const limit = clampLimit(options.limit, 50);
		const skip = normalizeSkip(options.skip);
		const status = options.status ?? "published";
		const sort = options.sort ?? options.sortBy ?? "createdAt";
		const order = options.order ?? options.sortOrder ?? "desc";

		return this.request<AgentArticlesResponse>({
			method: "GET",
			path: `/agents/${encodeURIComponent(agentId)}/articles`,
			query: { limit, skip, status, slug: options.slug, sort, order },
		});
	}

	// api/v1/workspaces/:workspaceId GET
	async fetchWorkspace(workspaceId: string) {
		return this.request<WorkspaceGetResponse>({
			method: "GET",
			path: `/workspaces/${encodeURIComponent(workspaceId)}`,
		});
	}

	private buildUrl(path: string, query?: RequestOptions["query"]) {
		const url = new URL(this.baseUrl + path);
		if (query) {
			for (const [k, v] of Object.entries(query)) {
				if (v === undefined) continue;
				url.searchParams.set(k, String(v));
			}
		}
    console.log("Built URL:", url.toString());
		return url.toString();
	}

	private async request<T>(opts: RequestOptions): Promise<T> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const res = await fetch(this.buildUrl(opts.path, opts.query), {
				method: opts.method,
				// API expects X-API-KEY with Bearer prefix
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					"X-API-KEY": `Bearer ${this.apiKey}`,
				},
				body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
				signal: controller.signal,
			});

			const requestId = res.headers.get("x-request-id") ?? undefined;

			// try json first, fallback to text
			const rawText = await res.text();
			const parsed = rawText ? safeJson(rawText) : undefined;

			if (res.ok) return parsed as T;

			// ---- 402: Access quota exceeded ----
			if (res.status === 402) {
				throw new InkPilotsQuotaExceededError({
					message: pickMessage(parsed) ?? "Access quota exceeded (402).",
					requestId,
					details: parsed,
				});
			}

			const code = mapStatusToCode(res.status);
			const message =
				pickMessage(parsed) ?? `Request failed with status ${res.status}.`;

			throw new InkPilotsApiError({
				message,
				status: res.status,
				code,
				requestId,
				details: parsed,
			});
		} catch (err: any) {
			// fetch abort / network errors
			if (err?.name === "AbortError") {
				throw new InkPilotsApiError({
					message: `Request timed out after ${this.timeoutMs}ms.`,
					status: 0,
					code: "unknown",
				});
			}
			throw err;
		} finally {
			clearTimeout(timer);
		}
	}
}

function normalizeSkip(value?: number): number {
	const numeric = Number(value ?? 0);
	if (!Number.isFinite(numeric) || numeric < 0) return 0;
	return numeric;
}

function clampLimit(value: number | undefined, fallback: number): number {
	const numeric = Number(value ?? fallback);
	if (!Number.isFinite(numeric)) return fallback;
	return Math.max(1, Math.min(100, numeric));
}

function formatTags(tags?: string | string[]): string | undefined {
	if (!tags) return undefined;
	return Array.isArray(tags) ? tags.join(",") : tags;
}

function safeJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function pickMessage(body: unknown): string | undefined {
	// supports common API error shapes: { message }, { error: { message } }, string
	if (typeof body === "string") return body;
	if (body && typeof body === "object") {
		const anyBody = body as any;
		if (typeof anyBody.message === "string") return anyBody.message;
		if (anyBody.error && typeof anyBody.error.message === "string")
			return anyBody.error.message;
	}
	return undefined;
}

function mapStatusToCode(status: number): InkPilotsErrorCode {
	if (status === 400) return "bad_request";
	if (status === 401) return "unauthorized";
	if (status === 403) return "forbidden";
	if (status === 404) return "not_found";
	if (status === 429) return "rate_limited";
	if (status >= 500) return "server_error";
	return "unknown";
}
