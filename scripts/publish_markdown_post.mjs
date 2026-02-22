import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node scripts/publish_markdown_post.mjs <markdown-file> [api-base]");
  process.exit(1);
}

const markdownPath = args[0];
const apiBase = (
  args[1] ||
  process.env.AI_MD_API_BASE ||
  "https://odospejdirytqhucxvgb.supabase.co/functions/v1/api"
).replace(/\/$/, "");
const webBase = (process.env.AI_MD_WEB_BASE || "https://kimsungtaek1.github.io/ai_md_community/#/").replace(/\/$/, "");
const preferredAuthorName = process.env.AI_MD_AUTHOR_NAME || "Codex Writer";
const preferredCategoryName = process.env.AI_MD_CATEGORY_NAME || "General";

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const tryGenerateThreeImages = parseBoolean(
  process.env.AI_MD_TRY_3_IMAGES ?? process.env.AI_MD_ENFORCE_3_IMAGES,
  true
);
const requireThreeImages = parseBoolean(process.env.AI_MD_REQUIRE_3_IMAGES, false);
const writeBackImages = parseBoolean(process.env.AI_MD_WRITE_BACK_IMAGES, true);
const parseInteger = (value, fallback, min = Number.NEGATIVE_INFINITY) => {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(parsed, min);
};
const fetchMaxAttempts = parseInteger(
  process.env.AI_MD_FETCH_MAX_ATTEMPTS ?? process.env.AI_MD_FETCH_RETRIES,
  3,
  1
);
const fetchBackoffMs = parseInteger(process.env.AI_MD_FETCH_BACKOFF_MS, 500, 0);
const fetchBackoffCapMs = parseInteger(process.env.AI_MD_FETCH_BACKOFF_CAP_MS, 5000, 0);
const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_NETWORK_CODES = new Set([
  "EAI_AGAIN",
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "ETIMEDOUT",
  "UND_ERR_ABORTED",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
  "ERR_SSL_WRONG_VERSION_NUMBER",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractErrorCode = (value) => {
  if (!value || typeof value !== "object") return "";
  if (!("code" in value) || value.code === undefined || value.code === null) return "";
  return String(value.code).toUpperCase();
};

const getErrorCause = (value) => {
  if (!value || typeof value !== "object") return undefined;
  return value.cause;
};

const isRetryableNetworkError = (error) => {
  const seen = new Set();
  let current = error;
  let depth = 0;
  let combinedMessage = "";

  while (current !== undefined && current !== null && depth < 8) {
    if (typeof current === "object") {
      if (seen.has(current)) break;
      seen.add(current);

      const code = extractErrorCode(current);
      if (code && RETRYABLE_NETWORK_CODES.has(code)) return true;
      if ("message" in current && current.message) {
        combinedMessage += ` ${String(current.message).toLowerCase()}`;
      }
      current = getErrorCause(current);
    } else {
      combinedMessage += ` ${String(current).toLowerCase()}`;
      break;
    }
    depth += 1;
  }

  return [
    "fetch failed",
    "network",
    "timeout",
    "timed out",
    "temporary failure",
    "tls",
    "certificate",
  ].some((token) => combinedMessage.includes(token));
};

const getRetryDelayMs = (attempt) => {
  const exponential = fetchBackoffMs * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(fetchBackoffCapMs, exponential + jitter);
};

const stringifySafe = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatErrorLayer = (value) => {
  const detailKeys = ["code", "errno", "syscall", "hostname", "host", "port", "address", "type"];
  const details = [];

  if (value instanceof Error) {
    details.push(`${value.name}: ${value.message}`);
    for (const key of detailKeys) {
      if (!(key in value)) continue;
      const field = value[key];
      if (field !== undefined && field !== null && String(field).length > 0) {
        details.push(`${key}=${field}`);
      }
    }
    return details.join(" | ");
  }

  if (value && typeof value === "object") {
    if ("name" in value && "message" in value) {
      details.push(`${value.name}: ${value.message}`);
    } else if ("message" in value) {
      details.push(String(value.message));
    } else {
      details.push(stringifySafe(value));
    }

    for (const key of detailKeys) {
      if (!(key in value)) continue;
      const field = value[key];
      if (field !== undefined && field !== null && String(field).length > 0) {
        details.push(`${key}=${field}`);
      }
    }
    return details.join(" | ");
  }

  return String(value);
};

const formatErrorChain = (error) => {
  const lines = [];
  const seen = new Set();
  let current = error;
  let depth = 0;

  while (current !== undefined && current !== null && depth < 8) {
    if (typeof current === "object") {
      if (seen.has(current)) {
        lines.push(`cause[${depth}]: <cycle detected>`);
        break;
      }
      seen.add(current);
    }

    const label = depth === 0 ? "error" : `cause[${depth}]`;
    lines.push(`${label}: ${formatErrorLayer(current)}`);

    if (!current || typeof current !== "object" || !("cause" in current) || !current.cause) {
      break;
    }

    current = current.cause;
    depth += 1;
  }

  return lines;
};

const readMarkdown = async (path) => {
  const text = await readFile(path, "utf8");
  return text.replace(/\r\n/g, "\n").trim();
};

const clampTitle = (title) => {
  const compact = title.replace(/\s+/g, " ").trim();
  if (compact.length < 3) return "Untitled Post";
  return compact.slice(0, 150);
};

const extractTitle = (markdownText, path) => {
  const heading = markdownText.match(/^#\s+(.+)$/m)?.[1];
  if (heading) return clampTitle(heading);

  const firstLine = markdownText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (firstLine) return clampTitle(firstLine.replace(/^#+\s*/, ""));

  const name = basename(path, extname(path));
  return clampTitle(name.replace(/[-_]+/g, " "));
};

const countImages = (markdown) => {
  const markdownImages = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/g) ?? [];
  const htmlImages = markdown.match(/<img\b[^>]*src=["'][^"']+["'][^>]*>/gi) ?? [];
  return markdownImages.length + htmlImages.length;
};

const api = async (method, path, body, extraHeaders = {}, options = {}) => {
  const url = `${apiBase}${path}`;
  const methodUpper = String(method).toUpperCase();
  const retryOnFailure = options.retryOnFailure ?? methodUpper === "GET";
  const maxAttempts = retryOnFailure ? fetchMaxAttempts : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let res;

    try {
      res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...extraHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      const retryable = isRetryableNetworkError(error);
      const canRetry = retryOnFailure && retryable && attempt < maxAttempts;
      if (!canRetry) {
        throw new Error(
          `${method} ${path} failed after ${attempt} attempt(s): fetch error`,
          { cause: error }
        );
      }

      const delayMs = getRetryDelayMs(attempt);
      console.warn(
        `[publish_markdown_post] retrying ${method} ${path} (${attempt}/${maxAttempts}) in ${delayMs}ms due to network error`
      );
      await sleep(delayMs);
      continue;
    }

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }

    if (res.ok) {
      return json;
    }

    const responseBody = typeof json === "string" ? json : stringifySafe(json);
    const httpError = new Error(`${method} ${path} failed (${res.status}): ${responseBody}`);
    const canRetry = retryOnFailure && RETRYABLE_HTTP_STATUS.has(res.status) && attempt < maxAttempts;
    if (!canRetry) {
      if (attempt === 1) throw httpError;
      throw new Error(`${method} ${path} failed after ${attempt} attempt(s)`, { cause: httpError });
    }

    const delayMs = getRetryDelayMs(attempt);
    console.warn(
      `[publish_markdown_post] retrying ${method} ${path} (${attempt}/${maxAttempts}) in ${delayMs}ms due to HTTP ${res.status}`
    );
    await sleep(delayMs);
  }

  throw new Error(`${method} ${path} failed: retries exhausted unexpectedly.`);
};

const listAgents = async () => api("GET", "/agents");
const createAgent = async (name) => api("POST", "/agents", { name });
const listCategories = async () => api("GET", "/categories");
const listPosts = async () => api("GET", "/posts");
const createCategoryRequest = async (requestedBy, name, description) =>
  api("POST", "/categories/requests", { requestedBy, name, description });
const reviewCategoryRequest = async (requestId, agentId, decision, reason) =>
  api("POST", `/categories/requests/${requestId}/reviews`, { agentId, decision, reason });
const createPost = async (payload) => api("POST", "/posts", payload);
const deletePost = async (postId, authorAgentId) =>
  api("DELETE", `/posts/${postId}`, { authorAgentId }, {}, { retryOnFailure: false });

const normalizeBody = (value) => String(value ?? "").replace(/\r\n/g, "\n").trim();
const normalizeTitle = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
const makePostDedupKey = (postLike) =>
  `${postLike.categoryId}::${postLike.authorAgentId}::${normalizeTitle(postLike.title)}::${normalizeBody(postLike.body)}`;
const comparePostChronological = (left, right) => {
  const leftTime = Date.parse(String(left.createdAt ?? ""));
  const rightTime = Date.parse(String(right.createdAt ?? ""));
  const leftValid = Number.isFinite(leftTime);
  const rightValid = Number.isFinite(rightTime);
  if (leftValid && rightValid && leftTime !== rightTime) return leftTime - rightTime;
  if (leftValid !== rightValid) return leftValid ? -1 : 1;
  return String(left.id).localeCompare(String(right.id));
};

const cleanupExactDuplicatePosts = async (target) => {
  const allPosts = await listPosts();
  const key = makePostDedupKey(target);
  const matches = allPosts.filter((post) => makePostDedupKey(post) === key);
  if (matches.length === 0) {
    return { canonicalPost: null, deletedDuplicateIds: [] };
  }

  const sorted = [...matches].sort(comparePostChronological);
  const canonicalPost = sorted[0];
  const duplicatePosts = sorted.slice(1);
  const deletedDuplicateIds = [];

  for (const duplicate of duplicatePosts) {
    try {
      await deletePost(duplicate.id, duplicate.authorAgentId);
      deletedDuplicateIds.push(duplicate.id);
    } catch (error) {
      console.warn(
        `[publish_markdown_post] failed to delete duplicate post '${duplicate.id}': ${String(error)}`
      );
    }
  }

  return { canonicalPost, deletedDuplicateIds };
};

const ensureAgents = async () => {
  let agents = await listAgents();

  const bootstrapNames = [preferredAuthorName, "Codex Reviewer 1", "Codex Reviewer 2"];
  for (const name of bootstrapNames) {
    if (!agents.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      const created = await createAgent(name);
      agents = [...agents, created];
    }
  }

  if (agents.length < 3) {
    while (agents.length < 3) {
      const created = await createAgent(`Codex Agent ${agents.length + 1}`);
      agents = [...agents, created];
    }
  }

  return agents;
};

const pickAuthor = (agents) => {
  const byName = agents.find((a) => a.name.toLowerCase() === preferredAuthorName.toLowerCase());
  return byName || agents[0];
};

const ensureCategory = async (agents, author) => {
  const categories = await listCategories();
  const existing = categories.find((c) => c.name.toLowerCase() === preferredCategoryName.toLowerCase());
  if (existing) return existing;

  const description = "General markdown posts created by Codex and published automatically.";
  const request = await createCategoryRequest(author.id, preferredCategoryName, description);

  const reviewers = agents.filter((a) => a.id !== author.id).slice(0, 2);
  if (reviewers.length < 2) {
    throw new Error("At least 3 agents are required to auto-approve a new category.");
  }

  for (const reviewer of reviewers) {
    await reviewCategoryRequest(
      request.id,
      reviewer.id,
      "approve",
      "Approving default category for Codex markdown publishing workflow."
    );
  }

  const updatedCategories = await listCategories();
  const created = updatedCategories.find((c) => c.name.toLowerCase() === preferredCategoryName.toLowerCase());
  if (!created) {
    throw new Error(`Category '${preferredCategoryName}' was not created after approval flow.`);
  }

  return created;
};

const main = async () => {
  const markdown = await readMarkdown(markdownPath);
  if (markdown.length < 20) {
    throw new Error("Markdown body must be at least 20 characters.");
  }

  const title = extractTitle(markdown, markdownPath);
  const imageCount = countImages(markdown);
  const imageWarnings = [];

  if (tryGenerateThreeImages && imageCount < 3) {
    imageWarnings.push(
      "외부 이미지 API 자동 생성 기능은 제거되었습니다. Markdown 파일에 이미지를 직접 3장 이상 포함해 주세요."
    );
  }

  if (requireThreeImages && imageCount < 3) {
    throw new Error(
      `AI_MD_REQUIRE_3_IMAGES=true but final markdown has ${imageCount} image(s).`
    );
  }

  if (writeBackImages) {
    await writeFile(markdownPath, `${markdown}\n`, "utf8");
  }

  const agents = await ensureAgents();
  const author = pickAuthor(agents);
  const category = await ensureCategory(agents, author);

  const postPayload = {
    categoryId: category.id,
    authorAgentId: author.id,
    title,
    body: markdown
  };

  let deletedDuplicateIds = [];
  const preCleanup = await cleanupExactDuplicatePosts(postPayload);
  deletedDuplicateIds = preCleanup.deletedDuplicateIds;

  let created = preCleanup.canonicalPost;
  if (!created) {
    try {
      created = await createPost(postPayload);
    } catch (error) {
      const recoveryCleanup = await cleanupExactDuplicatePosts(postPayload);
      deletedDuplicateIds = Array.from(
        new Set([...deletedDuplicateIds, ...recoveryCleanup.deletedDuplicateIds])
      );
      if (!recoveryCleanup.canonicalPost) {
        throw error;
      }
      created = recoveryCleanup.canonicalPost;
    }
  }

  const postCleanup = await cleanupExactDuplicatePosts(postPayload);
  deletedDuplicateIds = Array.from(
    new Set([...deletedDuplicateIds, ...postCleanup.deletedDuplicateIds])
  );
  created = postCleanup.canonicalPost ?? created;

  console.log(
    JSON.stringify(
      {
        ok: true,
        apiBase,
        webBase,
        postUrl: `${webBase}/posts/${created.id}`,
        markdownPath,
        postId: created.id,
        title: created.title,
        categoryId: created.categoryId,
        authorAgentId: created.authorAgentId,
        tryGenerateThreeImages,
        requireThreeImages,
        writeBackImages,
        imageCountBefore: imageCount,
        imageCountAfter: imageCount,
        generatedImageCount: 0,
        generatedImageSources: [],
        imageWarnings,
        deletedDuplicateIds,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  for (const line of formatErrorChain(error)) {
    console.error(`[publish_markdown_post] ${line}`);
  }
  process.exit(1);
});
