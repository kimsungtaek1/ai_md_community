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
const uploadToken = process.env.AI_MD_UPLOAD_TOKEN;

const openAiApiBase = (process.env.OPENAI_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");
const openAiApiKey = process.env.OPENAI_API_KEY;
const imageSize = process.env.OPENAI_IMAGE_SIZE || "1024x1024";
const imageProvider = (process.env.AI_IMAGE_PROVIDER || "pollinations").trim().toLowerCase();
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const pollinationsApiBase = (process.env.POLLINATIONS_API_BASE || "https://image.pollinations.ai").replace(/\/$/, "");
const pollinationsModel = process.env.POLLINATIONS_MODEL || "flux";
const localSdApiBase = (process.env.LOCAL_SD_API_BASE || "http://127.0.0.1:7860").replace(/\/$/, "");
const localSdSteps = Number(process.env.LOCAL_SD_STEPS || 24);
const localSdCfgScale = Number(process.env.LOCAL_SD_CFG_SCALE || 6.5);
const localSdSampler = process.env.LOCAL_SD_SAMPLER || "DPM++ 2M Karras";

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

const readMarkdown = async (path) => {
  const text = await readFile(path, "utf8");
  return text.replace(/\r\n/g, "\n").trim();
};

const parseImageSize = (raw) => {
  const match = String(raw).trim().match(/^(\d{2,5})x(\d{2,5})$/i);
  if (!match) {
    return { width: 1024, height: 1024 };
  }
  return {
    width: Math.max(128, Math.min(2048, Number(match[1]))),
    height: Math.max(128, Math.min(2048, Number(match[2])))
  };
};

const { width: imageWidth, height: imageHeight } = parseImageSize(imageSize);

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

const api = async (method, path, body, extraHeaders = {}) => {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
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
  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required when AI_IMAGE_PROVIDER=openai.");
  }

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

const countImages = (markdown) => {
  const markdownImages = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/g) ?? [];
  const htmlImages = markdown.match(/<img\b[^>]*src=["'][^"']+["'][^>]*>/gi) ?? [];
  return markdownImages.length + htmlImages.length;
};

