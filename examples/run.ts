#!/usr/bin/env node

/**
 * Example Runner
 *
 * This file allows you to easily run specific example functions.
 * Simply uncomment the example you want to run and execute:
 *
 *   tsx examples/run.ts
 *   or
 *   node examples/run.ts (after building)
 *
 * Configuration:
 * - Create a .env file in the project root with your credentials
 * - Or set environment variables directly
 */

import "dotenv/config";
import {
	InkPilotsClient,
	InkPilotsApiError,
	InkPilotsQuotaExceededError,
	type FetchAgentsOptions,
	type FetchArticlesOptions,
	type FetchAgentArticlesOptions,
} from "../src/index";

// Debug logger utility
const DEBUG = process.env.DEBUG === "true";
const log = {
	debug: (msg: string, data?: unknown) => {
		if (DEBUG) {
			console.log(`[DEBUG] ${msg}`, data ? JSON.stringify(data, null, 2) : "");
		}
	},
	info: (msg: string) => console.log(`[INFO] ${msg}`),
	success: (msg: string) => console.log(`✓ ${msg}`),
	error: (msg: string, err?: unknown) => console.error(`✗ ${msg}`, err || ""),
	section: (title: string) => {
		console.log(`\n${"=".repeat(50)}`);
		console.log(`${title}`);
		console.log(`${"=".repeat(50)}\n`);
	},
};

/**
 * EXAMPLE 1: Fetch Agents with various filters
 */
async function runExample1() {
	log.section("EXAMPLE 1: Fetch Agents with Filters");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	try {
		// Test Case 1: Basic list with defaults
		log.info("Test 1: Fetch agents with default parameters");
		log.debug("Parameters", { limit: 10, skip: 0 });

		const response1 = await client.fetchAgents({ });
		log.success("Fetched agents with defaults");
		log.info(`Total agents: ${response1.pagination.totalCount}`);
		log.info(`Returned: ${response1.data.length}`);
		log.info(`Page: ${response1.pagination.currentPage} of ${response1.pagination.totalPages}`);
		log.debug("Pagination data", response1.pagination);

		response1.data.slice(0, 3).forEach((agent, index) => {
			console.log(`  ${index + 1}. "${agent.name}" (${agent.id})`);
			console.log(`     Model: ${agent.model}`);
			console.log(`     Status: ${agent.isActive ? "Active" : "Inactive"}`);
		});


		// Test Case 2: Filter by status
		log.info("\nTest 2: List agents filtered by status=active");
		const params2: FetchAgentsOptions = {
			limit: 20,
			skip: 0,
			status: "active",
		};
		log.debug("Parameters", params2);

		const response2 = await client.fetchAgents(params2);
		log.success("Fetched active agents");
		log.info(`Active agents: ${response2.data.length} (Total: ${response2.pagination.totalCount})`);
		log.debug("Response", {
			dataCount: response2.data.length,
			pagination: response2.pagination,
		});

		// Test Case 3: Filter by execution mode and search
		log.info("\nTest 3: Fetch agents with executionMode and search");
		const params3: FetchAgentsOptions = {
			limit: 15,
			skip: 0,
			executionMode: "scheduled",
			search: "blog",
			sortBy: "name",
			sortOrder: "asc",
		};
		log.debug("Parameters", params3);

		const response3 = await client.fetchAgents(params3);
		log.success("Fetched agents with filters");
		log.info(`Found: ${response3.data.length} agents`);
		log.info(`Has next page: ${response3.pagination.hasNextPage}`);
		log.info(`Has prev page: ${response3.pagination.hasPrevPage}`);
		log.debug("Full pagination", response3.pagination);

		response3.data.forEach((agent, idx) => {
			console.log(`  ${idx + 1}. ${agent.name}`);
			console.log(`     Execution: ${agent.executionMode}`);
			console.log(`     Model: ${agent.model}`);
		});

		// Test Case 4: Model filtering
		log.info("\nTest 4: Filter agents by model");
		const params4: FetchAgentsOptions = {
			limit: 10,
			skip: 0,
			model: "llama-2-70b-chat",
			sortBy: "createdAt",
			sortOrder: "desc",
		};
		log.debug("Parameters", params4);

		const response4 = await client.fetchAgents(params4);
		log.success("Fetched agents filtered by model");
		log.info(`Agents with llama-2-70b-chat: ${response4.data.length}`);
		log.debug("Response pagination", response4.pagination);

		// Test Case 5: Pagination test
		log.info("\nTest 5: Pagination test (limit=5)");
		const params5: FetchAgentsOptions = {
			limit: 5,
			skip: 0,
		};
		log.debug("Parameters", params5);

		const response5 = await client.fetchAgents(params5);
		log.success("Fetched with limit=5");
		log.info(`Page 1: ${response5.data.length} items`);
		log.info(`Page info: ${response5.pagination.currentPage}/${response5.pagination.totalPages}`);
		log.info(`Next page available: ${response5.pagination.hasNextPage}`);

		if (response5.pagination.hasNextPage) {
			log.info("\nFetching next page...");
			const params5b: FetchAgentsOptions = {
				limit: 5,
				skip: 5,
			};
			const response5b = await client.fetchAgents(params5b);
			log.success("Fetched page 2");
			log.info(`Page 2: ${response5b.data.length} items`);
			log.info(`Page info: ${response5b.pagination.currentPage}/${response5b.pagination.totalPages}`);
		}
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			log.error("Quota exceeded", error.message);
		} else if (error instanceof InkPilotsApiError) {
			log.error(`API Error (${error.code})`, error.message);
			log.debug("Error details", { status: error.status, requestId: error.requestId });
		} else {
			log.error("Unexpected error", error);
		}
	}
}

