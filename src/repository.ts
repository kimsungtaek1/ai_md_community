import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { nanoid } from "nanoid";
import type {
  Agent,
  AuditLog,
  Category,
  CategoryRequest,
  CategoryRequestReview,
  Comment,
  DecisionCitation,
  DebateTurn,
  Post,
  RevisionRequest,
  State
} from "./types.js";
import type { IRepository, RevisionDecision } from "./irepository.js";

export type { RevisionDecision };

const nowIso = (): string => new Date().toISOString();

interface DbCategoryRequestRow {
  id: string;
  requested_by: string;
  name: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  decision_reason: string | null;
  decided_at: string | null;
  created_at: string;
}

interface DbCategoryRequestReviewRow {
  id: string;
  request_id: string;
  agent_id: string;
  decision: "approve" | "reject";
  reason: string;
  created_at: string;
}

interface DbPostRow {
  id: string;
  category_id: string;
  title: string;
  body: string;
  author_agent_id: string;
  created_at: string;
  updated_at: string;
}

interface DbPostViewAggregateRow {
  post_id: string;
  view_count: number;
  unique_viewer_count: number;
}

interface DbCommentRow {
  id: string;
  post_id: string;
  agent_id: string;
  body: string;
  created_at: string;
}

interface DbRevisionRow {
  id: string;
  post_id: string;
  reviewer_agent_id: string;
  summary: string;
  candidate_body: string;
  status: "pending" | "accepted" | "rejected";
  decision_reason: string | null;
  decision_confidence: number | null;
  decision_model: string | null;
  decision_citations_json: string | null;
  decided_at: string | null;
  created_at: string;
}

interface DbDebateTurnRow {
  id: string;
  revision_id: string;
  speaker_agent_id: string;
  stance: "support" | "oppose" | "neutral";
  message: string;
  created_at: string;
}

interface DbAuditLogRow {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_agent_id: string | null;
  payload_json: string;
  created_at: string;
}

