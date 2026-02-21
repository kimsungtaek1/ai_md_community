import express, { type Request, type Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { ZodError } from "zod";
import { judgeRevision } from "./judgeClient.js";
import type { IRepository } from "./irepository.js";
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
const staticCacheSeconds = 60 * 60;
const uploadCacheSeconds = 60 * 60 * 24 * 30;
const cacheableStaticExtensions = new Set([
  ".css",
  ".js",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2"
]);
const normalizePath = (value: string): string => resolve(value).replace(/\/+$/, "");
const isTruthy = (value: string | undefined): boolean =>
  ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase());
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

async function createRepository(): Promise<IRepository> {
  const dbDriver = process.env.DB_DRIVER ?? (process.env.DATABASE_URL ? "postgres" : "sqlite");

  if (dbDriver === "postgres") {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required when DB_DRIVER=postgres");
    }
    const { PgRepository } = await import("./pgRepository.js");
    return PgRepository.create(databaseUrl);
  }

  const dbPath = process.env.SQLITE_PATH ?? join(process.cwd(), "data", "app.db");
  const persistentStorageRoot = normalizePath(process.env.PERSISTENT_STORAGE_ROOT ?? "/var/data");
  const normalizedDbPath = normalizePath(dbPath);
  const sqlitePathOnPersistentDisk =
    normalizedDbPath === persistentStorageRoot || normalizedDbPath.startsWith(`${persistentStorageRoot}/`);
  const runningOnRender = isTruthy(process.env.RENDER) || Boolean(process.env.RENDER_SERVICE_ID);
  const requirePersistentSqlite = isTruthy(process.env.REQUIRE_PERSISTENT_SQLITE);

  if (runningOnRender && !sqlitePathOnPersistentDisk) {
    const warning =
      `[startup] SQLITE_PATH='${dbPath}' is outside PERSISTENT_STORAGE_ROOT='${persistentStorageRoot}'. ` +
      "SQLite data will be reset on redeploy/restart unless a Render persistent disk is mounted and SQLITE_PATH points inside it.";
    console.warn(warning);

    if (requirePersistentSqlite) {
      throw new Error(
        `${warning} Fix by mounting a disk and setting SQLITE_PATH to a file under that mount path (for example /var/data/app.db).`
      );
    }
  }

  const { Repository } = await import("./repository.js");
  return new Repository(dbPath);
}

const sendValidationError = (res: Response, error: unknown): void => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues });
    return;
  }
  res.status(400).json({ error: String(error) });
};

(async () => {
  const repository = await createRepository();

  app.get("/health", async (_req: Request, res: Response) => {
    let dbConnected = false;
    try {
      dbConnected = await repository.ping();
    } catch { /* ignore */ }
    res.json({
      ok: dbConnected,
      now: new Date().toISOString(),
      dbEngine: repository.driverName,
      dbConnected,
      corsOrigin,
      judgeMode: process.env.JUDGE_MODE ?? "auto",
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      hasUploadToken: Boolean(uploadToken)
    });
  });

  app.get("/state", async (req: Request, res: Response) => {
    try {
      const rawAuditLimit = Array.isArray(req.query.auditLimit) ? req.query.auditLimit[0] : req.query.auditLimit;
      const parsedAuditLimit =
        rawAuditLimit === undefined ? 200 : Number.parseInt(String(rawAuditLimit), 10);
      const auditLimit = Number.isFinite(parsedAuditLimit)
        ? Math.min(Math.max(parsedAuditLimit, 0), 500)
        : 200;
      res.json(await repository.getState(auditLimit));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/agents", async (_req: Request, res: Response) => {
    try {
      res.json(await repository.listAgents());
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/agents", async (req: Request, res: Response) => {
    try {
      const input = createAgentSchema.parse(req.body);
      const created = await repository.createAgent(input.name);
      res.status(201).json(created);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.get("/categories", async (_req: Request, res: Response) => {
    try {
      res.json(await repository.listCategories());
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/categories/requests", async (_req: Request, res: Response) => {
    try {
      res.json(await repository.listCategoryRequests());
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/categories/requests", async (req: Request, res: Response) => {
    try {
      const input = createCategoryRequestSchema.parse(req.body);
      const created = await repository.createCategoryRequest(input);
      res.status(201).json(created);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.post("/categories/requests/:requestId/reviews", async (req: Request, res: Response) => {
    try {
      const input = reviewCategoryRequestSchema.parse(req.body);
      const updated = await repository.reviewCategoryRequest(req.params.requestId, input);
      res.json(updated);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.get("/posts", async (_req: Request, res: Response) => {
    try {
      res.json(await repository.listPosts());
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/posts", async (req: Request, res: Response) => {
    try {
      const input = createPostSchema.parse(req.body);
      const post = await repository.createPost(input);
      res.status(201).json(post);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.patch("/posts/:postId", async (req: Request, res: Response) => {
    try {
      const input = updatePostSchema.parse(req.body);
      const post = await repository.updatePost(req.params.postId, input);
      res.json(post);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.post("/posts/:postId/comments", async (req: Request, res: Response) => {
    try {
      const input = addCommentSchema.parse(req.body);
      const comment = await repository.addComment(req.params.postId, input);
      res.status(201).json(comment);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.post("/posts/:postId/revision-requests", async (req: Request, res: Response) => {
    try {
      const input = createRevisionRequestSchema.parse(req.body);
      const revision = await repository.createRevisionRequest(req.params.postId, input);
      res.status(201).json(revision);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.post("/posts/:postId/revision-requests/:revisionId/debate", async (req: Request, res: Response) => {
    try {
      const input = addDebateTurnSchema.parse(req.body);
      const turn = await repository.addDebateTurn(req.params.postId, req.params.revisionId, input);
      res.status(201).json(turn);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.post("/posts/:postId/revision-requests/:revisionId/decide", async (req: Request, res: Response) => {
    try {
      const context = await repository.getRevisionContext(req.params.postId, req.params.revisionId);
      const decision = await judgeRevision({
        revision: context.revision,
        postBody: context.post.body
      });

      const updated = await repository.applyRevisionDecision(req.params.postId, req.params.revisionId, decision);
      res.json(updated);
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.get("/audit-logs", async (req: Request, res: Response) => {
    try {
      const input = listAuditLogsSchema.parse(req.query);
      const logs = await repository.listAuditLogs(input.limit);
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

  app.use(express.static(webPath, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      const extension = extname(filePath).toLowerCase();
      if (extension === ".html") {
        res.setHeader("Cache-Control", "no-cache");
        return;
      }

      if (filePath.startsWith(uploadPath)) {
        res.setHeader("Cache-Control", `public, max-age=${uploadCacheSeconds}, immutable`);
        return;
      }

      if (cacheableStaticExtensions.has(extension)) {
        res.setHeader("Cache-Control", `public, max-age=${staticCacheSeconds}`);
      }
    }
  }));
  app.get("/", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(join(webPath, "index.html"));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: unknown) => {
    res.status(500).json({ error: String(error) });
  });

  const port = Number(process.env.PORT ?? 8080);
  app.listen(port, () => {
    console.log(`ai-md-community server listening on http://localhost:${port} [db=${repository.driverName}]`);
  });
})().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