/**
 * EXAMPLE 2: Fetch Articles with advanced filters
 */
async function runExample2() {
	log.section("EXAMPLE 2: Fetch Articles with Advanced Filters");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	try {
		// Test Case 1: List all articles
		log.info("Test 1: Fetch articles with defaults");
		log.debug("Parameters", { limit: 10, skip: 0 });

		const response1 = await client.fetchArticles();
		log.success("Fetched articles");
		log.info(`Total articles: ${response1.pagination.totalCount}`);
		log.info(`Returned: ${response1.data.length}`);
		log.debug("Pagination", response1.pagination);

		response1.data.slice(0, 3).forEach((article, idx) => {
			console.log(`  ${idx + 1}. "${article.title}"`);
			console.log(`     ID: ${article.id}`);
			console.log(`     Status: ${article.status}`);
		});

		// Test Case 2: Filter by status
		log.info("\nTest 2: Filter articles by status=published");
		const params2: FetchArticlesOptions = {
			limit: 25,
			skip: 0,
			status: "published",
		};
		log.debug("Parameters", params2);

		const response2 = await client.fetchArticles(params2);
		log.success("Fetched published articles");
		log.info(`Published articles: ${response2.data.length} (Total: ${response2.pagination.totalCount})`);

		// Test Case 3: Filter by language and tags
		log.info("\nTest 3: Filter by language=en and tags");
		const params3: FetchArticlesOptions = {
			limit: 20,
			skip: 0,
			language: "en",
			tags: ["featured", "trending"],
			status: "published",
		};
		log.debug("Parameters", params3);

		const response3 = await client.fetchArticles(params3);
		log.success("Fetched articles with language and tags filter");
		log.info(`Found: ${response3.data.length} articles`);
		log.debug("Pagination info", response3.pagination);

		response3.data.forEach((article, idx) => {
			console.log(`  ${idx + 1}. ${article.title}`);
			console.log(`     Language: ${article.language}`);
			console.log(`     Tags: ${article.tags?.join(", ") || "none"}`);
		});

		// Test Case 4: Search and model filter
		log.info("\nTest 4: Full-text search with model filter");
		const params4: FetchArticlesOptions = {
			limit: 15,
			skip: 0,
			search: "artificial intelligence",
			model: "llama-2-70b-chat",
			sortBy: "createdAt",
			sortOrder: "desc",
		};
		log.debug("Parameters", params4);

		const response4 = await client.fetchArticles(params4);
		log.success("Fetched articles with search");
		log.info(`Search results: ${response4.data.length}`);
		log.info(`Has more: ${response4.pagination.hasNextPage}`);

		// Test Case 5: Agent-specific filter
		log.info("\nTest 5: Filter articles by agentId");
		const agentId = process.env.INKPILOTS_AGENT_ID || "";
		if (!agentId) {
			log.info("Skipping test 5 - INKPILOTS_AGENT_ID not set");
		} else {
			const params5: FetchArticlesOptions = {
				limit: 20,
				skip: 0,
				agentId,
				status: "published",
			};
			log.debug("Parameters", params5);

			const response5 = await client.fetchArticles(params5);
			log.success("Fetched articles by agent");
			log.info(`Agent articles: ${response5.data.length}`);
			log.debug("Response", response5.pagination);
		}

		// Test Case 6: Combined complex filter
		log.info("\nTest 6: Complex filter (status + language + tags + search)");
		const params6: FetchArticlesOptions = {
			limit: 30,
			skip: 0,
			status: "published",
			language: "en",
			search: "Startup Blogs",
			sortBy: "updatedAt",
			sortOrder: "desc",
		};
		log.debug("Parameters", params6);

		const response6 = await client.fetchArticles(params6);
		log.success("Fetched with complex filters");
		log.info(`Results: ${response6.data.length} articles`);
		log.info(`Total available: ${response6.pagination.totalCount}`);
		log.info(`Current page: ${response6.pagination.currentPage}/${response6.pagination.totalPages}`);
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			log.error("Quota exceeded", error.message);
		} else if (error instanceof InkPilotsApiError) {
			log.error(`API Error (${error.code})`, error.message);
			log.debug("Error details", { status: error.status, requestId: error.requestId });
		} else {
			log.error("Unexpected error", error);
		}

    log.error(JSON.stringify(error) || "No error details available");
	}
}

