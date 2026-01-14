// src/client.ts
import {
	InkPilotsApiError,
	InkPilotsQuotaExceededError,
	type InkPilotsErrorCode,
} from "./errors";
import type { AgentArticlesResponse, WorkspaceGetResponse } from "./types";

export type InkPilotsClientOptions = {
	apiKey?: string; // defaults to process.env.INKPILOTS_API_KEY
	baseUrl?: string; // defaults to https://www.inkpilots.com/api/v1
	timeoutMs?: number; // default 30s
};

export type GetAgentArticlesOptions = {
	limit?: number; // default 50
	skip?: number; // default 0
	status?: "draft" | "published" | "archived"; // default "published"
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
		this.baseUrl = "https://www.inkpilots.com/api/v1".replace(/\/+$/, "");
		this.timeoutMs = opts.timeoutMs ?? 30_000;
	}

	/**
	 * GET /agents/:agentId/articles?limit=&skip=&status=
	 */
	async getAgentArticles(
		agentId: string,
		options: GetAgentArticlesOptions = {}
	): Promise<AgentArticlesResponse> {
		const { limit = 50, skip = 0, status = "published" } = options;

		return this.request<AgentArticlesResponse>({
			method: "GET",
			path: `/agents/${encodeURIComponent(agentId)}/articles`,
			query: { limit, skip, status },
		});
	}

	// api/v1/workspaces/:workspaceId GET
	async getWorkspace(workspaceId: string) {
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
		return url.toString();
	}

	private async request<T>(opts: RequestOptions): Promise<T> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const res = await fetch(this.buildUrl(opts.path, opts.query), {
				method: opts.method,
				// NOTE: your backend expects x-api-key (not Authorization)
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					"x-api-key": `Bearer ${this.apiKey}`,
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
