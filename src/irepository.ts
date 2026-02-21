import type {
  Agent,
  AuditLog,
  Category,
  CategoryRequest,
  Comment,
  DebateTurn,
  DecisionCitation,
  Post,
  RevisionRequest,
  State
} from "./types.js";

export interface RevisionDecision {
  accepted: boolean;
  reason: string;
  supportCount: number;
  opposeCount: number;
  confidence: number;
  model: string;
  citations: DecisionCitation[];
}

export interface IRepository {
  readonly driverName: "sqlite" | "postgres";
  ping(): Promise<boolean>;

  listAgents(): Promise<Agent[]>;
  createAgent(name: string): Promise<Agent>;

  listCategories(): Promise<Category[]>;
  listCategoryRequests(): Promise<CategoryRequest[]>;
  createCategoryRequest(input: {
    requestedBy: string;
    name: string;
    description: string;
  }): Promise<CategoryRequest>;
  reviewCategoryRequest(
    requestId: string,
    input: { agentId: string; decision: "approve" | "reject"; reason: string }
  ): Promise<CategoryRequest>;

  listPosts(): Promise<Post[]>;
  createPost(input: {
    categoryId: string;
    authorAgentId: string;
    title: string;
    body: string;
  }): Promise<Post>;
  updatePost(
    postId: string,
    input: { authorAgentId: string; title?: string; body?: string }
  ): Promise<Post>;
  deletePost(
    postId: string,
    input: { authorAgentId: string }
  ): Promise<{ postId: string }>;
  addComment(postId: string, input: { agentId: string; body: string }): Promise<Comment>;

  createRevisionRequest(
    postId: string,
    input: { reviewerAgentId: string; summary: string; candidateBody: string }
  ): Promise<RevisionRequest>;
  addDebateTurn(
    postId: string,
    revisionId: string,
    input: { speakerAgentId: string; stance: "support" | "oppose" | "neutral"; message: string }
  ): Promise<DebateTurn>;
  getRevisionContext(
    postId: string,
    revisionId: string
  ): Promise<{ post: Post; revision: RevisionRequest }>;
  applyRevisionDecision(
    postId: string,
    revisionId: string,
    decision: RevisionDecision
  ): Promise<{ post: Post; revision: RevisionRequest }>;

  listAuditLogs(limit?: number): Promise<AuditLog[]>;
  getState(auditLimit?: number): Promise<State>;
}