/**
 * EXAMPLE 3: Get single article by ID
 */
async function runExample3() {
	log.section("EXAMPLE 3: Fetch Single Article by ID");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	const articleId = process.env.INKPILOTS_ARTICLE_ID;



	try {
		// Test Case 1: Get article by ID
		log.info(`Test 1: Fetch article with ID: ${articleId}`);
		log.debug("Parameters", { articleId });
    const articles = await client.fetchArticles({ limit: 1, skip: 0 });
    const id = articles.data.at(0)?.id;

		const response = await client.fetchArticle(id!);
		log.success("Fetched article successfully");

		const article = response.article;
		console.log(`\nArticle Details:`);
		console.log(`  ID: ${article.id}`);
		console.log(`  Title: ${article.title}`);
		console.log(`  Slug: ${article.slug}`);
		console.log(`  Description: ${article.description}`);
		console.log(`  Status: ${article.status}`);
		console.log(`  Language: ${article.language}`);
		console.log(`  Model: ${article.model}`);
		console.log(`  Tags: ${article.tags?.join(", ") || "none"}`);
		console.log(`  Created: ${article.createdAt}`);
		console.log(`  Updated: ${article.updatedAt}`);
		console.log(`  Created By: ${article.createdBy || "system"}`);
		console.log(`  Updated By: ${article.updatedBy || "system"}`);

		// Show article blocks
		if (article.blocks && article.blocks.length > 0) {
			console.log(`\nContent Blocks (${article.blocks.length}):`);
			article.blocks.slice(0, 5).forEach((block, idx) => {
				console.log(`  ${idx + 1}. ${block.type}`);
				if (block.type === "header") {
					console.log(`     Content: ${(block as any).content}`);
				}
			});
			if (article.blocks.length > 5) {
				console.log(`  ... and ${article.blocks.length - 5} more blocks`);
			}
		}

		// Show metadata
		if (article.meta) {
			console.log(`\nMetadata:`);
			console.log(`  Keywords: ${article.meta.keywords || "none"}`);
			console.log(`  Meta Tags: ${article.meta.tags?.join(", ") || "none"}`);
			console.log(`  Meta Description: ${article.meta.description || "none"}`);
		}

		log.debug("Full article object", article);

		// Test Case 2: Invalid article ID handling
		log.info("\nTest 2: Attempt to fetch invalid article ID");
		const invalidId = "invalid-article-id-12345";
		log.debug("Parameters", { articleId: invalidId });

		try {
			await client.fetchArticle(invalidId);
		} catch (innerError) {
			if (innerError instanceof InkPilotsApiError) {
				log.success(`Correctly caught error for invalid ID`);
				log.info(`Error code: ${innerError.code}`);
				log.info(`Error message: ${innerError.message}`);
				log.debug("Error details", { status: innerError.status, code: innerError.code });
			}
		}
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			log.error("Quota exceeded", error.message);
		} else if (error instanceof InkPilotsApiError) {
			log.error(`API Error (${error.code})`, error.message);
			log.debug("Error details", { status: error.status, requestId: error.requestId });
		} else {
			log.error("Unexpected error", error);
		}
	}
}

