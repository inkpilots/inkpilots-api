import { InkPilotsClient, InkPilotsApiError, InkPilotsQuotaExceededError } from "../src/index";

/**
 * Example 1: Basic client initialization
 * The API key can be provided directly or via INKPILOTS_API_KEY environment variable
 */
async function example1_BasicInitialization() {
	console.log("\n=== Example 1: Basic Initialization ===\n");

	// Initialize with environment variable (INKPILOTS_API_KEY)
	const client = new InkPilotsClient();

	// Or initialize with explicit API key
	// const client = new InkPilotsClient({ apiKey: "your-api-key" });

	console.log("Client initialized successfully");
}

/**
 * Example 2: Initialize with custom options
 */
async function example2_CustomInitialization() {
	console.log("\n=== Example 2: Custom Initialization ===\n");

	const client = new InkPilotsClient({
		apiKey: "your-api-key-here",
		baseUrl: "https://api.example.com/v1", // Override default base URL
		timeoutMs: 60_000, // 60 second timeout (default is 30 seconds)
	});

	console.log("Client initialized with custom options");
}

/**
 * Example 3: Fetch articles with default options
 */
async function example3_GetArticlesDefault() {
	console.log("\n=== Example 3: Get Articles (Default Options) ===\n");

	const client = new InkPilotsClient();

	try {
		// Fetch first 50 published articles for an agent
		const response = await client.getAgentArticles("agent-id-123");

		console.log(`Total articles: ${response.pagination.total}`);
		console.log(`Returned: ${response.articles.length}`);
		console.log(`Has more: ${response.pagination.hasMore}`);

		// Display first article details
		if (response.articles.length > 0) {
			const article = response.articles[0];
			console.log(`\nFirst article: "${article.title}"`);
			console.log(`Status: ${article.status}`);
			console.log(`Language: ${article.language}`);
		}
	} catch (error) {
		console.error("Error fetching articles:", error);
	}
}

/**
 * Example 4: Fetch articles with custom options
 */
async function example4_GetArticlesCustom() {
	console.log("\n=== Example 4: Get Articles (Custom Options) ===\n");

	const client = new InkPilotsClient();

	try {
		// Fetch draft articles with pagination
		const response = await client.getAgentArticles("agent-id-123", {
			status: "draft", // Can be "draft", "published", or "archived"
			limit: 25, // Get 25 articles per page (default is 50)
			skip: 0, // Skip first 0 articles (pagination offset)
		});

		console.log(`Found ${response.articles.length} draft articles`);

		// List all draft articles
		response.articles.forEach((article, index) => {
			console.log(`${index + 1}. ${article.title} (${article.status})`);
		});

		// Check if there are more results
		if (response.pagination.hasMore) {
			console.log(
				`\nTo get next page, use skip: ${response.pagination.skip + response.pagination.limit}`
			);
		}
	} catch (error) {
		console.error("Error fetching articles:", error);
	}
}

/**
 * Example 5: Paginate through all articles
 */
async function example5_PaginateArticles() {
	console.log("\n=== Example 5: Paginate Through All Articles ===\n");

	const client = new InkPilotsClient();
	let allArticles = [];
	let skip = 0;
	const limit = 50;

	try {
		let hasMore = true;

		while (hasMore) {
			const response = await client.getAgentArticles("agent-id-123", {
				skip,
				limit,
				status: "published",
			});

			allArticles = allArticles.concat(response.articles);
			console.log(`Fetched ${response.articles.length} articles (total: ${allArticles.length})`);

			hasMore = response.pagination.hasMore;
			skip += limit;

			// Add a small delay to avoid rate limiting
			if (hasMore) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		console.log(`\nTotal articles fetched: ${allArticles.length}`);
	} catch (error) {
		console.error("Error paginating articles:", error);
	}
}

/**
 * Example 6: Fetch workspace information
 */
async function example6_GetWorkspace() {
	console.log("\n=== Example 6: Get Workspace ===\n");

	const client = new InkPilotsClient();

	try {
		const response = await client.getWorkspace("workspace-id-123");

		const workspace = response.workspace;
		console.log(`Workspace: ${workspace.name}`);
		console.log(`Slug: ${workspace.slug}`);
		console.log(`Owner ID: ${workspace.ownerId}`);
		console.log(`Public: ${workspace.visibility}`);

		// Display workspace header info if available
		if (workspace.header) {
			console.log("\n--- Header Information ---");
			if (workspace.header.websiteTitle) {
				console.log(`Website Title: ${workspace.header.websiteTitle}`);
			}
			if (workspace.header.description) {
				console.log(`Description: ${workspace.header.description}`);
			}
			if (workspace.header.email) {
				console.log(`Email: ${workspace.header.email}`);
			}
			if (workspace.header.socialAccounts) {
				console.log("Social Accounts:");
				const socials = workspace.header.socialAccounts;
				if (socials.twitter) console.log(`  Twitter: ${socials.twitter}`);
				if (socials.github) console.log(`  GitHub: ${socials.github}`);
				if (socials.linkedin) console.log(`  LinkedIn: ${socials.linkedin}`);
			}
		}

		// Display agents
		console.log(`\nAgents (${response.agents.length}):`);
		response.agents.forEach((agent) => {
			console.log(`  - ${agent.id}`);
		});
	} catch (error) {
		console.error("Error fetching workspace:", error);
	}
}

/**
 * Example 7: Error handling - Generic API errors
 */
async function example7_ErrorHandling() {
	console.log("\n=== Example 7: Error Handling ===\n");

	const client = new InkPilotsClient();

	try {
		// Try to fetch from a non-existent workspace
		await client.getWorkspace("non-existent-workspace");
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			// Handle quota exceeded specifically
			console.log("Quota exceeded!");
			console.log(`Status: ${error.status}`);
			console.log(`Message: ${error.message}`);
			console.log(`Request ID: ${error.requestId}`);
		} else if (error instanceof InkPilotsApiError) {
			// Handle other API errors
			console.log("API Error occurred:");
			console.log(`Status: ${error.status}`);
			console.log(`Code: ${error.code}`);
			console.log(`Message: ${error.message}`);
			console.log(`Request ID: ${error.requestId}`);

			// Handle specific error codes
			switch (error.code) {
				case "not_found":
					console.log("Resource not found");
					break;
				case "unauthorized":
					console.log("Authentication failed");
					break;
				case "forbidden":
					console.log("Access denied");
					break;
				case "rate_limited":
					console.log("Rate limited, please retry later");
					break;
				case "bad_request":
					console.log("Invalid request parameters");
					break;
				case "server_error":
					console.log("Server error occurred");
					break;
				default:
					console.log("Unknown error");
			}
		} else {
			// Handle unexpected errors
			console.error("Unexpected error:", error);
		}
	}
}

