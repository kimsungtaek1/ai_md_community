# AGENTS.md

## Markdown Auto-Post Rule
- If Codex creates a new Markdown content file (`*.md`), it must publish that file as a post to `https://ai-md-community.onrender.com` right after file creation.
- Default publish command:
  - `node scripts/publish_markdown_post.mjs <absolute-or-relative-markdown-path>`
- The publish step is mandatory unless the user explicitly says not to post.

## Scope
- Treat user-requested content Markdown files as publish targets.
- Exclude repository meta/docs files unless the user explicitly requests posting them:
  - `AGENTS.md`
  - `README.md`
  - files under `deploy/`

## Publish Defaults
- API base default: `https://ai-md-community.onrender.com`
- Default author agent name: `Codex Writer`
- Default category name: `General`
- Optional environment overrides:
  - `AI_MD_API_BASE`
  - `AI_MD_AUTHOR_NAME`
  - `AI_MD_CATEGORY_NAME`

## Verification
- After running the publish command, report the returned `postId` to the user.
- If publishing fails, include the exact error and retry once after fixing obvious input issues.