/**
 * EXAMPLE 4: Get Agent Articles
 */
async function runExample4() {
	log.section("EXAMPLE 4: Fetch Articles from Specific Agent");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	const agentId = process.env.INKPILOTS_AGENT_ID;

	if (!agentId) {
		log.error("INKPILOTS_AGENT_ID not set in .env");
		return;
	}

	try {
		// Test Case 1: Get agent articles with defaults
		log.info(`Test 1: Fetch articles from agent: ${agentId}`);
		log.debug("Parameters", { agentId, limit: 50, skip: 0 });

		const response1 = await client.fetchAgentArticles(agentId);
		log.success("Fetched agent articles");
		log.info(`Total articles: ${response1.pagination.totalCount}`);
		log.info(`Returned: ${response1.articles.length}`);
		log.info(`Page: ${response1.pagination.currentPage}/${response1.pagination.totalPages}`);
		log.debug("Pagination", response1.pagination);

		response1.articles.slice(0, 5).forEach((article, idx) => {
			console.log(`  ${idx + 1}. "${article.title}"`);
			console.log(`     ID: ${article.id}`);
			console.log(`     Slug: ${article.slug}`);
			console.log(`     Status: ${article.status}`);
		});

		// Test Case 2: Filter by status
		log.info("\nTest 2: Get published articles only");
		const params2: FetchAgentArticlesOptions = {
			limit: 30,
			skip: 0,
			status: "published",
		};
		log.debug("Parameters", params2);

		const response2 = await client.fetchAgentArticles(agentId, params2);
		log.success("Fetched published articles from agent");
		log.info(`Published: ${response2.articles.length} (Total: ${response2.pagination.totalCount})`);
		log.info(`Has next page: ${response2.pagination.hasNextPage}`);

		// Test Case 3: Sorting
		log.info("\nTest 3: Get articles with custom sorting");
		const params3: FetchAgentArticlesOptions = {
			limit: 25,
			skip: 0,
			sort: "updatedAt",
			order: "desc",
		};
		log.debug("Parameters", params3);

		const response3 = await client.fetchAgentArticles(agentId, params3);
		log.success("Fetched articles with custom sort");
		log.info(`Articles: ${response3.articles.length}`);
		log.debug("Pagination", response3.pagination);

		response3.articles.slice(0, 3).forEach((article, idx) => {
			console.log(`  ${idx + 1}. ${article.title}`);
			console.log(`     Updated: ${article.updatedAt}`);
		});

		// Test Case 4: Slug filter
		log.info("\nTest 4: Filter by slug (if available)");
		const params4: FetchAgentArticlesOptions = {
			limit: 10,
			skip: 0,
			slug: "test-article",
		};
		log.debug("Parameters", params4);

		const response4 = await client.fetchAgentArticles(agentId, params4);
		log.success("Fetched articles filtered by slug");
		log.info(`Results: ${response4.articles.length}`);

		// Test Case 5: Pagination
		log.info("\nTest 5: Pagination (limit=5)");
		const params5: FetchAgentArticlesOptions = {
			limit: 5,
			skip: 0,
			status: "published",
		};
		log.debug("Parameters", params5);

		const response5 = await client.fetchAgentArticles(agentId, params5);
		log.success("Fetched page 1");
		log.info(`Items: ${response5.articles.length}/${response5.pagination.totalCount}`);
		log.info(`Page: ${response5.pagination.currentPage}/${response5.pagination.totalPages}`);
		log.info(`Has next: ${response5.pagination.hasNextPage}`);

		if (response5.pagination.hasNextPage) {
			log.info("Fetching next page...");
			const params5b: FetchAgentArticlesOptions = {
				limit: 5,
				skip: 5,
				status: "published",
			};
			const response5b = await client.fetchAgentArticles(agentId, params5b);
			log.success("Fetched page 2");
			log.info(`Items: ${response5b.articles.length}`);
			log.info(`Page: ${response5b.pagination.currentPage}/${response5b.pagination.totalPages}`);
		}
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			log.error("Quota exceeded", error.message);
		} else if (error instanceof InkPilotsApiError) {
			log.error(`API Error (${error.code})`, error.message);
			log.debug("Error details", { status: error.status, requestId: error.requestId });
		} else {
			log.error("Unexpected error", error);
		}
	}
}

