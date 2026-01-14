import { describe, it, beforeEach, afterEach } from "node:test";
import * as assert from "node:assert";
import { InkPilotsClient } from "../src/client";
import {
	InkPilotsApiError,
	InkPilotsQuotaExceededError,
} from "../src/errors";
import type {
	AgentArticlesResponse,
	WorkspaceGetResponse,
	Article,
} from "../src/types";

describe("InkPilotsClient", () => {
	let client: InkPilotsClient;
	let originalFetch: typeof fetch;
	let fetchMock: (
		input: RequestInfo | URL,
		init?: RequestInit
	) => Promise<Response>;

	beforeEach(() => {
		process.env.INKPILOTS_API_KEY = "test-api-key-123";
		client = new InkPilotsClient();

		originalFetch = globalThis.fetch;
		fetchMock = async (
			input: RequestInfo | URL,
			init?: RequestInit
		): Promise<Response> => {
			throw new Error("Fetch mock not configured for this test");
		};
		globalThis.fetch = fetchMock as any;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		delete process.env.INKPILOTS_API_KEY;
	});

	describe("getAgentArticles", () => {
		it("should fetch articles with default options", async () => {
			const mockResponse: AgentArticlesResponse = {
				articles: [
					{
						_id: "article-1",
						workspaceId: "workspace-1",
						agentId: "agent-1",
						title: "Test Article",
						language: "en",
						status: "published",
						content: [],
						meta: {},
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
						model: "gpt-4",
						promptTokens: 100,
						completionTokens: 200,
						totalTokens: 300,
					},
				],
				pagination: {
					total: 1,
					limit: 50,
					skip: 0,
					hasMore: false,
				},
			};

			globalThis.fetch = async () =>
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});

			const result = await client.getAgentArticles("agent-1");

			assert.strictEqual(result.articles.length, 1);
			assert.strictEqual(result.articles[0].title, "Test Article");
			assert.strictEqual(result.pagination.total, 1);
		});

		it("should fetch articles with custom options", async () => {
			const mockResponse: AgentArticlesResponse = {
				articles: [
					{
						_id: "article-1",
						workspaceId: "workspace-1",
						agentId: "agent-1",
						title: "Draft Article",
						language: "en",
						status: "draft",
						content: [],
						meta: {},
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
						model: "gpt-4",
						promptTokens: 100,
						completionTokens: 200,
						totalTokens: 300,
					},
					{
						_id: "article-2",
						workspaceId: "workspace-1",
						agentId: "agent-1",
						title: "Another Draft",
						language: "en",
						status: "draft",
						content: [],
						meta: {},
						createdAt: "2024-01-02T00:00:00Z",
						updatedAt: "2024-01-02T00:00:00Z",
						model: "gpt-4",
						promptTokens: 150,
						completionTokens: 250,
						totalTokens: 400,
					},
				],
				pagination: {
					total: 2,
					limit: 25,
					skip: 0,
					hasMore: false,
				},
			};

			let capturedRequest: Request | undefined;
			globalThis.fetch = async (input, init) => {
				capturedRequest = new Request(input as string, init);
				return new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			};

			const result = await client.getAgentArticles("agent-1", {
				limit: 25,
				skip: 0,
				status: "draft",
			});

			assert.strictEqual(result.articles.length, 2);
			assert.strictEqual(result.pagination.limit, 25);
			assert.ok(capturedRequest?.url.includes("limit=25"));
			assert.ok(capturedRequest?.url.includes("status=draft"));
		});

		it("should handle agents with special characters in ID", async () => {
			const mockResponse: AgentArticlesResponse = {
				articles: [],
				pagination: {
					total: 0,
					limit: 50,
					skip: 0,
					hasMore: false,
				},
			};

			let capturedUrl = "";
			globalThis.fetch = async (input) => {
				capturedUrl = String(input);
				return new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			};

			await client.getAgentArticles("agent/with/slashes@123");

			assert.ok(capturedUrl.includes("agent%2Fwith%2Fslashes%40123"));
		});

		it("should throw error on 401 unauthorized", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Unauthorized" }), {
					status: 401,
					headers: { "Content-Type": "application/json" },
				});

			try {
				await client.getAgentArticles("agent-1");
				assert.fail("Expected error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.strictEqual((err as InkPilotsApiError).status, 401);
				assert.strictEqual((err as InkPilotsApiError).code, "unauthorized");
			}
		});

		it("should throw error on 404 not found", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Agent not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});

			try {
				await client.getAgentArticles("non-existent-agent");
				assert.fail("Expected error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.strictEqual((err as InkPilotsApiError).status, 404);
				assert.strictEqual((err as InkPilotsApiError).code, "not_found");
			}
		});

		it("should throw quota exceeded error on 402 status", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Quota exceeded" }), {
					status: 402,
					headers: {
						"Content-Type": "application/json",
						"x-request-id": "req-123",
					},
				});

			try {
				await client.getAgentArticles("agent-1");
				assert.fail("Expected quota error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsQuotaExceededError);
				assert.strictEqual((err as InkPilotsQuotaExceededError).status, 402);
				assert.strictEqual(
					(err as InkPilotsQuotaExceededError).code,
					"access_quota_exceeded"
				);
				assert.strictEqual((err as InkPilotsQuotaExceededError).requestId, "req-123");
			}
		});

		it("should throw error on 429 rate limit", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Too many requests" }), {
					status: 429,
					headers: { "Content-Type": "application/json" },
				});

			try {
				await client.getAgentArticles("agent-1");
				assert.fail("Expected error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.strictEqual((err as InkPilotsApiError).status, 429);
				assert.strictEqual((err as InkPilotsApiError).code, "rate_limited");
			}
		});

		it("should throw error on 500 server error", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Internal server error" }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});

			try {
				await client.getAgentArticles("agent-1");
				assert.fail("Expected error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.strictEqual((err as InkPilotsApiError).status, 500);
				assert.strictEqual((err as InkPilotsApiError).code, "server_error");
			}
		});

		it("should handle timeout", async () => {
			globalThis.fetch = async (input, init) => {
				// Simulate timeout by checking if abort signal is triggered
				if (init?.signal) {
					const abortPromise = new Promise<void>((resolve) => {
						init.signal.addEventListener("abort", () => resolve());
					});
					// Wait for either abort or timeout
					await Promise.race([
						abortPromise,
						new Promise((resolve) => setTimeout(resolve, 500)),
					]);
					// If abort was triggered, throw AbortError
					if (init.signal.aborted) {
						const err = new Error("The operation was aborted");
						(err as any).name = "AbortError";
						throw err;
					}
				}
				return new Response("");
			};

			const clientWithTimeout = new InkPilotsClient({ timeoutMs: 100 });

			try {
				await clientWithTimeout.getAgentArticles("agent-1");
				assert.fail("Expected timeout error");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.ok((err as InkPilotsApiError).message.includes("timed out"));
			}
		});
	});

	describe("getWorkspace", () => {
		it("should fetch workspace successfully", async () => {
			const mockResponse: WorkspaceGetResponse = {
				workspace: {
					id: "workspace-1",
					name: "Test Workspace",
					slug: "test-workspace",
					ownerId: "user-1",
					visibility: true,
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
				agents: [
					{
						id: "agent-1",
						articles: [],
					},
				],
			};

			globalThis.fetch = async () =>
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});

			const result = await client.getWorkspace("workspace-1");

			assert.strictEqual(result.workspace.name, "Test Workspace");
			assert.strictEqual(result.agents.length, 1);
			assert.strictEqual(result.agents[0].id, "agent-1");
		});

		it("should fetch workspace with full header data", async () => {
			const mockResponse: WorkspaceGetResponse = {
				workspace: {
					id: "workspace-1",
					name: "Full Workspace",
					slug: "full-workspace",
					ownerId: "user-1",
					visibility: true,
					header: {
						websiteTitle: "My Website",
						description: "A great website",
						email: "contact@example.com",
						website: "https://example.com",
						socialAccounts: {
							twitter: "@example",
							github: "example",
						},
					},
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
				agents: [],
			};

			globalThis.fetch = async () =>
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});

			const result = await client.getWorkspace("workspace-1");

			assert.strictEqual(
				result.workspace.header?.websiteTitle,
				"My Website"
			);
			assert.strictEqual(result.workspace.header?.email, "contact@example.com");
			assert.strictEqual(
				result.workspace.header?.socialAccounts?.twitter,
				"@example"
			);
		});

		it("should handle workspace with special characters in ID", async () => {
			const mockResponse: WorkspaceGetResponse = {
				workspace: {
					id: "workspace-1",
					name: "Test",
					slug: "test",
					ownerId: "user-1",
					visibility: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				agents: [],
			};

			let capturedUrl = "";
			globalThis.fetch = async (input) => {
				capturedUrl = String(input);
				return new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			};

			await client.getWorkspace("workspace/123@test");

			assert.ok(capturedUrl.includes("workspace%2F123%40test"));
		});

		it("should throw error on 401 unauthorized", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Unauthorized" }), {
					status: 401,
					headers: { "Content-Type": "application/json" },
				});

			try {
				await client.getWorkspace("workspace-1");
				assert.fail("Expected error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.strictEqual((err as InkPilotsApiError).status, 401);
				assert.strictEqual((err as InkPilotsApiError).code, "unauthorized");
			}
		});

		it("should throw error on 403 forbidden", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Access denied" }), {
					status: 403,
					headers: { "Content-Type": "application/json" },
				});

			try {
				await client.getWorkspace("workspace-1");
				assert.fail("Expected error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.strictEqual((err as InkPilotsApiError).status, 403);
				assert.strictEqual((err as InkPilotsApiError).code, "forbidden");
			}
		});

		it("should throw error on 404 not found", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Workspace not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});

			try {
				await client.getWorkspace("non-existent-workspace");
				assert.fail("Expected error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.strictEqual((err as InkPilotsApiError).status, 404);
				assert.strictEqual((err as InkPilotsApiError).code, "not_found");
			}
		});

		it("should throw quota exceeded error on 402", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Quota exceeded" }), {
					status: 402,
					headers: {
						"Content-Type": "application/json",
						"x-request-id": "req-456",
					},
				});

			try {
				await client.getWorkspace("workspace-1");
				assert.fail("Expected quota error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsQuotaExceededError);
				assert.strictEqual((err as InkPilotsQuotaExceededError).status, 402);
				assert.strictEqual(
					(err as InkPilotsQuotaExceededError).code,
					"access_quota_exceeded"
				);
				assert.strictEqual((err as InkPilotsQuotaExceededError).requestId, "req-456");
			}
		});

		it("should throw error on 500 server error", async () => {
			globalThis.fetch = async () =>
				new Response(JSON.stringify({ message: "Server error" }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});

			try {
				await client.getWorkspace("workspace-1");
				assert.fail("Expected error to be thrown");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.strictEqual((err as InkPilotsApiError).status, 500);
				assert.strictEqual((err as InkPilotsApiError).code, "server_error");
			}
		});

		it("should handle timeout", async () => {
			globalThis.fetch = async (input, init) => {
				// Simulate timeout by checking if abort signal is triggered
				if (init?.signal) {
					const abortPromise = new Promise<void>((resolve) => {
						init.signal.addEventListener("abort", () => resolve());
					});
					// Wait for either abort or timeout
					await Promise.race([
						abortPromise,
						new Promise((resolve) => setTimeout(resolve, 500)),
					]);
					// If abort was triggered, throw AbortError
					if (init.signal.aborted) {
						const err = new Error("The operation was aborted");
						(err as any).name = "AbortError";
						throw err;
					}
				}
				return new Response("");
			};

			const clientWithTimeout = new InkPilotsClient({ timeoutMs: 100 });

			try {
				await clientWithTimeout.getWorkspace("workspace-1");
				assert.fail("Expected timeout error");
			} catch (err) {
				assert.ok(err instanceof InkPilotsApiError);
				assert.ok((err as InkPilotsApiError).message.includes("timed out"));
			}
		});

		it("should include x-api-key header", async () => {
			let capturedHeaders: HeadersInit | undefined;

			globalThis.fetch = async (input, init) => {
				capturedHeaders = init?.headers;
				return new Response(
					JSON.stringify({
						workspace: {
							id: "ws-1",
							name: "Test",
							slug: "test",
							ownerId: "user-1",
							visibility: true,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
						agents: [],
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					}
				);
			};

			await client.getWorkspace("workspace-1");

			assert.ok(capturedHeaders);
			const headers = new Map(
				Object.entries(capturedHeaders as Record<string, string>)
			);
			assert.ok(headers.get("x-api-key")?.includes("Bearer test-api-key-123"));
		});
	});
});
