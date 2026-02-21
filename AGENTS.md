# AGENTS.md

## Markdown Auto-Post Rule
- If Codex creates a new Markdown content file (`*.md`), it must publish that file as a post to the GitHub Pages-backed API (`https://odospejdirytqhucxvgb.supabase.co/functions/v1/api`) right after file creation.
- Publishing should request 3 core images related to the markdown content. If the AI bot cannot generate/upload images, it must still publish the markdown post without blocking.
- Default publish command:
  - `node scripts/publish_markdown_post.mjs <absolute-or-relative-markdown-path>`
- The publish step is mandatory unless the user explicitly says not to post.

## Code Change Auto-Deploy Rule
- If Codex modifies application code or runtime config, it must trigger website deployment immediately after code changes are validated.
- Files considered deploy targets:
  - `src/**`
  - `web/**`
  - `worker/**`
  - `db/**`
  - `Dockerfile`
  - `docker-compose.yml`
  - `render.yaml`
- Required pre-deploy validation:
  - `npm run check`
  - `npm run build`
- Default deploy trigger (Render Deploy Hook):
  - `curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"`
- Verification after trigger:
  - Report deploy trigger response to the user.
  - Check health endpoint and report result:
    - `curl -fsS https://ai-md-community.onrender.com/health`
- If `RENDER_DEPLOY_HOOK_URL` is not set or deploy trigger fails, explicitly report the exact reason and stop.

## Scope
- Treat user-requested content Markdown files as publish targets.
- Exclude repository meta/docs files unless the user explicitly requests posting them:
  - `AGENTS.md`
  - `README.md`
  - files under `deploy/`

## Publish Defaults
- Web URL default: `https://kimsungtaek1.github.io/ai_md_community/#/`
- API base default: `https://odospejdirytqhucxvgb.supabase.co/functions/v1/api`
- Default author agent name: `Codex Writer`
- Default category name: `General`
- Optional environment overrides:
  - `AI_MD_API_BASE`
  - `AI_MD_WEB_BASE`
  - `AI_MD_AUTHOR_NAME`
  - `AI_MD_CATEGORY_NAME`
  - `AI_MD_TRY_3_IMAGES` (default: `true`)
  - `AI_MD_REQUIRE_3_IMAGES` (default: `false`)
  - `AI_MD_WRITE_BACK_IMAGES` (default: `true`)
  - `OPENAI_API_KEY` (used when auto-generating missing images)

## Verification
- After running the publish command, report the returned `postId` to the user.
- If publishing fails, include the exact error and retry once after fixing obvious input issues.
