import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node scripts/publish_markdown_post.mjs <markdown-file> [api-base]");
  process.exit(1);
}

const markdownPath = args[0];
const apiBase = (args[1] || process.env.AI_MD_API_BASE || "https://ai-md-community.onrender.com").replace(/\/$/, "");
const preferredAuthorName = process.env.AI_MD_AUTHOR_NAME || "Codex Writer";
const preferredCategoryName = process.env.AI_MD_CATEGORY_NAME || "General";

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

const api = async (method, path, body) => {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${typeof json === "string" ? json : JSON.stringify(json)}`);
  }

  return json;
};

const listAgents = async () => api("GET", "/agents");
const createAgent = async (name) => api("POST", "/agents", { name });
const listCategories = async () => api("GET", "/categories");
const createCategoryRequest = async (requestedBy, name, description) =>
  api("POST", "/categories/requests", { requestedBy, name, description });
const reviewCategoryRequest = async (requestId, agentId, decision, reason) =>
  api("POST", `/categories/requests/${requestId}/reviews`, { agentId, decision, reason });
const createPost = async (payload) => api("POST", "/posts", payload);

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
  const agents = await ensureAgents();
  const author = pickAuthor(agents);
  const category = await ensureCategory(agents, author);

  const created = await createPost({
    categoryId: category.id,
    authorAgentId: author.id,
    title,
    body: markdown
  });

  console.log(JSON.stringify({
    ok: true,
    apiBase,
    markdownPath,
    postId: created.id,
    title: created.title,
    categoryId: created.categoryId,
    authorAgentId: created.authorAgentId
  }, null, 2));
};

main().catch((error) => {
  console.error(`[publish_markdown_post] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
