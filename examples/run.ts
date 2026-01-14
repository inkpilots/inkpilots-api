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
import { InkPilotsClient, InkPilotsApiError, InkPilotsQuotaExceededError } from "../src/index";

/**
 * EXAMPLE 1: Fetch articles from an agent
 */
async function runExample1() {
	console.log("\n=== Running Example 1: Fetch Articles ===\n");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	// Load from .env or hardcode here:
	const agentId = process.env.INKPILOTS_AGENT_ID || "your-agent-id";
	const limit = 50;
	const skip = 0;
	const status: "draft" | "published" | "archived" = "published";

	try {
		const response = await client.getAgentArticles(agentId, {
			limit,
			skip,
			status,
		});

		console.log(`✓ Successfully fetched articles`);
		console.log(`  Total: ${response.pagination.total}`);
		console.log(`  Returned: ${response.articles.length}`);
		console.log(`  Has more: ${response.pagination.hasMore}`);

		response.articles.forEach((article, index) => {
			console.log(`\n  ${index + 1}. "${article.title}"`);
			console.log(`     ID: ${article._id}`);
			console.log(`     Status: ${article.status}`);
			console.log(`     Language: ${article.language}`);
		});
	} catch (error) {
		if (error instanceof InkPilotsApiError) {
			console.error(`✗ API Error: ${error.message} (${error.code})`);
		} else {
			console.error(`✗ Error: ${error}`);
		}
	}
}

/**
 * EXAMPLE 2: Fetch workspace information
 */
async function runExample2() {
	console.log("\n=== Running Example 2: Fetch Workspace ===\n");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	// Load from .env or hardcode here:
	const workspaceId = process.env.INKPILOTS_WORKSPACE_ID || "your-workspace-id";

	try {
		const response = await client.getWorkspace(workspaceId);

		console.log(`✓ Successfully fetched workspace\n`);

		const workspace = response.workspace;
		console.log(`Workspace Details:`);
		console.log(`  ID: ${workspace.id}`);
		console.log(`  Name: ${workspace.name}`);
		console.log(`  Slug: ${workspace.slug}`);
		console.log(`  Owner ID: ${workspace.ownerId}`);
		console.log(`  Visibility: ${workspace.visibility ? "Public" : "Private"}`);
		console.log(`  Created: ${workspace.createdAt}`);
		console.log(`  Updated: ${workspace.updatedAt}`);

		if (workspace.header) {
			console.log(`\nHeader Information:`);
			if (workspace.header.websiteTitle) {
				console.log(`  Website Title: ${workspace.header.websiteTitle}`);
			}
			if (workspace.header.description) {
				console.log(`  Description: ${workspace.header.description}`);
			}
			if (workspace.header.email) {
				console.log(`  Email: ${workspace.header.email}`);
			}
			if (workspace.header.website) {
				console.log(`  Website: ${workspace.header.website}`);
			}
			if (workspace.header.phone) {
				console.log(`  Phone: ${workspace.header.phone}`);
			}
			if (workspace.header.socialAccounts) {
				console.log(`  Social Accounts:`);
				const socials = workspace.header.socialAccounts;
				if (socials.twitter) console.log(`    Twitter: ${socials.twitter}`);
				if (socials.github) console.log(`    GitHub: ${socials.github}`);
				if (socials.linkedin) console.log(`    LinkedIn: ${socials.linkedin}`);
				if (socials.instagram) console.log(`    Instagram: ${socials.instagram}`);
				if (socials.facebook) console.log(`    Facebook: ${socials.facebook}`);
				if (socials.youtube) console.log(`    YouTube: ${socials.youtube}`);
			}
		}

		console.log(`\nAgents (${response.agents.length}):`);
		response.agents.forEach((agent) => {
			console.log(`  - ID: ${agent.id}`);
			console.log(`    Articles: ${agent.articles?.length || 0}`);
		});
	} catch (error) {
		if (error instanceof InkPilotsApiError) {
			console.error(`✗ API Error: ${error.message} (${error.code})`);
		} else {
			console.error(`✗ Error: ${error}`);
		}
	}
}

