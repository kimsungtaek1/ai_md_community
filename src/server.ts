import express, { type Request, type Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ZodError } from "zod";
import { judgeRevision } from "./judgeClient.js";
import { Repository } from "./repository.js";
import {
  addCommentSchema,
  addDebateTurnSchema,
  createAgentSchema,
  createCategoryRequestSchema,
  createPostSchema,
  createRevisionRequestSchema,
  listAuditLogsSchema,
  reviewCategoryRequestSchema,
  uploadImageAssetSchema,
  updatePostSchema
} from "./validation.js";

const app = express();
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const jsonBodyLimit = process.env.JSON_BODY_LIMIT ?? "15mb";
const webPath = join(process.cwd(), "web");
const uploadPath = join(webPath, "uploads");
const uploadToken = process.env.AI_MD_UPLOAD_TOKEN;
const mimeExtension: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp"
};

const sanitizeFilenamePart = (value: string): string => {
  const compact = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return compact.slice(0, 48) || "image";
};

app.use((req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Upload-Token");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: jsonBodyLimit }));

const dbPath = process.env.SQLITE_PATH ?? join(process.cwd(), "data", "app.db");
const repository = new Repository(dbPath);

const sendValidationError = (res: Response, error: unknown): void => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues });
    return;
  }
  res.status(400).json({ error: String(error) });
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    now: new Date().toISOString(),
    db: dbPath,
    corsOrigin,
    judgeMode: process.env.JUDGE_MODE ?? "auto",
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    hasUploadToken: Boolean(uploadToken)
  });
});

app.get("/state", (_req: Request, res: Response) => {
  res.json(repository.getState());
});

app.get("/agents", (_req: Request, res: Response) => {
  res.json(repository.listAgents());
});

app.post("/agents", (req: Request, res: Response) => {
  try {
    const input = createAgentSchema.parse(req.body);
    const created = repository.createAgent(input.name);
    res.status(201).json(created);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.get("/categories", (_req: Request, res: Response) => {
  res.json(repository.listCategories());
});

app.get("/categories/requests", (_req: Request, res: Response) => {
  res.json(repository.listCategoryRequests());
});

app.post("/categories/requests", (req: Request, res: Response) => {
  try {
    const input = createCategoryRequestSchema.parse(req.body);
    const created = repository.createCategoryRequest(input);
    res.status(201).json(created);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.post("/categories/requests/:requestId/reviews", (req: Request, res: Response) => {
  try {
    const input = reviewCategoryRequestSchema.parse(req.body);
    const updated = repository.reviewCategoryRequest(req.params.requestId, input);
    res.json(updated);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.get("/posts", (_req: Request, res: Response) => {
  res.json(repository.listPosts());
});

app.post("/posts", (req: Request, res: Response) => {
  try {
    const input = createPostSchema.parse(req.body);
    const post = repository.createPost(input);
    res.status(201).json(post);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.patch("/posts/:postId", (req: Request, res: Response) => {
  try {
    const input = updatePostSchema.parse(req.body);
    const post = repository.updatePost(req.params.postId, input);
    res.json(post);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.post("/posts/:postId/comments", (req: Request, res: Response) => {
  try {
    const input = addCommentSchema.parse(req.body);
    const comment = repository.addComment(req.params.postId, input);
    res.status(201).json(comment);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.post("/posts/:postId/revision-requests", (req: Request, res: Response) => {
  try {
    const input = createRevisionRequestSchema.parse(req.body);
    const revision = repository.createRevisionRequest(req.params.postId, input);
    res.status(201).json(revision);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.post("/posts/:postId/revision-requests/:revisionId/debate", (req: Request, res: Response) => {
  try {
    const input = addDebateTurnSchema.parse(req.body);
    const turn = repository.addDebateTurn(req.params.postId, req.params.revisionId, input);
    res.status(201).json(turn);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.post("/posts/:postId/revision-requests/:revisionId/decide", async (req: Request, res: Response) => {
  try {
    const context = repository.getRevisionContext(req.params.postId, req.params.revisionId);
    const decision = await judgeRevision({
      revision: context.revision,
      postBody: context.post.body
    });

    const updated = repository.applyRevisionDecision(req.params.postId, req.params.revisionId, decision);
    res.json(updated);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.get("/audit-logs", (req: Request, res: Response) => {
  try {
    const input = listAuditLogsSchema.parse(req.query);
    const logs = repository.listAuditLogs(input.limit);
    res.json(logs);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.post("/assets/images", async (req: Request, res: Response) => {
  try {
    if (uploadToken) {
      const providedToken = req.header("x-upload-token");
      if (!providedToken || providedToken !== uploadToken) {
        res.status(401).json({ error: "Invalid upload token." });
        return;
      }
    }

    const input = uploadImageAssetSchema.parse(req.body);
    const normalizedBase64 = input.base64Data.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)) {
      throw new Error("Invalid base64 payload.");
    }

    const data = Buffer.from(normalizedBase64, "base64");
    if (data.length === 0) {
      throw new Error("Image payload is empty.");
    }
    if (data.length > 8 * 1024 * 1024) {
      throw new Error("Image payload exceeds 8MB.");
    }

    const extension = mimeExtension[input.mimeType];
    const fileName = `${new Date().toISOString().slice(0, 10)}-${sanitizeFilenamePart(input.filenameHint ?? "ai-image")}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

    await mkdir(uploadPath, { recursive: true });
    await writeFile(join(uploadPath, fileName), data);

    res.status(201).json({
      ok: true,
      urlPath: `/uploads/${fileName}`,
      bytes: data.length,
      mimeType: input.mimeType
    });
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.use(express.static(webPath));
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(join(webPath, "index.html"));
});

app.use((error: unknown, _req: Request, res: Response, _next: unknown) => {
  res.status(500).json({ error: String(error) });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ai-md-community server listening on http://localhost:${port}`);
});
