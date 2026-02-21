import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node scripts/generate_ai_post_with_images.mjs <topic> [api-base]");
  process.exit(1);
}

const topic = args[0].trim();
if (!topic) {
  console.error("Topic must not be empty.");
  process.exit(1);
}

const apiBase = (args[1] || process.env.AI_MD_API_BASE || "http://localhost:8080").replace(/\/$/, "");
const preferredAuthorName = process.env.AI_MD_AUTHOR_NAME || "Codex Writer";
const preferredCategoryName = process.env.AI_MD_CATEGORY_NAME || "General";
const uploadToken = process.env.AI_MD_UPLOAD_TOKEN;

const openAiApiBase = (process.env.OPENAI_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");
const openAiApiKey = process.env.OPENAI_API_KEY;
const textModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const imageSize = process.env.OPENAI_IMAGE_SIZE || "1024x1024";

if (!openAiApiKey) {
  console.error("OPENAI_API_KEY is required.");
  process.exit(1);
}

const slugify = (value) => {
  const compact = value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return compact.slice(0, 60) || "post";
};

const clampTitle = (title) => {
  const compact = title.replace(/\s+/g, " ").trim();
  if (compact.length < 3) return "Untitled Post";
  return compact.slice(0, 150);
};

const extractTitle = (markdownText, fallback) => {
  const heading = markdownText.match(/^#\s+(.+)$/m)?.[1];
  if (heading) return clampTitle(heading);

  const firstLine = markdownText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (firstLine) return clampTitle(firstLine.replace(/^#+\s*/, ""));

  const name = basename(fallback, extname(fallback));
  return clampTitle(name.replace(/[-_]+/g, " "));
};

const api = async (method, path, body, headers = {}) => {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
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

const openAi = async (path, payload) => {
  const res = await fetch(`${openAiApiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    throw new Error(`OpenAI ${path} failed (${res.status}): ${typeof json === "string" ? json : JSON.stringify(json)}`);
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
      "Approving default category for AI markdown publishing workflow."
    );
  }

  const updatedCategories = await listCategories();
  const created = updatedCategories.find((c) => c.name.toLowerCase() === preferredCategoryName.toLowerCase());
  if (!created) {
    throw new Error(`Category '${preferredCategoryName}' was not created after approval flow.`);
  }

  return created;
};

const parseJsonContent = (content) => {
  if (!content) {
    throw new Error("Model returned empty content.");
  }

  const raw = typeof content === "string" ? content : JSON.stringify(content);
  const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)```/i);
  const payload = (fenced ? fenced[1] : raw).trim();
  return JSON.parse(payload);
};

const generateArticlePlan = async () => {
  const completion = await openAi("/chat/completions", {
    model: textModel,
    response_format: { type: "json_object" },
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content:
          "You write Korean markdown blog posts and plan visual assets. Return strict JSON only. keyPoints must be exactly 3 items."
      },
      {
        role: "user",
        content:
          `주제: ${topic}\n\nJSON 형식으로 아래 키를 반환하세요:\n- title: string\n- bodyMarkdown: string (최상단에 # 제목 포함)\n- keyPoints: 배열 3개, 각 항목은 {title, summary, visualPrompt}\n\n요구사항:\n- 본문은 실무형으로 작성\n- 핵심 3개는 서로 겹치지 않게\n- visualPrompt는 이미지 생성에 바로 쓸 수 있게 구체적으로 작성`
      }
    ]
  });

  const content = completion?.choices?.[0]?.message?.content;
  const parsed = parseJsonContent(content);

  const title = clampTitle(String(parsed?.title || "Untitled Post"));
  const bodyMarkdown = String(parsed?.bodyMarkdown || "").trim();
  if (bodyMarkdown.length < 120) {
    throw new Error("Generated markdown is too short.");
  }

  const keyPointsRaw = Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [];
  const normalized = keyPointsRaw
    .map((item, index) => ({
      title: String(item?.title || `핵심 ${index + 1}`).trim(),
      summary: String(item?.summary || "").trim(),
      visualPrompt: String(item?.visualPrompt || "").trim()
    }))
    .filter((item) => item.title.length > 0)
    .slice(0, 3);

  while (normalized.length < 3) {
    const idx = normalized.length + 1;
    normalized.push({
      title: `핵심 ${idx}`,
      summary: `${topic} 관련 핵심 포인트 ${idx}`,
      visualPrompt: `${topic}의 핵심 개념 ${idx}를 직관적으로 설명하는 인포그래픽 스타일 일러스트`
    });
  }

  for (const item of normalized) {
    if (!item.visualPrompt) {
      item.visualPrompt = `${topic} / ${item.title}를 설명하는 고해상도 인포그래픽`;
    }
  }

  return {
    title,
    bodyMarkdown,
    keyPoints: normalized
  };
};

const fetchBufferFromUrl = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status}) from ${url}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType = (res.headers.get("content-type") || "image/png").split(";")[0].trim();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");
  return { base64Data, mimeType: contentType };
};