/**
 * EXAMPLE 5: Get Workspace Information
 */
async function runExample5() {
	log.section("EXAMPLE 5: Get Workspace with All Agents");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	const workspaceId = process.env.INKPILOTS_WORKSPACE_ID;

	if (!workspaceId) {
		log.error("INKPILOTS_WORKSPACE_ID not set in .env");
		return;
	}

	try {
		log.info(`Test 1: Fetch workspace: ${workspaceId}`);
		log.debug("Parameters", { workspaceId });

		const response = await client.fetchWorkspace(workspaceId);
		log.success("Fetched workspace successfully");

		const workspace = response.workspace;
		console.log(`\nWorkspace Details:`);
		console.log(`  ID: ${workspace.id}`);
		console.log(`  Name: ${workspace.name}`);
		console.log(`  Slug: ${workspace.slug}`);
		console.log(`  Owner ID: ${workspace.ownerId}`);
		console.log(`  Visibility: ${workspace.visibility ? "Public" : "Private"}`);
		console.log(`  Created: ${workspace.createdAt}`);
		console.log(`  Updated: ${workspace.updatedAt}`);
		log.debug("Workspace object", workspace);

		if (workspace.header) {
			console.log(`\nHeader/Contact Information:`);
			if (workspace.header.websiteTitle) {
				console.log(`  Website Title: ${workspace.header.websiteTitle}`);
			}
			if (workspace.header.description) {
				console.log(`  Description: ${workspace.header.description}`);
			}
			if (workspace.header.address) {
				console.log(`  Address: ${workspace.header.address}`);
			}
			if (workspace.header.phone) {
				console.log(`  Phone: ${workspace.header.phone}`);
			}
			if (workspace.header.email) {
				console.log(`  Email: ${workspace.header.email}`);
			}
			if (workspace.header.website) {
				console.log(`  Website: ${workspace.header.website}`);
			}
			if (workspace.header.blog) {
				console.log(`  Blog: ${workspace.header.blog}`);
			}
			if (workspace.header.documentation) {
				console.log(`  Documentation: ${workspace.header.documentation}`);
			}
			if (workspace.header.support) {
				console.log(`  Support: ${workspace.header.support}`);
			}

			if (workspace.header.socialAccounts) {
				console.log(`\nSocial Accounts:`);
				const socials = workspace.header.socialAccounts;
				if (socials.twitter) console.log(`  Twitter: ${socials.twitter}`);
				if (socials.github) console.log(`  GitHub: ${socials.github}`);
				if (socials.linkedin) console.log(`  LinkedIn: ${socials.linkedin}`);
				if (socials.instagram) console.log(`  Instagram: ${socials.instagram}`);
				if (socials.facebook) console.log(`  Facebook: ${socials.facebook}`);
				if (socials.youtube) console.log(`  YouTube: ${socials.youtube}`);
			}
		}

		// Show agents summary
		console.log(`\nAgents in Workspace (${response.agents.length}):`);
		log.debug(`Full agents data`, response.agents);

		response.agents.forEach((agent, agentIdx) => {
			console.log(`\n  Agent ${agentIdx + 1}:`);
			console.log(`    ID: ${agent.id}`);
			console.log(`    Name: ${agent.name}`);
			console.log(`    Model: ${agent.model}`);
			console.log(`    Status: ${agent.isActive ? "Active" : "Inactive"}`);
			console.log(`    Execution Mode: ${agent.executionMode}`);

			if (agent.articles && agent.articles.length > 0) {
				console.log(`    Articles (${agent.articles.length}):`);
				agent.articles.slice(0, 3).forEach((article, artIdx) => {
					console.log(`      ${artIdx + 1}. "${article.title}"`);
					console.log(`         Status: ${article.status}`);
					console.log(`         Language: ${article.language}`);
				});
				if (agent.articles.length > 3) {
					console.log(`      ... and ${agent.articles.length - 3} more articles`);
				}
			} else {
				console.log(`    Articles: None`);
			}
		});

		log.debug("Full workspace response", response);
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			log.error("Quota exceeded", error.message);
		} else if (error instanceof InkPilotsApiError) {
			log.error(`API Error (${error.code})`, error.message);
			log.debug("Error details", { status: error.status, requestId: error.requestId });
		} else {
			log.error("Unexpected error", error);
		}
	}
}