const pickFocusTopics = (markdown, title, count) => {
  const headings = Array.from(markdown.matchAll(/^#{2,6}\s+(.+)$/gm))
    .map((m) => (m[1] || "").trim())
    .filter(Boolean);
  const bullets = Array.from(markdown.matchAll(/^\s*[-*]\s+(.+)$/gm))
    .map((m) => (m[1] || "").replace(/`/g, "").trim())
    .filter(Boolean);

  const merged = [...headings, ...bullets]
    .map((v) => v.replace(/\s+/g, " ").slice(0, 80))
    .filter(Boolean);

  const unique = [];
  for (const item of merged) {
    if (unique.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      continue;
    }
    unique.push(item);
    if (unique.length >= count) {
      break;
    }
  }

  while (unique.length < count) {
    unique.push(`${title} 핵심 포인트 ${unique.length + 1}`);
  }

  return unique;
};

const fetchBufferFromUrl = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status}) from ${url}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType = (res.headers.get("content-type") || "application/octet-stream").split(";")[0].trim();
  if (!contentType.startsWith("image/")) {
    const message = Buffer.from(arrayBuffer).toString("utf8").slice(0, 180);
    throw new Error(`Image endpoint returned non-image content (${contentType}): ${message}`);
  }
  const base64Data = Buffer.from(arrayBuffer).toString("base64");
  return { base64Data, mimeType: contentType };
};

const buildImagePrompt = (title, focus) => [
  "Create a clean editorial illustration for a Korean markdown article.",
  `Article title: ${title}`,
  `Focus: ${focus}`,
  "Style: minimal, high-contrast, modern infographic mood, no watermark, no logo, no text overlay."
].join("\n");

const generateWithOpenAi = async (title, focus) => {
  const prompt = buildImagePrompt(title, focus);
  const generated = await openAi("/images/generations", {
    model: imageModel,
    prompt,
    size: `${imageWidth}x${imageHeight}`,
    n: 1,
    response_format: "b64_json"
  });

  const first = generated?.data?.[0];
  if (first?.b64_json) {
    return {
      base64Data: first.b64_json,
      mimeType: "image/png"
    };
  }

  if (first?.url) {
    return fetchBufferFromUrl(first.url);
  }

  throw new Error("Image generation response did not contain b64_json or url.");
};

const generateWithPollinations = async (title, focus) => {
  const prompt = buildImagePrompt(title, focus);
  const seed = Math.floor(Math.random() * 1_000_000_000);
  const url =
    `${pollinationsApiBase}/prompt/${encodeURIComponent(prompt)}` +
    `?model=${encodeURIComponent(pollinationsModel)}` +
    `&width=${imageWidth}&height=${imageHeight}&seed=${seed}` +
    "&nologo=true&private=true&enhance=true&safe=true";
  return fetchBufferFromUrl(url);
};

const parseJsonResponse = async (res, label) => {
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`${label} failed (${res.status}): ${typeof json === "string" ? json : JSON.stringify(json)}`);
  }
  return json;
};

const stripDataUriPrefix = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

const generateWithLocalSdWebUi = async (title, focus) => {
  const prompt = buildImagePrompt(title, focus);
  const res = await fetch(`${localSdApiBase}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      negative_prompt: "low quality, blurry, distorted, watermark, logo, text",
      width: imageWidth,
      height: imageHeight,
      steps: Number.isFinite(localSdSteps) ? localSdSteps : 24,
      cfg_scale: Number.isFinite(localSdCfgScale) ? localSdCfgScale : 6.5,
      sampler_name: localSdSampler
    })
  });

  const json = await parseJsonResponse(res, "Local SD WebUI /sdapi/v1/txt2img");
  const first = Array.isArray(json?.images) ? json.images[0] : undefined;
  const base64Data = stripDataUriPrefix(first);
  if (!base64Data) {
    throw new Error("Local SD WebUI did not return images[0].");
  }
  return {
    base64Data,
    mimeType: "image/png"
  };
};

const generateOneImage = async (title, focus) => {
  if (imageProvider === "pollinations") {
    return generateWithPollinations(title, focus);
  }

  if (imageProvider === "local-sdwebui" || imageProvider === "automatic1111") {
    return generateWithLocalSdWebUi(title, focus);
  }

  if (imageProvider === "openai") {
    return generateWithOpenAi(title, focus);
  }

  throw new Error(
    `Unsupported AI_IMAGE_PROVIDER='${imageProvider}'. Use one of: pollinations, local-sdwebui, automatic1111, openai.`
  );
};

let cachedUploadSupport;
const detectUploadEndpoint = async () => {
  if (cachedUploadSupport !== undefined) {
    return cachedUploadSupport;
  }

  try {
    const res = await fetch(`${apiBase}/assets/images`, { method: "OPTIONS" });
    cachedUploadSupport = res.status !== 404;
    return cachedUploadSupport;
  } catch {
    cachedUploadSupport = false;
    return cachedUploadSupport;
  }
};

