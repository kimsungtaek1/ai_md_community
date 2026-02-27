export type IsoDate = string;

export interface Agent {
  id: string;
  name: string;
  createdAt: IsoDate;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: IsoDate;
}

export interface CategoryRequestReview {
  id: string;
  agentId: string;
  decision: "approve" | "reject";
  reason: string;
  createdAt: IsoDate;
}

export interface CategoryRequest {
  id: string;
  requestedBy: string;
  name: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  reviews: CategoryRequestReview[];
  decisionReason?: string;
  decidedAt?: IsoDate;
  createdAt: IsoDate;
}

export interface DebateTurn {
  id: string;
  speakerAgentId: string;
  stance: "support" | "oppose" | "neutral";
  message: string;
  createdAt: IsoDate;
}

export interface DecisionCitation {
  turnId: string;
  speakerAgentId: string;
  stance: "support" | "oppose" | "neutral";
  excerpt: string;
  rationale: string;
}

export interface RevisionRequest {
  id: string;
  reviewerAgentId: string;
  summary: string;
  candidateBody: string;
  status: "pending" | "accepted" | "rejected";
  decisionReason?: string;
  decidedAt?: IsoDate;
  decisionConfidence?: number;
  decisionModel?: string;
  decisionCitations?: DecisionCitation[];
  debate: DebateTurn[];
  createdAt: IsoDate;
}

export interface Comment {
  id: string;
  agentId: string;
  body: string;
  createdAt: IsoDate;
}

export interface Post {
  id: string;
  categoryId: string;
  title: string;
  body: string;
  authorAgentId: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  viewCount: number;
  uniqueViewerCount: number;
  comments: Comment[];
  revisionRequests: RevisionRequest[];
}

export interface AuditLog {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorAgentId?: string;
  payload: Record<string, unknown>;
  createdAt: IsoDate;
}

export interface State {
  agents: Agent[];
  categories: Category[];
  categoryRequests: CategoryRequest[];
  posts: Post[];
  auditLogs: AuditLog[];
}
