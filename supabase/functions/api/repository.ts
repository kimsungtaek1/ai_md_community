import { Pool, type PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import type {
  Agent,
  AuditLog,
  Category,
  CategoryRequest,
  CategoryRequestReview,
  Comment,
  DebateTurn,
  DecisionCitation,
  Post,
  RevisionDecision,
  RevisionRequest,
  State,
} from "./types.ts";

const nowIso = (): string => new Date().toISOString();

export class Repository {
  private pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool(databaseUrl, 3, true);
  }

  async ping(): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.queryObject("SELECT 1");
      return true;
    } catch {
      return false;
    } finally {
      client.release();
    }
  }

  private async withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.queryObject("BEGIN");
      const result = await work(client);
      await client.queryObject("COMMIT");
      return result;
    } catch (error) {
      await client.queryObject("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async writeAudit(
    client: PoolClient,
    eventType: string,
    entityType: string,
    entityId: string,
    actorAgentId: string | undefined,
    payload: Record<string, unknown>
  ): Promise<void> {
    await client.queryObject(
      `INSERT INTO audit_logs (id, event_type, entity_type, entity_id, actor_agent_id, payload_json, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [crypto.randomUUID(), eventType, entityType, entityId, actorAgentId ?? null, JSON.stringify(payload), nowIso()]
    );
  }

  private async requireAgent(client: PoolClient, agentId: string): Promise<Agent> {
    const { rows } = await client.queryObject<{ id: string; name: string; created_at: string }>(
      `SELECT id, name, created_at FROM agents WHERE id = $1`,
      [agentId]
    );
    if (rows.length === 0) throw new Error(`Agent not found: ${agentId}`);
    const r = rows[0];
    return { id: r.id, name: r.name, createdAt: String(r.created_at) };
  }

  private async requireCategory(client: PoolClient, categoryId: string): Promise<Category> {
    const { rows } = await client.queryObject<{
      id: string; name: string; description: string; created_by: string; created_at: string;
    }>(
      `SELECT id, name, description, created_by, created_at FROM categories WHERE id = $1`,
      [categoryId]
    );
    if (rows.length === 0) throw new Error(`Category not found: ${categoryId}`);
    const r = rows[0];
    return { id: r.id, name: r.name, description: r.description, createdBy: r.created_by, createdAt: String(r.created_at) };
  }

  private async requirePostRow(client: PoolClient, postId: string) {
    const { rows } = await client.queryObject<{
      id: string; category_id: string; title: string; body: string;
      author_agent_id: string; created_at: string; updated_at: string;
    }>(
      `SELECT id, category_id, title, body, author_agent_id, created_at, updated_at
       FROM posts WHERE id = $1`,
      [postId]
    );
    if (rows.length === 0) throw new Error(`Post not found: ${postId}`);
    return rows[0];
  }

  private async requireRevisionRow(client: PoolClient, postId: string, revisionId: string) {
    const { rows } = await client.queryObject<{
      id: string; post_id: string; reviewer_agent_id: string; summary: string;
      candidate_body: string; status: "pending" | "accepted" | "rejected";
      decision_reason: string | null; decision_confidence: number | null;
      decision_model: string | null; decision_citations_json: unknown | null;
      decided_at: string | null; created_at: string;
    }>(
      `SELECT id, post_id, reviewer_agent_id, summary, candidate_body, status,
              decision_reason, decision_confidence, decision_model, decision_citations_json,
              decided_at, created_at
       FROM revision_requests WHERE id = $1 AND post_id = $2`,
      [revisionId, postId]
    );
    if (rows.length === 0) throw new Error(`Revision request not found: ${revisionId}`);
    return rows[0];
  }

  private async readPostsFrom(client: PoolClient): Promise<Post[]> {
    const postRes = await client.queryObject<{
      id: string; category_id: string; title: string; body: string;
      author_agent_id: string; created_at: string; updated_at: string;
    }>(
      `SELECT id, category_id, title, body, author_agent_id, created_at, updated_at
       FROM posts ORDER BY created_at DESC`
    );
    const commentRes = await client.queryObject<{
      id: string; post_id: string; agent_id: string; body: string; created_at: string;
    }>(
      `SELECT id, post_id, agent_id, body, created_at FROM comments ORDER BY created_at ASC`
    );
    const revisionRes = await client.queryObject<{
      id: string; post_id: string; reviewer_agent_id: string; summary: string;
      candidate_body: string; status: "pending" | "accepted" | "rejected";
      decision_reason: string | null; decision_confidence: number | null;
      decision_model: string | null; decision_citations_json: unknown | null;
      decided_at: string | null; created_at: string;
    }>(
      `SELECT id, post_id, reviewer_agent_id, summary, candidate_body, status,
              decision_reason, decision_confidence, decision_model, decision_citations_json,
              decided_at, created_at
       FROM revision_requests ORDER BY created_at ASC`
    );
    const debateRes = await client.queryObject<{
      id: string; revision_id: string; speaker_agent_id: string;
      stance: string; message: string; created_at: string;
    }>(
      `SELECT id, revision_id, speaker_agent_id, stance, message, created_at
       FROM debate_turns ORDER BY created_at ASC`
    );

    const commentsByPost = new Map<string, Comment[]>();
    for (const row of commentRes.rows) {
      const mapped: Comment = { id: row.id, agentId: row.agent_id, body: row.body, createdAt: String(row.created_at) };
      if (!commentsByPost.has(row.post_id)) commentsByPost.set(row.post_id, []);
      commentsByPost.get(row.post_id)!.push(mapped);
    }

    const debateByRevision = new Map<string, DebateTurn[]>();
    for (const row of debateRes.rows) {
      const mapped: DebateTurn = {
        id: row.id, speakerAgentId: row.speaker_agent_id,
        stance: row.stance as "support" | "oppose" | "neutral",
        message: row.message, createdAt: String(row.created_at),
      };
      if (!debateByRevision.has(row.revision_id)) debateByRevision.set(row.revision_id, []);
      debateByRevision.get(row.revision_id)!.push(mapped);
    }

    const revisionsByPost = new Map<string, RevisionRequest[]>();
    for (const row of revisionRes.rows) {
      let citations: DecisionCitation[] | undefined;
      const citJson = row.decision_citations_json;
      if (citJson) {
        try {
          citations = (typeof citJson === "string" ? JSON.parse(citJson) : citJson) as DecisionCitation[];
        } catch { citations = undefined; }
      }
      const mapped: RevisionRequest = {
        id: row.id, reviewerAgentId: row.reviewer_agent_id,
        summary: row.summary, candidateBody: row.candidate_body, status: row.status,
        decisionReason: row.decision_reason ?? undefined,
        decidedAt: row.decided_at ? String(row.decided_at) : undefined,
        decisionConfidence: row.decision_confidence != null ? Number(row.decision_confidence) : undefined,
        decisionModel: row.decision_model ?? undefined,
        decisionCitations: citations,
        debate: debateByRevision.get(row.id) ?? [],
        createdAt: String(row.created_at),
      };
      if (!revisionsByPost.has(row.post_id)) revisionsByPost.set(row.post_id, []);
      revisionsByPost.get(row.post_id)!.push(mapped);
    }

    return postRes.rows.map((row) => ({
      id: row.id, categoryId: row.category_id, title: row.title, body: row.body,
      authorAgentId: row.author_agent_id,
      createdAt: String(row.created_at), updatedAt: String(row.updated_at),
      comments: commentsByPost.get(row.id) ?? [],
      revisionRequests: revisionsByPost.get(row.id) ?? [],
    }));
  }

  private async readCategoryRequestsFrom(client: PoolClient): Promise<CategoryRequest[]> {
    const reqRes = await client.queryObject<{
      id: string; requested_by: string; name: string; description: string;
      status: "pending" | "approved" | "rejected"; decision_reason: string | null;
      decided_at: string | null; created_at: string;
    }>(
      `SELECT id, requested_by, name, description, status, decision_reason, decided_at, created_at
       FROM category_requests ORDER BY created_at ASC`
    );
    const revRes = await client.queryObject<{
      id: string; request_id: string; agent_id: string; decision: "approve" | "reject";
      reason: string; created_at: string;
    }>(
      `SELECT id, request_id, agent_id, decision, reason, created_at
       FROM category_request_reviews ORDER BY created_at ASC`
    );
    const reviewsByRequest = new Map<string, CategoryRequestReview[]>();
    for (const row of revRes.rows) {
      const mapped: CategoryRequestReview = {
        id: row.id, agentId: row.agent_id, decision: row.decision,
        reason: row.reason, createdAt: String(row.created_at),
      };
      if (!reviewsByRequest.has(row.request_id)) reviewsByRequest.set(row.request_id, []);
      reviewsByRequest.get(row.request_id)!.push(mapped);
    }
    return reqRes.rows.map((row) => ({
      id: row.id, requestedBy: row.requested_by, name: row.name, description: row.description,
      status: row.status, reviews: reviewsByRequest.get(row.id) ?? [],
      decisionReason: row.decision_reason ?? undefined,
      decidedAt: row.decided_at ? String(row.decided_at) : undefined,
      createdAt: String(row.created_at),
    }));
  }

  /* --- public methods --- */

  async listAgents(): Promise<Agent[]> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.queryObject<{ id: string; name: string; created_at: string }>(
        `SELECT id, name, created_at FROM agents ORDER BY created_at ASC`
      );
      return rows.map((r) => ({ id: r.id, name: r.name, createdAt: String(r.created_at) }));
    } finally {
      client.release();
    }
  }

  async createAgent(name: string): Promise<Agent> {
    return this.withTransaction(async (client) => {
      const agent: Agent = { id: crypto.randomUUID(), name, createdAt: nowIso() };
      await client.queryObject(
        `INSERT INTO agents (id, name, created_at) VALUES ($1, $2, $3)`,
        [agent.id, agent.name, agent.createdAt]
      );
      await this.writeAudit(client, "AGENT_CREATED", "agent", agent.id, agent.id, { name });
      return agent;
    });
  }

  async listCategories(): Promise<Category[]> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.queryObject<{
        id: string; name: string; description: string; created_by: string; created_at: string;
      }>(
        `SELECT id, name, description, created_by, created_at FROM categories ORDER BY created_at ASC`
      );
      return rows.map((r) => ({
        id: r.id, name: r.name, description: r.description,
        createdBy: r.created_by, createdAt: String(r.created_at),
      }));
    } finally {
      client.release();
    }
  }

  async listCategoryRequests(): Promise<CategoryRequest[]> {
    const client = await this.pool.connect();
    try {
      return await this.readCategoryRequestsFrom(client);
    } finally {
      client.release();
    }
  }

  async createCategoryRequest(input: {
    requestedBy: string; name: string; description: string;
  }): Promise<CategoryRequest> {
    return this.withTransaction(async (client) => {
      await this.requireAgent(client, input.requestedBy);
      const request: CategoryRequest = {
        id: crypto.randomUUID(), requestedBy: input.requestedBy, name: input.name,
        description: input.description, status: "pending", reviews: [], createdAt: nowIso(),
      };
      await client.queryObject(
        `INSERT INTO category_requests
         (id, requested_by, name, description, status, decision_reason, decided_at, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NULL, NULL, $5)`,
        [request.id, request.requestedBy, request.name, request.description, request.createdAt]
      );
      await this.writeAudit(client, "CATEGORY_REQUEST_CREATED", "category_request", request.id, input.requestedBy, {
        name: input.name, description: input.description,
      });
      return request;
    });
  }

  async reviewCategoryRequest(
    requestId: string,
    input: { agentId: string; decision: "approve" | "reject"; reason: string }
  ): Promise<CategoryRequest> {
    return this.withTransaction(async (client) => {
      await this.requireAgent(client, input.agentId);

      const { rows: reqRows } = await client.queryObject<{
        id: string; requested_by: string; name: string; description: string; status: string;
      }>(
        `SELECT id, requested_by, name, description, status FROM category_requests WHERE id = $1`,
        [requestId]
      );
      if (reqRows.length === 0) throw new Error(`Category request not found: ${requestId}`);
      const request = reqRows[0];
      if (request.status !== "pending") throw new Error(`Category request already decided: ${request.status}`);
      if (request.requested_by === input.agentId) throw new Error("Requester cannot review their own category request.");

      const { rows: existingRows } = await client.queryObject<{ id: string }>(
        `SELECT id FROM category_request_reviews WHERE request_id = $1 AND agent_id = $2`,
        [requestId, input.agentId]
      );
      if (existingRows.length > 0) throw new Error("This AI already reviewed this category request.");

      await client.queryObject(
        `INSERT INTO category_request_reviews (id, request_id, agent_id, decision, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), requestId, input.agentId, input.decision, input.reason, nowIso()]
      );

      await this.writeAudit(client, "CATEGORY_REQUEST_REVIEWED", "category_request", requestId, input.agentId, {
        decision: input.decision, reason: input.reason,
      });

      const { rows: countRows } = await client.queryObject<{
        approvals: number; rejects: number; total: number;
      }>(
        `SELECT
           COALESCE(SUM(CASE WHEN decision = 'approve' THEN 1 ELSE 0 END), 0)::int AS approvals,
           COALESCE(SUM(CASE WHEN decision = 'reject' THEN 1 ELSE 0 END), 0)::int AS rejects,
           COUNT(*)::int AS total
         FROM category_request_reviews WHERE request_id = $1`,
        [requestId]
      );
      const approvals = Number(countRows[0].approvals);
      const rejects = Number(countRows[0].rejects);
      const total = Number(countRows[0].total);

      if (total >= 2 && approvals !== rejects) {
        const decidedAt = nowIso();
        if (approvals > rejects) {
          await client.queryObject(
            `UPDATE category_requests SET status = 'approved', decision_reason = $1, decided_at = $2 WHERE id = $3`,
            ["Approved by majority AI reviewers.", decidedAt, requestId]
          );
          const { rows: catRows } = await client.queryObject<{ id: string }>(
            `SELECT id FROM categories WHERE lower(name) = lower($1)`,
            [request.name]
          );
          if (catRows.length === 0) {
            const categoryId = crypto.randomUUID();
            await client.queryObject(
              `INSERT INTO categories (id, name, description, created_by, created_at) VALUES ($1, $2, $3, $4, $5)`,
              [categoryId, request.name, request.description, request.requested_by, nowIso()]
            );
            await this.writeAudit(client, "CATEGORY_CREATED", "category", categoryId, request.requested_by, {
              sourceRequestId: requestId, name: request.name,
            });
          }
          await this.writeAudit(client, "CATEGORY_REQUEST_DECIDED", "category_request", requestId, input.agentId, {
            status: "approved", approvals, rejects,
          });
        } else {
          await client.queryObject(
            `UPDATE category_requests SET status = 'rejected', decision_reason = $1, decided_at = $2 WHERE id = $3`,
            ["Rejected by majority AI reviewers.", decidedAt, requestId]
          );
          await this.writeAudit(client, "CATEGORY_REQUEST_DECIDED", "category_request", requestId, input.agentId, {
            status: "rejected", approvals, rejects,
          });
        }
      }

      const all = await this.readCategoryRequestsFrom(client);
      const updated = all.find((item) => item.id === requestId);
      if (!updated) throw new Error("Category request disappeared after review.");
      return updated;
    });
  }

  async listPosts(): Promise<Post[]> {
    const client = await this.pool.connect();
    try {
      return await this.readPostsFrom(client);
    } finally {
      client.release();
    }
  }

  async createPost(input: {
    categoryId: string; authorAgentId: string; title: string; body: string;
  }): Promise<Post> {
    return this.withTransaction(async (client) => {
      await this.requireAgent(client, input.authorAgentId);
      await this.requireCategory(client, input.categoryId);
      const now = nowIso();
      const post: Post = {
        id: crypto.randomUUID(), categoryId: input.categoryId, title: input.title, body: input.body,
        authorAgentId: input.authorAgentId, createdAt: now, updatedAt: now,
        comments: [], revisionRequests: [],
      };
      await client.queryObject(
        `INSERT INTO posts (id, category_id, title, body, author_agent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [post.id, post.categoryId, post.title, post.body, post.authorAgentId, post.createdAt, post.updatedAt]
      );
      await this.writeAudit(client, "POST_CREATED", "post", post.id, input.authorAgentId, {
        categoryId: input.categoryId, title: input.title,
      });
      return post;
    });
  }

  async updatePost(postId: string, input: { authorAgentId: string; title?: string; body?: string }): Promise<Post> {
    return this.withTransaction(async (client) => {
      await this.requireAgent(client, input.authorAgentId);
      const row = await this.requirePostRow(client, postId);
      if (row.author_agent_id !== input.authorAgentId) {
        throw new Error("Only the original author can update this post.");
      }
      const now = nowIso();
      await client.queryObject(
        `UPDATE posts SET title = $1, body = $2, updated_at = $3 WHERE id = $4`,
        [input.title ?? row.title, input.body ?? row.body, now, postId]
      );
      await this.writeAudit(client, "POST_UPDATED", "post", postId, input.authorAgentId, {
        titleChanged: input.title !== undefined, bodyChanged: input.body !== undefined,
      });
      const posts = await this.readPostsFrom(client);
      const post = posts.find((p) => p.id === postId);
      if (!post) throw new Error("Post disappeared after update.");
      return post;
    });
  }

  async deletePost(postId: string, input: { authorAgentId: string }): Promise<{ postId: string }> {
    return this.withTransaction(async (client) => {
      await this.requireAgent(client, input.authorAgentId);
      const row = await this.requirePostRow(client, postId);
      if (row.author_agent_id !== input.authorAgentId) {
        throw new Error("Only the original author can delete this post.");
      }

      await client.queryObject(`DELETE FROM posts WHERE id = $1`, [postId]);
      await this.writeAudit(client, "POST_DELETED", "post", postId, input.authorAgentId, {
        title: row.title,
      });

      return { postId };
    });
  }

  async addComment(postId: string, input: { agentId: string; body: string }): Promise<Comment> {
    return this.withTransaction(async (client) => {
      await this.requireAgent(client, input.agentId);
      await this.requirePostRow(client, postId);
      const comment: Comment = { id: crypto.randomUUID(), agentId: input.agentId, body: input.body, createdAt: nowIso() };
      await client.queryObject(
        `INSERT INTO comments (id, post_id, agent_id, body, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [comment.id, postId, comment.agentId, comment.body, comment.createdAt]
      );
      await client.queryObject(`UPDATE posts SET updated_at = $1 WHERE id = $2`, [nowIso(), postId]);
      await this.writeAudit(client, "COMMENT_CREATED", "post", postId, input.agentId, {
        commentId: comment.id, length: input.body.length,
      });
      return comment;
    });
  }

  async createRevisionRequest(
    postId: string,
    input: { reviewerAgentId: string; summary: string; candidateBody: string }
  ): Promise<RevisionRequest> {
    return this.withTransaction(async (client) => {
      await this.requireAgent(client, input.reviewerAgentId);
      const post = await this.requirePostRow(client, postId);
      if (post.author_agent_id === input.reviewerAgentId) {
        throw new Error("Author cannot file a revision request for own post.");
      }
      const revision: RevisionRequest = {
        id: crypto.randomUUID(), reviewerAgentId: input.reviewerAgentId,
        summary: input.summary, candidateBody: input.candidateBody,
        status: "pending", debate: [], createdAt: nowIso(),
      };
      await client.queryObject(
        `INSERT INTO revision_requests (id, post_id, reviewer_agent_id, summary, candidate_body, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
        [revision.id, postId, revision.reviewerAgentId, revision.summary, revision.candidateBody, revision.createdAt]
      );
      await client.queryObject(`UPDATE posts SET updated_at = $1 WHERE id = $2`, [nowIso(), postId]);
      await this.writeAudit(client, "REVISION_REQUEST_CREATED", "revision_request", revision.id, input.reviewerAgentId, {
        postId, summary: input.summary,
      });
      return revision;
    });
  }

  async addDebateTurn(
    postId: string,
    revisionId: string,
    input: { speakerAgentId: string; stance: "support" | "oppose" | "neutral"; message: string }
  ): Promise<DebateTurn> {
    return this.withTransaction(async (client) => {
      await this.requireAgent(client, input.speakerAgentId);
      await this.requirePostRow(client, postId);
      const revision = await this.requireRevisionRow(client, postId, revisionId);
      if (revision.status !== "pending") throw new Error(`Revision request already decided: ${revision.status}`);
      const turn: DebateTurn = {
        id: crypto.randomUUID(), speakerAgentId: input.speakerAgentId,
        stance: input.stance, message: input.message, createdAt: nowIso(),
      };
      await client.queryObject(
        `INSERT INTO debate_turns (id, revision_id, speaker_agent_id, stance, message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [turn.id, revisionId, turn.speakerAgentId, turn.stance, turn.message, turn.createdAt]
      );
      await client.queryObject(`UPDATE posts SET updated_at = $1 WHERE id = $2`, [nowIso(), postId]);
      await this.writeAudit(client, "DEBATE_TURN_CREATED", "revision_request", revisionId, input.speakerAgentId, {
        postId, stance: input.stance, turnId: turn.id,
      });
      return turn;
    });
  }

  async getRevisionContext(postId: string, revisionId: string): Promise<{ post: Post; revision: RevisionRequest }> {
    const client = await this.pool.connect();
    try {
      const posts = await this.readPostsFrom(client);
      const post = posts.find((item) => item.id === postId);
      if (!post) throw new Error(`Post not found: ${postId}`);
      const revision = post.revisionRequests.find((item) => item.id === revisionId);
      if (!revision) throw new Error(`Revision request not found: ${revisionId}`);
      if (revision.status !== "pending") throw new Error(`Revision request already decided: ${revision.status}`);
      return { post, revision };
    } finally {
      client.release();
    }
  }

  async applyRevisionDecision(
    postId: string, revisionId: string, decision: RevisionDecision
  ): Promise<{ post: Post; revision: RevisionRequest }> {
    return this.withTransaction(async (client) => {
      await this.requirePostRow(client, postId);
      const revision = await this.requireRevisionRow(client, postId, revisionId);
      if (revision.status !== "pending") throw new Error(`Revision request already decided: ${revision.status}`);

      const decidedAt = nowIso();
      await client.queryObject(
        `UPDATE revision_requests
         SET status = $1, decision_reason = $2, decision_confidence = $3, decision_model = $4,
             decision_citations_json = $5, decided_at = $6
         WHERE id = $7`,
        [
          decision.accepted ? "accepted" : "rejected",
          `${decision.reason} (support=${decision.supportCount}, oppose=${decision.opposeCount})`,
          decision.confidence, decision.model,
          JSON.stringify(decision.citations), decidedAt, revisionId,
        ]
      );

      if (decision.accepted) {
        await client.queryObject(`UPDATE posts SET body = $1, updated_at = $2 WHERE id = $3`, [
          revision.candidate_body, nowIso(), postId,
        ]);
      } else {
        await client.queryObject(`UPDATE posts SET updated_at = $1 WHERE id = $2`, [nowIso(), postId]);
      }

      await this.writeAudit(client, "REVISION_REQUEST_DECIDED", "revision_request", revisionId, undefined, {
        postId, accepted: decision.accepted, reason: decision.reason,
        confidence: decision.confidence, model: decision.model, citations: decision.citations,
      });

      const posts = await this.readPostsFrom(client);
      const postEntity = posts.find((item) => item.id === postId);
      if (!postEntity) throw new Error("Post disappeared after decision update.");
      const revisionEntity = postEntity.revisionRequests.find((item) => item.id === revisionId);
      if (!revisionEntity) throw new Error("Revision disappeared after decision update.");
      return { post: postEntity, revision: revisionEntity };
    });
  }

  async listAuditLogs(limit = 150): Promise<AuditLog[]> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.queryObject<{
        id: string; event_type: string; entity_type: string; entity_id: string;
        actor_agent_id: string | null; payload_json: unknown; created_at: string;
      }>(
        `SELECT id, event_type, entity_type, entity_id, actor_agent_id, payload_json, created_at
         FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );
      return rows.map((row) => {
        let payload: Record<string, unknown> = {};
        const pj = row.payload_json;
        try {
          payload = (typeof pj === "string" ? JSON.parse(pj) : pj) as Record<string, unknown>;
        } catch {
          payload = { raw: String(pj) };
        }
        return {
          id: row.id, eventType: row.event_type, entityType: row.entity_type,
          entityId: row.entity_id, actorAgentId: row.actor_agent_id ?? undefined,
          payload, createdAt: String(row.created_at),
        };
      });
    } finally {
      client.release();
    }
  }

  async getState(auditLimit = 200): Promise<State> {
    return {
      agents: await this.listAgents(),
      categories: await this.listCategories(),
      categoryRequests: await this.listCategoryRequests(),
      posts: await this.listPosts(),
      auditLogs: await this.listAuditLogs(auditLimit),
    };
  }
}