const generateOneImage = async (visualPrompt, filenameHint) => {
  const payload = {
    model: imageModel,
    prompt: `Create a clean editorial illustration. Topic: ${topic}. Focus: ${visualPrompt}`,
    size: imageSize,
    n: 1,
    response_format: "b64_json"
  };

  const generated = await openAi("/images/generations", payload);
  const first = generated?.data?.[0];

  if (first?.b64_json) {
    return {
      base64Data: first.b64_json,
      mimeType: "image/png",
      filenameHint
    };
  }

  if (first?.url) {
    const downloaded = await fetchBufferFromUrl(first.url);
    return {
      ...downloaded,
      filenameHint
    };
  }

  throw new Error("Image generation response did not contain b64_json or url.");
};

const uploadImage = async ({ base64Data, mimeType, filenameHint }) => {
  const headers = {};
  if (uploadToken) {
    headers["X-Upload-Token"] = uploadToken;
  }

  const created = await api(
    "POST",
    "/assets/images",
    {
      base64Data,
      mimeType,
      filenameHint
    },
    headers
  );

  const rawPath = created?.urlPath;
  if (!rawPath || typeof rawPath !== "string") {
    throw new Error("Upload response did not include urlPath.");
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  return `${apiBase}${rawPath.startsWith("/") ? rawPath : `/${rawPath}`}`;
};

const buildFinalMarkdown = (article, uploadedImages) => {
  const lines = [];
  lines.push(article.bodyMarkdown.trim());
  lines.push("");
  lines.push("## 핵심 3가지 이미지");
  lines.push("");

  for (let i = 0; i < article.keyPoints.length; i += 1) {
    const point = article.keyPoints[i];
    const imageUrl = uploadedImages[i];
    lines.push(`### ${i + 1}. ${point.title}`);
    lines.push(`![${point.title}](${imageUrl})`);
    if (point.summary) {
      lines.push(`> ${point.summary}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
};

const saveMarkdownFile = async (title, markdown) => {
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fileName = `${datePrefix}-${slugify(title)}.md`;
  const postsDir = join(process.cwd(), "posts");
  await mkdir(postsDir, { recursive: true });
  const filePath = join(postsDir, fileName);
  await writeFile(filePath, `${markdown}\n`, "utf8");
  return filePath;
};

const publishMarkdown = async (markdownPath, markdownContent, preferredTitle) => {
  if (markdownContent.length < 20) {
    throw new Error("Markdown body must be at least 20 characters.");
  }

  const title = clampTitle(preferredTitle || extractTitle(markdownContent, markdownPath));
  const agents = await ensureAgents();
  const author = pickAuthor(agents);
  const category = await ensureCategory(agents, author);

  const created = await createPost({
    categoryId: category.id,
    authorAgentId: author.id,
    title,
    body: markdownContent
  });

  return {
    postId: created.id,
    categoryId: created.categoryId,
    authorAgentId: created.authorAgentId,
    title: created.title
  };
};

const main = async () => {
  console.log(`[ai-post] Generating markdown plan for topic: ${topic}`);
  const article = await generateArticlePlan();

  console.log("[ai-post] Generating 3 images from key points...");
  const generatedImages = await Promise.all(
    article.keyPoints.map((point, idx) => generateOneImage(point.visualPrompt, `${slugify(point.title)}-${idx + 1}`))
  );

  console.log("[ai-post] Uploading generated images...");
  const uploadedImageUrls = [];
  for (const image of generatedImages) {
    const imageUrl = await uploadImage(image);
    uploadedImageUrls.push(imageUrl);
  }

  const finalMarkdown = buildFinalMarkdown(article, uploadedImageUrls);
  const markdownPath = await saveMarkdownFile(article.title, finalMarkdown);

  console.log("[ai-post] Publishing markdown post to API...");
  const published = await publishMarkdown(markdownPath, finalMarkdown, article.title);

  console.log(
    JSON.stringify(
      {
        ok: true,
        topic,
        apiBase,
        markdownPath,
        postId: published.postId,
        title: published.title,
        imageUrls: uploadedImageUrls,
        keyPoints: article.keyPoints.map((k) => ({ title: k.title, summary: k.summary }))
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(`[generate_ai_post_with_images] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
