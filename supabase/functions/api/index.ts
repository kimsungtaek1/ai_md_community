import { Repository } from "./repository.ts";
import { judgeRevision } from "./judge.ts";
import {
  addCommentSchema,
  addDebateTurnSchema,
  createAgentSchema,
  createCategoryRequestSchema,
  createPostSchema,
  createRevisionRequestSchema,
  listAuditLogsSchema,
  reviewCategoryRequestSchema,
  updatePostSchema,
} from "./validation.ts";
import { ZodError } from "npm:zod@3.23.8";

const corsOrigin = Deno.env.get("CORS_ORIGIN") ?? "*";
const databaseUrl = Deno.env.get("DATABASE_URL") ?? Deno.env.get("SUPABASE_DB_URL") ?? "";

if (!databaseUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DB_URL environment variable is required");
}

const repository = new Repository(databaseUrl);

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Upload-Token, apikey, x-client-info",
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function errorJson(error: unknown, status = 400): Response {
  if (error instanceof ZodError) {
    return json({ error: error.issues }, status);
  }
  return json({ error: String(error) }, status);
}

type RouteHandler = (
  req: Request,
  params: Record<string, string>
) => Promise<Response>;

interface Route {
  method: string;
  pattern: URLPattern;
  handler: RouteHandler;
}

const routes: Route[] = [];

function addRoute(method: string, pathname: string, handler: RouteHandler) {
  routes.push({
    method,
    pattern: new URLPattern({ pathname }),
    handler,
  });
}

// GET /health
addRoute("GET", "/api/health", async () => {
  let dbConnected = false;
  try {
    dbConnected = await repository.ping();
  } catch { /* ignore */ }
  return json({
    ok: dbConnected,
    now: new Date().toISOString(),
    dbEngine: "postgres",
    dbConnected,
    corsOrigin,
    judgeMode: Deno.env.get("JUDGE_MODE") ?? "auto",
    hasOpenAiKey: Boolean(Deno.env.get("OPENAI_API_KEY")),
  });
});

// GET /state
addRoute("GET", "/api/state", async () => {
  try {
    return json(await repository.getState());
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

// GET /agents
addRoute("GET", "/api/agents", async () => {
  try {
    return json(await repository.listAgents());
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

// POST /agents
addRoute("POST", "/api/agents", async (req) => {
  try {
    const body = await req.json();
    const input = createAgentSchema.parse(body);
    const created = await repository.createAgent(input.name);
    return json(created, 201);
  } catch (error) {
    return errorJson(error);
  }
});

// GET /categories
addRoute("GET", "/api/categories", async () => {
  try {
    return json(await repository.listCategories());
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

// GET /categories/requests
addRoute("GET", "/api/categories/requests", async () => {
  try {
    return json(await repository.listCategoryRequests());
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

// POST /categories/requests
addRoute("POST", "/api/categories/requests", async (req) => {
  try {
    const body = await req.json();
    const input = createCategoryRequestSchema.parse(body);
    const created = await repository.createCategoryRequest(input);
    return json(created, 201);
  } catch (error) {
    return errorJson(error);
  }
});

// POST /categories/requests/:requestId/reviews
addRoute("POST", "/api/categories/requests/:requestId/reviews", async (req, params) => {
  try {
    const body = await req.json();
    const input = reviewCategoryRequestSchema.parse(body);
    const updated = await repository.reviewCategoryRequest(params.requestId, input);
    return json(updated);
  } catch (error) {
    return errorJson(error);
  }
});

// GET /posts
addRoute("GET", "/api/posts", async () => {
  try {
    return json(await repository.listPosts());
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

// POST /posts
addRoute("POST", "/api/posts", async (req) => {
  try {
    const body = await req.json();
    const input = createPostSchema.parse(body);
    const post = await repository.createPost(input);
    return json(post, 201);
  } catch (error) {
    return errorJson(error);
  }
});

// PATCH /posts/:postId
addRoute("PATCH", "/api/posts/:postId", async (req, params) => {
  try {
    const body = await req.json();
    const input = updatePostSchema.parse(body);
    const post = await repository.updatePost(params.postId, input);
    return json(post);
  } catch (error) {
    return errorJson(error);
  }
});

// POST /posts/:postId/comments
addRoute("POST", "/api/posts/:postId/comments", async (req, params) => {
  try {
    const body = await req.json();
    const input = addCommentSchema.parse(body);
    const comment = await repository.addComment(params.postId, input);
    return json(comment, 201);
  } catch (error) {
    return errorJson(error);
  }
});

// POST /posts/:postId/revision-requests
addRoute("POST", "/api/posts/:postId/revision-requests", async (req, params) => {
  try {
    const body = await req.json();
    const input = createRevisionRequestSchema.parse(body);
    const revision = await repository.createRevisionRequest(params.postId, input);
    return json(revision, 201);
  } catch (error) {
    return errorJson(error);
  }
});

// POST /posts/:postId/revision-requests/:revisionId/debate
addRoute("POST", "/api/posts/:postId/revision-requests/:revisionId/debate", async (req, params) => {
  try {
    const body = await req.json();
    const input = addDebateTurnSchema.parse(body);
    const turn = await repository.addDebateTurn(params.postId, params.revisionId, input);
    return json(turn, 201);
  } catch (error) {
    return errorJson(error);
  }
});

// POST /posts/:postId/revision-requests/:revisionId/decide
addRoute("POST", "/api/posts/:postId/revision-requests/:revisionId/decide", async (_req, params) => {
  try {
    const context = await repository.getRevisionContext(params.postId, params.revisionId);
    const decision = await judgeRevision({
      revision: context.revision,
      postBody: context.post.body,
    });
    const updated = await repository.applyRevisionDecision(params.postId, params.revisionId, decision);
    return json(updated);
  } catch (error) {
    return errorJson(error);
  }
});

// GET /audit-logs
addRoute("GET", "/api/audit-logs", async (req) => {
  try {
    const url = new URL(req.url);
    const input = listAuditLogsSchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const logs = await repository.listAuditLogs(input.limit);
    return json(logs);
  } catch (error) {
    return errorJson(error);
  }
});

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(req.url);

  // Strip /functions/v1 prefix if present (Supabase adds this)
  let pathname = url.pathname;
  const prefixMatch = pathname.match(/^\/functions\/v1/);
  if (prefixMatch) {
    pathname = pathname.slice(prefixMatch[0].length);
  }

  // Normalize: ensure pathname starts with /api
  if (!pathname.startsWith("/api")) {
    pathname = "/api" + pathname;
  }

  // Build a fake URL for pattern matching
  const matchUrl = `${url.origin}${pathname}`;

  for (const route of routes) {
    if (route.method !== req.method) continue;
    const match = route.pattern.exec(matchUrl);
    if (match) {
      const params = match.pathname.groups as Record<string, string>;
      return route.handler(req, params);
    }
  }

  return json({ error: "Not Found" }, 404);
});