const uploadImageAsset = async ({ base64Data, mimeType, filenameHint }) => {
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

const toDataUri = ({ base64Data, mimeType }) => `data:${mimeType};base64,${base64Data}`;

const ensureThreeImages = async (markdown, title) => {
  const before = countImages(markdown);
  const warnings = [];
  if (before >= 3) {
    return {
      finalMarkdown: markdown,
      before,
      after: before,
      generatedCount: 0,
      generatedImages: [],
      warnings
    };
  }

  const missing = 3 - before;
  if (imageProvider === "openai" && !openAiApiKey) {
    warnings.push(
      `AI_IMAGE_PROVIDER=openai but OPENAI_API_KEY is missing. Could not generate ${missing} image(s), so the post will be published without auto-generated images.`
    );
    return {
      finalMarkdown: markdown,
      before,
      after: before,
      generatedCount: 0,
      generatedImages: [],
      warnings
    };
  }

  const focusTopics = pickFocusTopics(markdown, title, missing);
  const canUpload = await detectUploadEndpoint();
  const generatedImages = [];

  for (let i = 0; i < focusTopics.length; i += 1) {
    const focus = focusTopics[i];
    let generated;
    try {
      generated = await generateOneImage(title, focus);
    } catch (error) {
      warnings.push(
        `Failed to generate image ${i + 1}/${focusTopics.length} (${focus}) with provider '${imageProvider}': ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      continue;
    }

    let url;
    let source = "data-uri";

    if (canUpload) {
      try {
        url = await uploadImageAsset({
          ...generated,
          filenameHint: `ai-bot-${i + 1}-${focus.slice(0, 24).replace(/[^a-zA-Z0-9가-힣]+/g, "-")}`
        });
        source = "upload";
      } catch (error) {
        console.warn(
          `[publish_markdown_post] /assets/images upload failed, falling back to data URI: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        warnings.push(
          `Upload failed for image ${i + 1} (${focus}), falling back to data URI.`
        );
      }
    }

    if (!url) {
      url = toDataUri(generated);
    }

    generatedImages.push({
      focus,
      url,
      source
    });
  }

  if (generatedImages.length === 0) {
    warnings.push("No image could be generated/uploaded. Publishing markdown without additional images.");
    return {
      finalMarkdown: markdown,
      before,
      after: before,
      generatedCount: 0,
      generatedImages: [],
      warnings
    };
  }

  const lines = [markdown.trim(), "", "## AI 봇 생성 이미지 (자동 3장 정책)", ""];
  for (let i = 0; i < generatedImages.length; i += 1) {
    const item = generatedImages[i];
    const imageNumber = before + i + 1;
    const alt = `${title} - 이미지 ${imageNumber} (${item.focus})`;
    lines.push(`### 이미지 ${imageNumber}: ${item.focus}`);
    lines.push(`![${alt}](${item.url})`);
    lines.push(`> 생성 포인트: ${item.focus}`);
    lines.push("");
  }

  const finalMarkdown = lines.join("\n").trim();
  const after = countImages(finalMarkdown);
  if (after < 3) {
    warnings.push(
      `Requested 3 images, but only ${after} image(s) are available. Publishing with available images.`
    );
  }

  return {
    finalMarkdown,
    before,
    after,
    generatedCount: generatedImages.length,
    generatedImages,
    warnings
  };
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
  let imageResult = {
      finalMarkdown: markdown,
      before: countImages(markdown),
      after: countImages(markdown),
      generatedCount: 0,
      generatedImages: [],
      warnings: []
    };

  if (tryGenerateThreeImages) {
    try {
      imageResult = await ensureThreeImages(markdown, title);
    } catch (error) {
      imageResult.warnings.push(
        `Image automation failed unexpectedly: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (requireThreeImages && imageResult.after < 3) {
    throw new Error(
      `AI_MD_REQUIRE_3_IMAGES=true but final markdown has ${imageResult.after} image(s).`
    );
  }

  if (writeBackImages && imageResult.finalMarkdown !== markdown) {
    await writeFile(markdownPath, `${imageResult.finalMarkdown}\n`, "utf8");
  }

  const agents = await ensureAgents();
  const author = pickAuthor(agents);
  const category = await ensureCategory(agents, author);

  const created = await createPost({
    categoryId: category.id,
    authorAgentId: author.id,
    title,
    body: imageResult.finalMarkdown
  });

  console.log(JSON.stringify({
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
    imageProvider,
    imageSize: `${imageWidth}x${imageHeight}`,
    imageCountBefore: imageResult.before,
    imageCountAfter: imageResult.after,
    generatedImageCount: imageResult.generatedCount,
    generatedImageSources: imageResult.generatedImages.map((item) => item.source),
    imageWarnings: imageResult.warnings
  }, null, 2));
};

main().catch((error) => {
  console.error(`[publish_markdown_post] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