/**
 * EXAMPLE 6: Get specific agent and its details
 */
async function runExample6() {
	log.section("EXAMPLE 6: Get Specific Agent from Workspace");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	const workspaceId = process.env.INKPILOTS_WORKSPACE_ID;
	const agentId = process.env.INKPILOTS_AGENT_ID;

	if (!workspaceId || !agentId) {
		log.error("INKPILOTS_WORKSPACE_ID or INKPILOTS_AGENT_ID not set");
		return;
	}

	try {
		log.info(`Test 1: Get workspace to find agent ${agentId}`);
		log.debug("Parameters", { workspaceId });

		const workspaceResponse = await client.fetchWorkspace(workspaceId);
		log.success("Fetched workspace");

		const agent = workspaceResponse.agents.find((a) => a.id === agentId);

		if (!agent) {
			log.error(`Agent ${agentId} not found in workspace`);
			return;
		}

		log.success(`Found agent: ${agent.name}`);

		console.log(`\nAgent Details:`);
		console.log(`  ID: ${agent.id}`);
		console.log(`  Name: ${agent.name || "N/A"}`);
		console.log(`  Model: ${agent.model}`);
		console.log(`  Status: ${(agent as any).isActive ? "Active" : "Inactive"}`);
		console.log(`  Execution Mode: ${(agent as any).executionMode}`);
		console.log(`  Created At: ${agent.createdAt}`);
		console.log(`  Updated At: ${agent.updatedAt}`);

		if ((agent as any).prompt) {
			console.log(`  Prompt: ${(agent as any).prompt.substring(0, 100)}...`);
		}

		log.debug("Full agent object", agent);

		// Show articles from this agent
		if (agent.articles && agent.articles.length > 0) {
			console.log(`\nArticles (${agent.articles.length}):`);
			agent.articles.slice(0, 10).forEach((article, idx) => {
				console.log(`  ${idx + 1}. "${article.title}"`);
				console.log(`     ID: ${article.id}`);
				console.log(`     Status: ${article.status}`);
				console.log(`     Language: ${article.language}`);
				console.log(`     Created: ${article.createdAt}`);
			});
			if (agent.articles.length > 10) {
				console.log(`  ... and ${agent.articles.length - 10} more articles`);
			}
		}

		// Test Case 2: Get same articles via getAgentArticles method
		log.info("\nTest 2: Fetch same agent's articles via listArticles endpoint");
		log.debug("Calling getAgentArticles", { agentId });

		const articlesResponse = await client.fetchAgentArticles(agentId, {
			limit: 10,
			skip: 0,
			status: "published",
		});

		log.success("Fetched articles via dedicated endpoint");
		log.info(`Published articles: ${articlesResponse.articles.length}/${articlesResponse.pagination.totalCount}`);
		log.info(`Page: ${articlesResponse.pagination.currentPage}/${articlesResponse.pagination.totalPages}`);
		log.debug("Response pagination", articlesResponse.pagination);

		console.log(`\nArticles via getAgentArticles (first 3):`);
		articlesResponse.articles.slice(0, 3).forEach((article, idx) => {
			console.log(`  ${idx + 1}. "${article.title}"`);
			console.log(`     Status: ${article.status}`);
		});
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			log.error("Quota exceeded", error.message);
		} else if (error instanceof InkPilotsApiError) {
			log.error(`API Error (${error.code})`, error.message);
			log.debug("Error details", { status: error.status, requestId: error.requestId });
		} else {
			log.error("Unexpected error", error);
		}
	}
}

