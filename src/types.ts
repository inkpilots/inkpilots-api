// src/types.ts

export type ArticleBlockType =
	| "header"
	| "paragraph"
	| "image"
	| "video"
	| "list"
	| "quote"
	| "divider"
	| "code";

export interface BaseBlock {
	id: string; // unique per block
	type: ArticleBlockType;
	order: number; // sort order
}

export interface HeaderBlock extends BaseBlock {
	type: "header";
	level: 1 | 2 | 3 | 4; // h1-h4
	text: string;
}

export interface ParagraphBlock extends BaseBlock {
	type: "paragraph";
	text: string;
}

export interface ImageBlock extends BaseBlock {
	type: "image";
	url: string;
	caption?: string;
	alt?: string;
	width?: number;
	height?: number;
	prompt?: string; // Detailed prompt for AI image generation
}

export interface VideoBlock extends BaseBlock {
	type: "video";
	url: string; // YouTube, Vimeo, or internal storage
	caption?: string;
	provider?: "youtube" | "vimeo" | "uploaded";
}

export interface ListBlock extends BaseBlock {
	type: "list";
	ordered: boolean;
	items: string[];
}

export interface QuoteBlock extends BaseBlock {
	type: "quote";
	text: string;
	source?: string;
}

export interface DividerBlock extends BaseBlock {
	type: "divider";
}

export interface CodeBlock extends BaseBlock {
	type: "code";
	text: string;
}

export type ArticleBlock =
	| HeaderBlock
	| ParagraphBlock
	| ImageBlock
	| VideoBlock
	| ListBlock
	| QuoteBlock
	| DividerBlock
	| CodeBlock;

export interface Article {
	_id?: string;
	id: string;
	workspaceId: string;
	agentId?: string;
	author?: string;

	title: string;
	slug?: string;
	description?: string;
	language?: string; // e.g., "en", "tr"
	tone?: string; // e.g., "professional", "casual"
	coverImage?: string;

	content?: ArticleBlock[];
	blocks?: ArticleBlock[]; // Content blocks (structured content)

	meta?: {
		description?: string;
		keywords?: string | string[];
		tags?: string[];
	};

	tags?: string[];

	status: "draft" | "published" | "archived";

	model?: string;
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;

	createdAt: string;
	updatedAt: string;
	publishedAt?: string | null;
	createdBy?: string; // User ID who created
	updatedBy?: string; // User ID who updated
}

export type Agent = {
	id: string;
	workspaceId: string;
	name: string;
	description?: string;
	model: string;
	status?: "active" | "inactive";
	executionMode?: "scheduled" | "batched";
	schedule?: string; // Cron expression e.g., "0 0 * * MON"
	tone?: string; // e.g., "professional", "casual"
	language?: string; // e.g., "en", "tr"
	systemPrompt?: string;
	userPrompt?: string;
	isActive?: boolean;
	prompt?: string; // Legacy prompt field
	createdAt: string;
	updatedAt: string;
	createdBy?: string;
	updatedBy?: string;
	[key: string]: unknown;
};

export interface ListPagination {
	skip: number;
	limit: number;
	totalCount: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface AgentArticlesResponse {
	articles: Article[];
	pagination: ListPagination;
	agent?: undefined;
}

export interface AgentsListResponse {
	data: Agent[];
	pagination: ListPagination;
}

export interface AgentGetResponse {
	agent: Agent;
}

export interface ArticlesListResponse {
	data: Article[];
	pagination: ListPagination;
}

export interface ArticleGetResponse {
	article: Article;
}

export type WorkspaceGetResponse = {
	workspace: {
		id: string;
		name: string;
		slug: string;
		ownerId: string; // Foreign key to User
		visibility: boolean; // If true, workspace site is publicly visible
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
			createdAt?: Date;
			updatedAt?: Date;
		};

		// Note: planId, quotas, and Stripe info are now at the User (account) level
		// See SubscriptionDocument for subscription details

		createdAt: Date;
		updatedAt: Date;
	};
	agents: Array<
		Agent & {
			articles?: Article[];
		}
	>;
};