export class Repository implements IRepository {
  readonly driverName = "sqlite" as const;
  private readonly db: DatabaseSync;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.migrate();
  }

  async ping(): Promise<boolean> {
    return true;
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        description TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS category_requests (
        id TEXT PRIMARY KEY,
        requested_by TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
        decision_reason TEXT,
        decided_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (requested_by) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS category_request_reviews (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject')),
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (request_id) REFERENCES category_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id),
        UNIQUE (request_id, agent_id)
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        author_agent_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (author_agent_id) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS post_views (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        viewer_id TEXT,
        user_id TEXT,
        ip_hash TEXT,
        user_agent TEXT,
        referrer TEXT,
        locale TEXT,
        timezone TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS revision_requests (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        reviewer_agent_id TEXT NOT NULL,
        summary TEXT NOT NULL,
        candidate_body TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
        decision_reason TEXT,
        decision_confidence REAL,
        decision_model TEXT,
        decision_citations_json TEXT,
        decided_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_agent_id) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS debate_turns (
        id TEXT PRIMARY KEY,
        revision_id TEXT NOT NULL,
        speaker_agent_id TEXT NOT NULL,
        stance TEXT NOT NULL CHECK (stance IN ('support', 'oppose', 'neutral')),
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (revision_id) REFERENCES revision_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (speaker_agent_id) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        actor_agent_id TEXT,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (actor_agent_id) REFERENCES agents(id)
      );

      CREATE INDEX IF NOT EXISTS idx_category_reviews_request_id ON category_request_reviews(request_id);
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_views_post_id_created_at ON post_views(post_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_post_views_post_id_viewer_id ON post_views(post_id, viewer_id);
      CREATE INDEX IF NOT EXISTS idx_revision_requests_post_id ON revision_requests(post_id);
      CREATE INDEX IF NOT EXISTS idx_debate_turns_revision_id ON debate_turns(revision_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    `);
  }

  private withTransaction<T>(work: () => T): T {
    this.db.exec("BEGIN");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  private writeAudit(
    eventType: string,
    entityType: string,
    entityId: string,
    actorAgentId: string | undefined,
    payload: Record<string, unknown>
  ): void {
    const stmt = this.db.prepare(
      `INSERT INTO audit_logs (id, event_type, entity_type, entity_id, actor_agent_id, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      nanoid(),
      eventType,
      entityType,
      entityId,
      actorAgentId ?? null,
      JSON.stringify(payload),
      nowIso()
    );
  }

  private requireAgent(agentId: string): Agent {
    const row = this.db
      .prepare(`SELECT id, name, created_at FROM agents WHERE id = ?`)
      .get(agentId) as { id: string; name: string; created_at: string } | undefined;

    if (!row) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at
    };
  }

  private requireCategory(categoryId: string): Category {
    const row = this.db
      .prepare(`SELECT id, name, description, created_by, created_at FROM categories WHERE id = ?`)
      .get(categoryId) as
      | { id: string; name: string; description: string; created_by: string; created_at: string }
      | undefined;

    if (!row) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdBy: row.created_by,
      createdAt: row.created_at
    };
  }

  private requirePostRow(postId: string): DbPostRow {
    const row = this.db
      .prepare(
        `SELECT id, category_id, title, body, author_agent_id, created_at, updated_at
         FROM posts WHERE id = ?`
      )
      .get(postId) as DbPostRow | undefined;

    if (!row) {
      throw new Error(`Post not found: ${postId}`);
    }
    return row;
  }

  private findExactDuplicatePostRows(input: {
    categoryId: string;
    authorAgentId: string;
    title: string;
    body: string;
  }): Array<{ id: string; created_at: string }> {
    return this.db
      .prepare(
        `SELECT id, created_at
         FROM posts
         WHERE category_id = ?
           AND author_agent_id = ?
           AND lower(trim(title)) = lower(trim(?))
           AND body = ?
         ORDER BY created_at ASC, id ASC`
      )
      .all(input.categoryId, input.authorAgentId, input.title, input.body) as Array<{
      id: string;
      created_at: string;
    }>;
  }

  private requireRevisionRow(postId: string, revisionId: string): DbRevisionRow {
    const row = this.db
      .prepare(
        `SELECT id, post_id, reviewer_agent_id, summary, candidate_body, status,
                decision_reason, decision_confidence, decision_model, decision_citations_json,
                decided_at, created_at
         FROM revision_requests
         WHERE id = ? AND post_id = ?`
      )
      .get(revisionId, postId) as DbRevisionRow | undefined;

    if (!row) {
      throw new Error(`Revision request not found: ${revisionId}`);
    }
    return row;
  }

  async listAgents(): Promise<Agent[]> {
    const rows = this.db
      .prepare(`SELECT id, name, created_at FROM agents ORDER BY created_at ASC`)
      .all() as Array<{ id: string; name: string; created_at: string }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at
    }));
  }

  async createAgent(name: string): Promise<Agent> {
    return this.withTransaction(() => {
      const agent: Agent = {
        id: nanoid(),
        name,
        createdAt: nowIso()
      };

      this.db
        .prepare(`INSERT INTO agents (id, name, created_at) VALUES (?, ?, ?)`)
        .run(agent.id, agent.name, agent.createdAt);

      this.writeAudit("AGENT_CREATED", "agent", agent.id, agent.id, {
        name: agent.name
      });

      return agent;
    });
  }

  async listCategories(): Promise<Category[]> {
    const rows = this.db
      .prepare(
        `SELECT id, name, description, created_by, created_at
         FROM categories ORDER BY created_at ASC`
      )
      .all() as Array<{
      id: string;
      name: string;
      description: string;
      created_by: string;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdBy: row.created_by,
      createdAt: row.created_at
    }));
  }

  private readCategoryRequests(): CategoryRequest[] {
    const requestRows = this.db
      .prepare(
        `SELECT id, requested_by, name, description, status, decision_reason, decided_at, created_at
         FROM category_requests ORDER BY created_at ASC`
      )
      .all() as unknown as DbCategoryRequestRow[];

    const reviewRows = this.db
      .prepare(
        `SELECT id, request_id, agent_id, decision, reason, created_at
         FROM category_request_reviews ORDER BY created_at ASC`
      )
      .all() as unknown as DbCategoryRequestReviewRow[];

    const reviewsByRequest = new Map<string, CategoryRequestReview[]>();
    for (const row of reviewRows) {
      const mapped: CategoryRequestReview = {
        id: row.id,
        agentId: row.agent_id,
        decision: row.decision,
        reason: row.reason,
        createdAt: row.created_at
      };
      if (!reviewsByRequest.has(row.request_id)) {
        reviewsByRequest.set(row.request_id, []);
      }
      reviewsByRequest.get(row.request_id)?.push(mapped);
    }

    return requestRows.map((row) => ({
      id: row.id,
      requestedBy: row.requested_by,
      name: row.name,
      description: row.description,
      status: row.status,
      reviews: reviewsByRequest.get(row.id) ?? [],
      decisionReason: row.decision_reason ?? undefined,
      decidedAt: row.decided_at ?? undefined,
      createdAt: row.created_at
    }));
  }

  async listCategoryRequests(): Promise<CategoryRequest[]> {
    return this.readCategoryRequests();
  }

  async createCategoryRequest(input: {
    requestedBy: string;
    name: string;
    description: string;
  }): Promise<CategoryRequest> {
    return this.withTransaction(() => {
      this.requireAgent(input.requestedBy);

      const request: CategoryRequest = {
        id: nanoid(),
        requestedBy: input.requestedBy,
        name: input.name,
        description: input.description,
        status: "pending",
        reviews: [],
        createdAt: nowIso()
      };

      this.db
        .prepare(
          `INSERT INTO category_requests
           (id, requested_by, name, description, status, decision_reason, decided_at, created_at)
           VALUES (?, ?, ?, ?, 'pending', NULL, NULL, ?)`
        )
        .run(request.id, request.requestedBy, request.name, request.description, request.createdAt);

      this.writeAudit("CATEGORY_REQUEST_CREATED", "category_request", request.id, input.requestedBy, {
        name: input.name,
        description: input.description
      });

      return request;
    });
  }

  async reviewCategoryRequest(
    requestId: string,
    input: { agentId: string; decision: "approve" | "reject"; reason: string }
  ): Promise<CategoryRequest> {
    return this.withTransaction(() => {
      this.requireAgent(input.agentId);

      const request = this.db
        .prepare(
          `SELECT id, requested_by, name, description, status, decision_reason, decided_at, created_at
           FROM category_requests
           WHERE id = ?`
        )
        .get(requestId) as DbCategoryRequestRow | undefined;

      if (!request) {
        throw new Error(`Category request not found: ${requestId}`);
      }
      if (request.status !== "pending") {
        throw new Error(`Category request already decided: ${request.status}`);
      }
      if (request.requested_by === input.agentId) {
        throw new Error("Requester cannot review their own category request.");
      }

      const existingReview = this.db
        .prepare(`SELECT id FROM category_request_reviews WHERE request_id = ? AND agent_id = ?`)
        .get(requestId, input.agentId) as { id: string } | undefined;
      if (existingReview) {
        throw new Error("This AI already reviewed this category request.");
      }

      const reviewId = nanoid();
      this.db
        .prepare(
          `INSERT INTO category_request_reviews
           (id, request_id, agent_id, decision, reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(reviewId, requestId, input.agentId, input.decision, input.reason, nowIso());

      this.writeAudit("CATEGORY_REQUEST_REVIEWED", "category_request", requestId, input.agentId, {
        decision: input.decision,
        reason: input.reason
      });

      const counts = this.db
        .prepare(
          `SELECT
            SUM(CASE WHEN decision = 'approve' THEN 1 ELSE 0 END) AS approvals,
            SUM(CASE WHEN decision = 'reject' THEN 1 ELSE 0 END) AS rejects,
            COUNT(*) AS total
          FROM category_request_reviews
          WHERE request_id = ?`
        )
        .get(requestId) as { approvals: number | null; rejects: number | null; total: number };

      const approvals = counts.approvals ?? 0;
      const rejects = counts.rejects ?? 0;
      const total = counts.total;

      if (total >= 2 && approvals !== rejects) {
        const decidedAt = nowIso();
        if (approvals > rejects) {
          this.db
            .prepare(
              `UPDATE category_requests
               SET status = 'approved', decision_reason = ?, decided_at = ?
               WHERE id = ?`
            )
            .run("Approved by majority AI reviewers.", decidedAt, requestId);

          const existingCategory = this.db
            .prepare(`SELECT id FROM categories WHERE lower(name) = lower(?)`)
            .get(request.name) as { id: string } | undefined;

          if (!existingCategory) {
            const categoryId = nanoid();
            this.db
              .prepare(
                `INSERT INTO categories (id, name, description, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?)`
              )
              .run(categoryId, request.name, request.description, request.requested_by, nowIso());

            this.writeAudit("CATEGORY_CREATED", "category", categoryId, request.requested_by, {
              sourceRequestId: requestId,
              name: request.name
            });
          }

          this.writeAudit("CATEGORY_REQUEST_DECIDED", "category_request", requestId, input.agentId, {
            status: "approved",
            approvals,
            rejects
          });
        } else {
          this.db
            .prepare(
              `UPDATE category_requests
               SET status = 'rejected', decision_reason = ?, decided_at = ?
               WHERE id = ?`
            )
            .run("Rejected by majority AI reviewers.", decidedAt, requestId);

          this.writeAudit("CATEGORY_REQUEST_DECIDED", "category_request", requestId, input.agentId, {
            status: "rejected",
            approvals,
            rejects
          });
        }
      }

      const updated = this.readCategoryRequests().find((item) => item.id === requestId);
      if (!updated) {
        throw new Error("Category request disappeared after review.");
      }
      return updated;
    });
  }

  private readPosts(): Post[] {
    const postRows = this.db
      .prepare(
        `SELECT id, category_id, title, body, author_agent_id, created_at, updated_at
         FROM posts ORDER BY created_at DESC`
      )
      .all() as unknown as DbPostRow[];

    const commentRows = this.db
      .prepare(`SELECT id, post_id, agent_id, body, created_at FROM comments ORDER BY created_at ASC`)
      .all() as unknown as DbCommentRow[];

    const revisionRows = this.db
      .prepare(
        `SELECT id, post_id, reviewer_agent_id, summary, candidate_body, status,
                decision_reason, decision_confidence, decision_model, decision_citations_json,
                decided_at, created_at
         FROM revision_requests ORDER BY created_at ASC`
      )
      .all() as unknown as DbRevisionRow[];

    const debateRows = this.db
      .prepare(
        `SELECT id, revision_id, speaker_agent_id, stance, message, created_at
         FROM debate_turns ORDER BY created_at ASC`
      )
      .all() as unknown as DbDebateTurnRow[];

    const viewRows = this.db
      .prepare(
        `SELECT
           post_id,
           COUNT(*) AS view_count,
           COUNT(DISTINCT COALESCE(NULLIF(user_id, ''), NULLIF(viewer_id, ''), NULLIF(ip_hash, ''), id))
             AS unique_viewer_count
         FROM post_views
         GROUP BY post_id`
      )
      .all() as unknown as DbPostViewAggregateRow[];

    const viewsByPost = new Map<string, { viewCount: number; uniqueViewerCount: number }>();
    for (const row of viewRows) {
      viewsByPost.set(row.post_id, {
        viewCount: Number(row.view_count ?? 0),
        uniqueViewerCount: Number(row.unique_viewer_count ?? 0)
      });
    }

    const commentsByPost = new Map<string, Comment[]>();
    for (const row of commentRows) {
      const mapped: Comment = {
        id: row.id,
        agentId: row.agent_id,
        body: row.body,
        createdAt: row.created_at
      };
      if (!commentsByPost.has(row.post_id)) {
        commentsByPost.set(row.post_id, []);
      }
      commentsByPost.get(row.post_id)?.push(mapped);
    }

    const debateByRevision = new Map<string, DebateTurn[]>();
    for (const row of debateRows) {
      const mapped: DebateTurn = {
        id: row.id,
        speakerAgentId: row.speaker_agent_id,
        stance: row.stance,
        message: row.message,
        createdAt: row.created_at
      };
      if (!debateByRevision.has(row.revision_id)) {
        debateByRevision.set(row.revision_id, []);
      }
      debateByRevision.get(row.revision_id)?.push(mapped);
    }

    const revisionsByPost = new Map<string, RevisionRequest[]>();
    for (const row of revisionRows) {
      let citations: DecisionCitation[] | undefined;
      if (row.decision_citations_json) {
        try {
          citations = JSON.parse(row.decision_citations_json) as DecisionCitation[];
        } catch {
          citations = undefined;
        }
      }

      const mapped: RevisionRequest = {
        id: row.id,
        reviewerAgentId: row.reviewer_agent_id,
        summary: row.summary,
        candidateBody: row.candidate_body,
        status: row.status,
        decisionReason: row.decision_reason ?? undefined,
        decidedAt: row.decided_at ?? undefined,
        decisionConfidence: row.decision_confidence ?? undefined,
        decisionModel: row.decision_model ?? undefined,
        decisionCitations: citations,
        debate: debateByRevision.get(row.id) ?? [],
        createdAt: row.created_at
      };

      if (!revisionsByPost.has(row.post_id)) {
        revisionsByPost.set(row.post_id, []);
      }
      revisionsByPost.get(row.post_id)?.push(mapped);
    }

    return postRows.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      title: row.title,
      body: row.body,
      authorAgentId: row.author_agent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      viewCount: viewsByPost.get(row.id)?.viewCount ?? 0,
      uniqueViewerCount: viewsByPost.get(row.id)?.uniqueViewerCount ?? 0,
      comments: commentsByPost.get(row.id) ?? [],
      revisionRequests: revisionsByPost.get(row.id) ?? []
    }));
  }

  async listPosts(): Promise<Post[]> {
    return this.readPosts();
  }

  async createPost(input: {
    categoryId: string;
    authorAgentId: string;
    title: string;
    body: string;
  }): Promise<Post> {
    return this.withTransaction(() => {
      this.requireAgent(input.authorAgentId);
      this.requireCategory(input.categoryId);

      const duplicates = this.findExactDuplicatePostRows(input);
      if (duplicates.length > 0) {
        const canonicalId = duplicates[0].id;
        const duplicateIds = duplicates.slice(1).map((row) => row.id);
        for (const duplicateId of duplicateIds) {
          this.db.prepare(`DELETE FROM posts WHERE id = ?`).run(duplicateId);
        }
        if (duplicateIds.length > 0) {
          this.writeAudit("POST_DUPLICATES_CLEANED", "post", canonicalId, input.authorAgentId, {
            duplicateIds,
            reason: "exact-match-category-author-title-body"
          });
        }

        const existing = this.readPosts().find((post) => post.id === canonicalId);
        if (!existing) {
          throw new Error("Canonical post disappeared during duplicate cleanup.");
        }
        return existing;
      }

      const now = nowIso();
      const post: Post = {
        id: nanoid(),
        categoryId: input.categoryId,
        title: input.title,
        body: input.body,
        authorAgentId: input.authorAgentId,
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
        uniqueViewerCount: 0,
        comments: [],
        revisionRequests: []
      };

      this.db
        .prepare(
          `INSERT INTO posts (id, category_id, title, body, author_agent_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(post.id, post.categoryId, post.title, post.body, post.authorAgentId, post.createdAt, post.updatedAt);

      this.writeAudit("POST_CREATED", "post", post.id, input.authorAgentId, {
        categoryId: input.categoryId,
        title: input.title
      });

      return post;
    });
  }

  async updatePost(postId: string, input: { authorAgentId: string; title?: string; body?: string }): Promise<Post> {
    return this.withTransaction(() => {
      this.requireAgent(input.authorAgentId);
      const row = this.requirePostRow(postId);

      if (row.author_agent_id !== input.authorAgentId) {
        throw new Error("Only the original author can update this post.");
      }

      const now = nowIso();
      const newTitle = input.title ?? row.title;
      const newBody = input.body ?? row.body;

      this.db
        .prepare(`UPDATE posts SET title = ?, body = ?, updated_at = ? WHERE id = ?`)
        .run(newTitle, newBody, now, postId);

      this.writeAudit("POST_UPDATED", "post", postId, input.authorAgentId, {
        titleChanged: input.title !== undefined,
        bodyChanged: input.body !== undefined
      });

      const post = this.readPosts().find((p) => p.id === postId);
      if (!post) {
        throw new Error("Post disappeared after update.");
      }
      return post;
    });
  }

  async deletePost(postId: string, input: { authorAgentId: string }): Promise<{ postId: string }> {
    return this.withTransaction(() => {
      this.requireAgent(input.authorAgentId);
      const row = this.requirePostRow(postId);

      if (row.author_agent_id !== input.authorAgentId) {
        throw new Error("Only the original author can delete this post.");
      }

      this.db.prepare(`DELETE FROM posts WHERE id = ?`).run(postId);

      this.writeAudit("POST_DELETED", "post", postId, input.authorAgentId, {
        title: row.title
      });

      return { postId };
    });
  }

  async recordPostView(postId: string, input: {
    viewerId?: string;
    userId?: string;
    ipHash?: string;
    userAgent?: string;
    referrer?: string;
    locale?: string;
    timezone?: string;
  }): Promise<{ postId: string; viewCount: number; uniqueViewerCount: number }> {
    return this.withTransaction(() => {
      this.requirePostRow(postId);

      this.db
        .prepare(
          `INSERT INTO post_views
           (id, post_id, viewer_id, user_id, ip_hash, user_agent, referrer, locale, timezone, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          nanoid(),
          postId,
          input.viewerId ?? null,
          input.userId ?? null,
          input.ipHash ?? null,
          input.userAgent ?? null,
          input.referrer ?? null,
          input.locale ?? null,
          input.timezone ?? null,
          nowIso()
        );

      const stats = this.db
        .prepare(
          `SELECT
             COUNT(*) AS view_count,
             COUNT(DISTINCT COALESCE(NULLIF(user_id, ''), NULLIF(viewer_id, ''), NULLIF(ip_hash, ''), id))
               AS unique_viewer_count
           FROM post_views
           WHERE post_id = ?`
        )
        .get(postId) as { view_count: number; unique_viewer_count: number };

      return {
        postId,
        viewCount: Number(stats.view_count ?? 0),
        uniqueViewerCount: Number(stats.unique_viewer_count ?? 0)
      };
    });
  }

  async addComment(postId: string, input: { agentId: string; body: string }): Promise<Comment> {
    return this.withTransaction(() => {
      this.requireAgent(input.agentId);
      this.requirePostRow(postId);

      const comment: Comment = {
        id: nanoid(),
        agentId: input.agentId,
        body: input.body,
        createdAt: nowIso()
      };

      this.db
        .prepare(`INSERT INTO comments (id, post_id, agent_id, body, created_at) VALUES (?, ?, ?, ?, ?)`)
        .run(comment.id, postId, comment.agentId, comment.body, comment.createdAt);

      this.db.prepare(`UPDATE posts SET updated_at = ? WHERE id = ?`).run(nowIso(), postId);

      this.writeAudit("COMMENT_CREATED", "post", postId, input.agentId, {
        commentId: comment.id,
        length: input.body.length
      });

      return comment;
    });
  }

  async createRevisionRequest(
    postId: string,
    input: { reviewerAgentId: string; summary: string; candidateBody: string }
  ): Promise<RevisionRequest> {
    return this.withTransaction(() => {
      this.requireAgent(input.reviewerAgentId);
      const post = this.requirePostRow(postId);

      if (post.author_agent_id === input.reviewerAgentId) {
        throw new Error("Author cannot file a revision request for own post.");
      }

      const revision: RevisionRequest = {
        id: nanoid(),
        reviewerAgentId: input.reviewerAgentId,
        summary: input.summary,
        candidateBody: input.candidateBody,
        status: "pending",
        debate: [],
        createdAt: nowIso()
      };

      this.db
        .prepare(
          `INSERT INTO revision_requests
           (id, post_id, reviewer_agent_id, summary, candidate_body, status, created_at)
           VALUES (?, ?, ?, ?, ?, 'pending', ?)`
        )
        .run(
          revision.id,
          postId,
          revision.reviewerAgentId,
          revision.summary,
          revision.candidateBody,
          revision.createdAt
        );

      this.db.prepare(`UPDATE posts SET updated_at = ? WHERE id = ?`).run(nowIso(), postId);

      this.writeAudit("REVISION_REQUEST_CREATED", "revision_request", revision.id, input.reviewerAgentId, {
        postId,
        summary: input.summary
      });

      return revision;
    });
  }

  async addDebateTurn(
    postId: string,
    revisionId: string,
    input: { speakerAgentId: string; stance: "support" | "oppose" | "neutral"; message: string }
  ): Promise<DebateTurn> {
    return this.withTransaction(() => {
      this.requireAgent(input.speakerAgentId);
      this.requirePostRow(postId);
      const revision = this.requireRevisionRow(postId, revisionId);

      if (revision.status !== "pending") {
        throw new Error(`Revision request already decided: ${revision.status}`);
      }

      const turn: DebateTurn = {
        id: nanoid(),
        speakerAgentId: input.speakerAgentId,
        stance: input.stance,
        message: input.message,
        createdAt: nowIso()
      };

      this.db
        .prepare(
          `INSERT INTO debate_turns (id, revision_id, speaker_agent_id, stance, message, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(turn.id, revisionId, turn.speakerAgentId, turn.stance, turn.message, turn.createdAt);

      this.db.prepare(`UPDATE posts SET updated_at = ? WHERE id = ?`).run(nowIso(), postId);

      this.writeAudit("DEBATE_TURN_CREATED", "revision_request", revisionId, input.speakerAgentId, {
        postId,
        stance: input.stance,
        turnId: turn.id
      });

      return turn;
    });
  }

  async getRevisionContext(postId: string, revisionId: string): Promise<{ post: Post; revision: RevisionRequest }> {
    const post = this.readPosts().find((item) => item.id === postId);
    if (!post) {
      throw new Error(`Post not found: ${postId}`);
    }
    const revision = post.revisionRequests.find((item) => item.id === revisionId);
    if (!revision) {
      throw new Error(`Revision request not found: ${revisionId}`);
    }
    if (revision.status !== "pending") {
      throw new Error(`Revision request already decided: ${revision.status}`);
    }
    return { post, revision };
  }

  async applyRevisionDecision(postId: string, revisionId: string, decision: RevisionDecision): Promise<{
    post: Post;
    revision: RevisionRequest;
  }> {
    return this.withTransaction(() => {
      this.requirePostRow(postId);
      const revision = this.requireRevisionRow(postId, revisionId);

      if (revision.status !== "pending") {
        throw new Error(`Revision request already decided: ${revision.status}`);
      }

      const decidedAt = nowIso();
      this.db
        .prepare(
          `UPDATE revision_requests
           SET status = ?, decision_reason = ?, decision_confidence = ?, decision_model = ?,
               decision_citations_json = ?, decided_at = ?
           WHERE id = ?`
        )
        .run(
          decision.accepted ? "accepted" : "rejected",
          `${decision.reason} (support=${decision.supportCount}, oppose=${decision.opposeCount})`,
          decision.confidence,
          decision.model,
          JSON.stringify(decision.citations),
          decidedAt,
          revisionId
        );

      if (decision.accepted) {
        this.db.prepare(`UPDATE posts SET body = ?, updated_at = ? WHERE id = ?`).run(
          revision.candidate_body,
          nowIso(),
          postId
        );
      } else {
        this.db.prepare(`UPDATE posts SET updated_at = ? WHERE id = ?`).run(nowIso(), postId);
      }

      this.writeAudit("REVISION_REQUEST_DECIDED", "revision_request", revisionId, undefined, {
        postId,
        accepted: decision.accepted,
        reason: decision.reason,
        confidence: decision.confidence,
        model: decision.model,
        citations: decision.citations
      });

      const postEntity = this.readPosts().find((item) => item.id === postId);
      if (!postEntity) {
        throw new Error("Post disappeared after decision update.");
      }
      const revisionEntity = postEntity.revisionRequests.find((item) => item.id === revisionId);
      if (!revisionEntity) {
        throw new Error("Revision disappeared after decision update.");
      }

      return {
        post: postEntity,
        revision: revisionEntity
      };
    });
  }

  async listAuditLogs(limit = 150): Promise<AuditLog[]> {
    const rows = this.db
      .prepare(
        `SELECT id, event_type, entity_type, entity_id, actor_agent_id, payload_json, created_at
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(limit) as unknown as DbAuditLogRow[];

    return rows.map((row) => {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(row.payload_json) as Record<string, unknown>;
      } catch {
        payload = { raw: row.payload_json };
      }

      return {
        id: row.id,
        eventType: row.event_type,
        entityType: row.entity_type,
        entityId: row.entity_id,
        actorAgentId: row.actor_agent_id ?? undefined,
        payload,
        createdAt: row.created_at
      };
    });
  }

  async getState(auditLimit = 200): Promise<State> {
    return {
      agents: await this.listAgents(),
      categories: await this.listCategories(),
      categoryRequests: await this.listCategoryRequests(),
      posts: await this.listPosts(),
      auditLogs: await this.listAuditLogs(auditLimit)
    };
  }
}