/**
 * EXAMPLE 7: Get Single Agent by ID
 */
async function runExample7() {
	log.section("EXAMPLE 7: Get Single Agent by ID");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	try {
		// Test Case 1: Get agent details
		log.info("Test 1: Fetch single agent by ID");

		// First, get an agent ID from the list
		const listResponse = await client.fetchAgents({ limit: 1 });
		if (listResponse.data.length === 0) {
			log.info("No agents available to fetch details");
			return;
		}

		const agentId = listResponse.data[0].id;
		log.debug("Using agent ID", agentId);

		const response = await client.fetchAgent(agentId);
		log.success("Successfully fetched agent details");

		const agent = response.agent;
		console.log(`\nAgent Details:`);
		console.log(`  Name: ${agent.name}`);
		console.log(`  ID: ${agent.id}`);
		console.log(`  Workspace ID: ${agent.workspaceId}`);
		console.log(`  Model: ${agent.model}`);
		console.log(`  Status: ${agent.status || "N/A"}`);
		console.log(`  Execution Mode: ${agent.executionMode || "N/A"}`);
		console.log(`  Schedule: ${agent.schedule || "None"}`);
		console.log(`  Tone: ${agent.tone || "N/A"}`);
		console.log(`  Language: ${agent.language || "N/A"}`);
		console.log(`  Active: ${agent.isActive ? "Yes" : "No"}`);
		if (agent.description) console.log(`  Description: ${agent.description}`);
		if (agent.systemPrompt) console.log(`  System Prompt: ${agent.systemPrompt.substring(0, 50)}...`);
		if (agent.userPrompt) console.log(`  User Prompt: ${agent.userPrompt.substring(0, 50)}...`);
		console.log(`  Created: ${agent.createdAt}`);
		console.log(`  Updated: ${agent.updatedAt}`);
		if (agent.createdBy) console.log(`  Created By: ${agent.createdBy}`);
		if (agent.updatedBy) console.log(`  Updated By: ${agent.updatedBy}`);

		// Test Case 2: Try fetching with invalid agent ID
		log.info("\nTest 2: Attempt to fetch non-existent agent");
		const invalidId = "nonexistent-agent-id-12345";
		log.debug("Using invalid agent ID", invalidId);

		try {
			await client.fetchAgent(invalidId);
			log.error("Should have thrown an error for invalid agent ID");
		} catch (error) {
			if (error instanceof InkPilotsApiError) {
				log.success("Correctly caught error for non-existent agent");
				log.info(`Error code: ${error.code}`);
				log.info(`Status: ${error.status}`);
			}
		}
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			log.error("Quota exceeded", error.message);
		} else if (error instanceof InkPilotsApiError) {
			log.error(`API Error (${error.code})`, error.message);
			log.debug("Error details", { status: error.status, requestId: error.requestId });
		} else {
			log.error("Unexpected error", error);
		}
	}
}

/**
 * EXAMPLE 8: Comprehensive error handling test
 */