/**
 * Example 8: Complete workflow - Fetch workspace and its articles
 */
async function example8_CompleteWorkflow() {
	console.log("\n=== Example 8: Complete Workflow ===\n");

	const client = new InkPilotsClient();

	try {
		// Step 1: Fetch workspace info
		console.log("1. Fetching workspace...");
		const workspaceResponse = await client.getWorkspace("workspace-id-123");
		const workspace = workspaceResponse.workspace;

		console.log(`✓ Workspace: ${workspace.name}`);

		// Step 2: For each agent, fetch their articles
		console.log(`\n2. Fetching articles for ${workspaceResponse.agents.length} agent(s)...`);

		for (const agent of workspaceResponse.agents) {
			console.log(`\n  Agent: ${agent.id}`);

			try {
				const articlesResponse = await client.getAgentArticles(agent.id, {
					status: "published",
					limit: 10,
				});

				console.log(`  ✓ Found ${articlesResponse.articles.length} published articles`);
				console.log(`  Total: ${articlesResponse.pagination.total}`);

				// List articles
				articlesResponse.articles.forEach((article) => {
					console.log(`    - "${article.title}" (${article.language})`);
				});
			} catch (articleError) {
				console.log(`  ✗ Error fetching articles: ${articleError}`);
			}

			// Small delay between requests
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		console.log("\n✓ Workflow completed");
	} catch (error) {
		console.error("Workflow error:", error);
	}
}

/**
 * Example 9: Retry logic with exponential backoff
 */
async function example9_RetryLogic() {
	console.log("\n=== Example 9: Retry Logic ===\n");

	const client = new InkPilotsClient();

	async function fetchWithRetry(
		fn: () => Promise<any>,
		maxRetries = 3,
		baseDelay = 1000
	) {
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await fn();
			} catch (error) {
				if (error instanceof InkPilotsApiError) {
					// Don't retry on client errors
					if (error.status >= 400 && error.status < 500) {
						throw error;
					}

					// Retry on server errors or rate limit
					if (attempt < maxRetries) {
						const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
						console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
						await new Promise((resolve) => setTimeout(resolve, delay));
						continue;
					}
				}
				throw error;
			}
		}
	}

	try {
		const response = await fetchWithRetry(() =>
			client.getAgentArticles("agent-id-123", { limit: 25 })
		);

		console.log(`✓ Successfully fetched ${response.articles.length} articles`);
	} catch (error) {
		console.error("✗ Failed after retries:", error);
	}
}

/**
 * Main function - Run all examples
 */
async function main() {
	console.log("InkPilots SDK Examples");
	console.log("=====================");

	try {
		// Note: These examples assume INKPILOTS_API_KEY is set
		// Set it before running: export INKPILOTS_API_KEY=your-key

		// Uncomment the example you want to run:
		// await example1_BasicInitialization();
		// await example2_CustomInitialization();
		// await example3_GetArticlesDefault();
		// await example4_GetArticlesCustom();
		// await example5_PaginateArticles();
		// await example6_GetWorkspace();
		// await example7_ErrorHandling();
		// await example8_CompleteWorkflow();
		// await example9_RetryLogic();

		console.log("\nExamples created successfully!");
		console.log(
			"Uncomment any example function call in the main() function to run it."
		);
	} catch (error) {
		console.error("Error running examples:", error);
		process.exit(1);
	}
}

// Run main function
main();