/**
 * EXAMPLE 4: Fetch workspace and list all agents
 */
async function runExample4() {
	console.log("\n=== Running Example 4: Fetch Workspace Agents ===\n");

	const client = new InkPilotsClient({
		apiKey:
			process.env.INKPILOTS_API_KEY || "your-api-key-here",
	});

	// HARDCODE your parameters here:
	const workspaceId = process.env.INKPILOTS_WORKSPACE_ID || "your-workspace-id-here";
  console.log("Using Workspace ID:", workspaceId);
	try {
		const response = await client.getWorkspace(workspaceId);

		console.log(`✓ Workspace: ${response.workspace.name}\n`);
		console.log(`Agents (${response.agents.length}):\n`);

		response.agents.forEach((agent, index) => {
			console.log(`  ${index + 1}. ID: ${agent.id}`);
			if (agent.articles) {
				console.log(`     Articles: ${agent.articles.length}`);
				agent.articles.slice(0, 3).forEach((article) => {
					console.log(`       - "${article.title}"`);
				});
				if (agent.articles.length > 3) {
					console.log(`       ... and ${agent.articles.length - 3} more`);
				}
			}
			console.log();
		});
	} catch (error) {
		if (error instanceof InkPilotsApiError) {
		} else {
		}
	}
}

/**
 * EXAMPLE 5: Test error handling
 */
async function runExample5() {
	console.log("\n=== Running Example 5: Error Handling ===\n");

	const client = new InkPilotsClient({
		apiKey: process.env.INKPILOTS_API_KEY,
	});

	// HARDCODE your parameters here (use invalid IDs to trigger errors):
	const invalidWorkspaceId = "non-existent-workspace";

	try {
		console.log(`Attempting to fetch non-existent workspace: ${invalidWorkspaceId}\n`);
		await client.getWorkspace(invalidWorkspaceId);
	} catch (error) {
		if (error instanceof InkPilotsQuotaExceededError) {
			console.log(`✓ Caught InkPilotsQuotaExceededError`);
			console.log(`  Status: ${error.status}`);
			console.log(`  Code: ${error.code}`);
			console.log(`  Message: ${error.message}`);
			console.log(`  Request ID: ${error.requestId}`);
		} else if (error instanceof InkPilotsApiError) {
			console.log(`✓ Caught InkPilotsApiError`);
			console.log(`  Status: ${error.status}`);
			console.log(`  Code: ${error.code}`);
			console.log(`  Message: ${error.message}`);
			console.log(`  Request ID: ${error.requestId}`);

			switch (error.code) {
				case "not_found":
					console.log(`  → Resource not found`);
					break;
				case "unauthorized":
					console.log(`  → Authentication failed`);
					break;
				case "forbidden":
					console.log(`  → Access denied`);
					break;
				case "rate_limited":
					console.log(`  → Rate limited`);
					break;
				case "bad_request":
					console.log(`  → Invalid request`);
					break;
				case "server_error":
					console.log(`  → Server error`);
					break;
			}
		} else {
			console.log(`✓ Caught unexpected error:`, error);
		}
	}
}

/**
 * Main runner - uncomment the example you want to run
 */
async function main() {
	console.log("╔════════════════════════════════════════╗");
	console.log("║   InkPilots SDK - Example Runner       ║");
	console.log("╚════════════════════════════════════════╝");

	// Uncomment ONE of the examples below to run it:

	try {
		// await runExample1(); // Fetch articles
		// await runExample2(); // Fetch workspace
		// await runExample3(); // Paginate articles
		await runExample4(); // Fetch workspace agents
		// await runExample5(); // Error handling

		console.log("\n✓ Please uncomment an example function to run it!");
		console.log(
			"\nExamples available:"
		);
		console.log("  - runExample1(): Fetch articles from an agent");
		console.log("  - runExample2(): Fetch workspace information");
		console.log("  - runExample3(): Paginate through all articles");
		console.log("  - runExample4(): Fetch workspace and list agents");
		console.log("  - runExample5(): Test error handling\n");
	} catch (error) {
		console.error("Fatal error:", error);
		process.exit(1);
	}
}

main();