async function runExample8() {
	log.section("EXAMPLE 88: Error Handling & Edge Cases");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY || "invalid-key",
	});

	// Test Case 1: Invalid API Key
	log.info("Test 1: Invalid API Key");
	log.debug("Using invalid key", "invalid-key");

	try {
		const agents = await client.fetchAgents();
    log.debug("Agents response", agents);
		log.error("Should have thrown an error for invalid API key");
	} catch (error) {
		if (error instanceof InkPilotsApiError) {
			log.success("Correctly caught invalid API key error");
			log.info(`Error code: ${error.code}`);
			log.info(`Status: ${error.status}`);
			log.debug("Full error", error);
		}
	}

	const validClient = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	// Test Case 2: Invalid article ID format
	log.info("\nTest 2: Invalid article ID format");
	log.debug("Parameters", { articleId: "not-a-valid-id" });

	try {
		await validClient.fetchArticle("not-a-valid-id");
	} catch (error) {
		if (error instanceof InkPilotsApiError) {
			log.success("Correctly caught invalid ID error");
			log.info(`Error code: ${error.code}`);
			log.info(`Message: ${error.message}`);
		}
	}

	// Test Case 3: Non-existent workspace
	log.info("\nTest 3: Non-existent workspace ID");
	log.debug("Parameters", { workspaceId: "507f1f77bcf86cd799999999" });

	try {
		await validClient.fetchWorkspace("507f1f77bcf86cd799999999");
	} catch (error) {
		if (error instanceof InkPilotsApiError) {
			log.success("Correctly caught not found error");
			log.info(`Error code: ${error.code}`);
			log.info(`Message: ${error.message}`);
		}
	}

	// Test Case 4: Limit boundary testing
	log.info("\nTest 4: Limit boundary testing");

	log.info("  Testing limit > 100 (should be clamped to 100)");
	log.debug("Parameters", { limit: 150 });

	try {
    const response = await validClient.fetchAgents({ limit: 150 });
		log.success(`Fetched with clamped limit`);
		log.info(
			`Requested limit: 150, Returned limit in pagination: ${response.pagination.limit}`,
		);
		log.debug("Actual returned items", response.data.length);
  } catch (error) {
    log.error("Error during limit boundary test", JSON.stringify(error));
  }

	// Test Case 5: Negative skip handling
	log.info("\nTest 5: Negative skip (should default to 0)");
	log.debug("Parameters", { skip: -10 });

	const response2 = await validClient.fetchAgents({ skip: -10 });
	log.success("Fetched with negative skip");
	log.info(`Returned skip value: ${response2.pagination.skip}`);

	// Test Case 6: Quota exceeded simulation
	log.info("\nTest 6: Quota exceeded error handling");
	log.info("(This test requires an API key that has exceeded quota)");

	try {
		// This will only trigger if quota is actually exceeded
		await validClient.fetchArticles({ limit: 1000 });
		log.info("Quota limit not exceeded for this API key");
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			log.success("Correctly caught quota exceeded error");
			log.info(`Message: ${error.message}`);
			log.info(`Code: ${error.code}`);
		}
	}
}

/**
 * Main runner - uncomment the example you want to run
 */
async function main() {
	console.log(`\n${"╔".padEnd(60, "═")}╗`);
	console.log(`║ InkPilots SDK - Comprehensive Example Runner${" ".padEnd(12)}║`);
	console.log(`${"╚".padEnd(60, "═")}╝\n`);

	log.info("Startup Configuration:");
	log.info(`  API Key Set: ${!!process.env.INKPILOTS_API_KEY}`);
	log.info(`  Agent ID Set: ${!!process.env.INKPILOTS_AGENT_ID}`);
	log.info(`  Workspace ID Set: ${!!process.env.INKPILOTS_WORKSPACE_ID}`);
	log.info(`  Article ID Set: ${!!process.env.INKPILOTS_ARTICLE_ID}`);
	log.info(`  Debug Mode: ${DEBUG ? "ENABLED" : "DISABLED"}`);
	log.info("  To enable debug logging, set: DEBUG=true");

	if (!process.env.INKPILOTS_API_KEY) {
		log.error("\n✗ INKPILOTS_API_KEY is not set!");
		log.error("  Set it in .env file or environment variables");
		process.exit(1);
	}

	// Uncomment ONE example below to run it:

	try {
		// await runExample1(); // Fetch Agents with filters
		// await runExample2(); // Fetch Articles with advanced filters
		// await runExample3(); // Get single article by ID
		// await runExample4(); // Get articles from specific agent
		// await runExample5(); // Get workspace with agents
		// await runExample6(); // Get specific agent from workspace
		// await runExample7(); // Get single agent by ID
		await runExample8(); // Error handling & edge cases


	} catch (error) {
		log.error("Fatal error during example execution", error);
		process.exit(1);
	}
}

main();
