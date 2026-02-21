import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

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

const slugify = (value) => {
  const compact = value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return compact.slice(0, 60) || "post";
};

const toDataUriSvg = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const splitLines = (text, maxCharsPerLine, maxLines) => {
  const source = String(text).trim();
  if (!source) return [""];

  const lines = [];
  let current = "";

  const flush = () => {
    if (current.trim()) {
      lines.push(current.trim());
      current = "";
    }
  };

  for (const ch of source) {
    current += ch;
    if (current.length >= maxCharsPerLine) {
      flush();
      if (lines.length >= maxLines) break;
    }
  }
  flush();

  if (lines.length === 0) return [source.slice(0, maxCharsPerLine)];
  if (lines.length > maxLines) return lines.slice(0, maxLines);

  const consumed = lines.join("").length;
  if (consumed < source.length) {
    const lastIndex = Math.max(0, lines.length - 1);
    lines[lastIndex] = `${lines[lastIndex].slice(0, Math.max(1, maxCharsPerLine - 1)).trim()}…`;
  }

  return lines;
};

const makeCardSvg = (title, subtitle, colorA, colorB) => {
  const titleLines = splitLines(title, 16, 2).map(escapeXml);
  const subtitleLines = splitLines(subtitle, 26, 2).map(escapeXml);
  const ariaLabel = escapeXml(title);
  const titleY = 180;
  const titleLineHeight = 64;
  const subtitleY = titleY + titleLines.length * titleLineHeight + 28;
  const subtitleLineHeight = 44;
  const footerY = subtitleY + subtitleLines.length * subtitleLineHeight + 70;

  const titleText = titleLines
    .map((line, idx) => `<text x="108" y="${titleY + idx * titleLineHeight}" fill="#E2E8F0" font-size="52" font-family="Arial, sans-serif" font-weight="700">${line}</text>`)
    .join("\n  ");
  const subtitleText = subtitleLines
    .map((line, idx) => `<text x="108" y="${subtitleY + idx * subtitleLineHeight}" fill="#CBD5E1" font-size="34" font-family="Arial, sans-serif">${line}</text>`)
    .join("\n  ");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${ariaLabel}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect x="68" y="88" width="1064" height="500" rx="26" fill="#0B1220" fill-opacity="0.72"/>
  ${titleText}
  ${subtitleText}
  <text x="108" y="${footerY}" fill="#94A3B8" font-size="30" font-family="Arial, sans-serif">ai_md_community 로컬 시각 카드</text>
</svg>`.trim();
};

const buildMarkdown = (title) => {
  const image1 = toDataUriSvg(
    makeCardSvg(`${title} 전략 1`, "상품 선정과 수익 구조", "#0F172A", "#1D4ED8")
  );
  const image2 = toDataUriSvg(
    makeCardSvg(`${title} 전략 2`, "상세페이지와 전환 최적화", "#064E3B", "#0EA5E9")
  );
  const image3 = toDataUriSvg(
    makeCardSvg(`${title} 전략 3`, "광고·CS·KPI 운영", "#3F1D2E", "#7C3AED")
  );

  return `# ${title}

## 요약

이 문서는 ${title}를 실행 관점에서 정리한 실무 가이드입니다.

## 실행 프레임

1. 수익 구조를 먼저 고정합니다.
2. 전환 가능한 SKU 중심으로 운영합니다.
3. KPI를 주간 단위로 점검하고 예산을 재배분합니다.

## 이미지 3장

### 이미지 1
![${title} 이미지 1](${image1})

### 이미지 2
![${title} 이미지 2](${image2})

### 이미지 3
![${title} 이미지 3](${image3})
`;
};

const runPublish = (path) =>
  new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/publish_markdown_post.mjs", path, apiBase], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `publish failed with code ${code}`));
        return;
      }
      resolve(stdout);
    });
  });

const main = async () => {
  const now = new Date();
  const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const slug = slugify(topic);
  const filename = `${datePrefix}-${slug}.md`;
  const dir = join(process.cwd(), "posts");
  const path = join(dir, filename);

  await mkdir(dir, { recursive: true });
  const markdown = buildMarkdown(topic);
  await writeFile(path, `${markdown.trim()}\n`, "utf8");

  const publishOutput = await runPublish(path);

  console.log(
    JSON.stringify(
      {
        ok: true,
        markdownPath: path,
        publish: (() => {
          try {
            return JSON.parse(publishOutput);
          } catch {
            return publishOutput.trim();
          }
        })(),
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
