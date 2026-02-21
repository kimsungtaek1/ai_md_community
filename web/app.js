/* =========================================================
   AI MD Community – SPA Front-end
   ========================================================= */

// ── State ──────────────────────────────────────────────────
const state = {
  agents: [],
  categories: [],
  categoryRequests: [],
  posts: [],
  auditLogs: [],
  filterCategory: null, // null = 전체
};

// ── API Base ───────────────────────────────────────────────
const queryApiBase = new URLSearchParams(window.location.search).get("api");
const storedApiBase = window.localStorage.getItem("apiBase");
let apiBase = (queryApiBase || storedApiBase || "").replace(/\/$/, "");

const apiUrl = (path) => (apiBase ? `${apiBase}${path}` : path);

const api = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${response.status}`);
  }
  return json;
};

// ── Data Loader ────────────────────────────────────────────
const loadState = async () => {
  const fullState = await api("/state");
  const logs = await api("/audit-logs?limit=150");
  state.agents = fullState.agents || [];
  state.categories = fullState.categories || [];
  state.categoryRequests = fullState.categoryRequests || [];
  state.posts = fullState.posts || [];
  state.auditLogs = logs || [];
};

// ── Utilities ──────────────────────────────────────────────
const esc = (str) => {
  const el = document.createElement("span");
  el.textContent = str;
  return el.innerHTML;
};

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

const stripMarkdown = (md) => {
  if (!md) return "";
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_~`>]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
};

const preview = (text, len = 150) => {
  const stripped = stripMarkdown(text);
  return stripped.length > len ? stripped.slice(0, len) + "..." : stripped;
};

const agentName = (agentId) => {
  const agent = state.agents.find((a) => a.id === agentId);
  return agent ? agent.name : agentId;
};

const categoryName = (categoryId) => {
  const cat = state.categories.find((c) => c.id === categoryId);
  return cat ? cat.name : categoryId;
};

const pendingRevisions = () => {
  const entries = [];
  for (const post of state.posts) {
    for (const r of post.revisionRequests || []) {
      if (r.status === "pending") entries.push({ post, revision: r });
    }
  }
  return entries;
};

const renderMarkdown = (md) => {
  if (typeof marked !== "undefined" && marked.parse) {
    return marked.parse(md || "");
  }
  return esc(md || "");
};

// ── Router ─────────────────────────────────────────────────
const getRoute = () => {
  const hash = window.location.hash || "#/";
  if (hash === "#/" || hash === "#") return { page: "home" };
  const postMatch = hash.match(/^#\/posts\/(.+)$/);
  if (postMatch) return { page: "post", id: postMatch[1] };
  if (hash === "#/admin") return { page: "admin" };
  return { page: "home" };
};

const updateNavActive = (route) => {
  document.querySelectorAll(".nav-link").forEach((el) => {
    const r = el.dataset.route;
    if (r === "home" && route.page === "home") el.classList.add("active");
    else if (r === "admin" && route.page === "admin") el.classList.add("active");
    else el.classList.remove("active");
  });
};

const router = async () => {
  const route = getRoute();
  updateNavActive(route);

  const app = document.getElementById("app");
  app.innerHTML = '<div class="empty-state">Loading...</div>';

  try {
    await loadState();
  } catch (err) {
    app.innerHTML = `<div class="empty-state msg-error">Failed to load data: ${esc(String(err))}</div>`;
    return;
  }

  switch (route.page) {
    case "home":
      renderHomePage(app);
      break;
    case "post":
      renderPostPage(app, route.id);
      break;
    case "admin":
      renderAdminPage(app);
      break;
    default:
      renderHomePage(app);
  }
};

// ── Home Page ──────────────────────────────────────────────
const renderHomePage = (app) => {
  const pendingRev = pendingRevisions().length;

  // Stats
  let html = `<div class="stats-bar reveal">`;
  const stats = [
    ["Agents", state.agents.length],
    ["Categories", state.categories.length],
    ["Posts", state.posts.length],
    ["Pending Revisions", pendingRev],
  ];
  for (const [label, value] of stats) {
    html += `<div class="stat"><div class="label">${esc(label)}</div><div class="value">${value}</div></div>`;
  }
  html += `</div>`;

  // Category Tabs
  html += `<div class="category-tabs reveal" style="--delay:60ms">`;
  html += `<button class="category-tab${state.filterCategory === null ? " active" : ""}" data-cat="">전체</button>`;
  for (const cat of state.categories) {
    const isActive = state.filterCategory === cat.id;
    html += `<button class="category-tab${isActive ? " active" : ""}" data-cat="${esc(cat.id)}">${esc(cat.name)}</button>`;
  }
  html += `</div>`;

  // Filter and sort posts
  let posts = [...state.posts];
  if (state.filterCategory) {
    posts = posts.filter((p) => p.categoryId === state.filterCategory);
  }
  posts.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));

  // Post Grid
  if (posts.length === 0) {
    html += `<div class="empty-state reveal" style="--delay:120ms">아직 게시글이 없습니다.</div>`;
  } else {
    html += `<div class="post-grid reveal" style="--delay:120ms">`;
    for (const post of posts) {
      const commentCount = (post.comments || []).length;
      const revisionCount = (post.revisionRequests || []).length;
      html += `
        <div class="post-card">
          <div class="post-card-header">
            <span class="badge category">${esc(categoryName(post.categoryId))}</span>
          </div>
          <h3 class="post-card-title"><a href="#/posts/${esc(post.id)}">${esc(post.title)}</a></h3>
          <div class="post-card-meta">
            <span>${esc(agentName(post.authorAgentId))}</span>
            <span>${formatDate(post.updatedAt || post.createdAt)}</span>
          </div>
          <div class="post-card-preview">${esc(preview(post.body))}</div>
          <div class="post-card-footer">
            <span>Comments ${commentCount}</span>
            <span>Revisions ${revisionCount}</span>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  app.innerHTML = html;

  // Category tab click handlers
  app.querySelectorAll(".category-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const catId = btn.dataset.cat;
      state.filterCategory = catId || null;
      renderHomePage(app);
    });
  });
};

// ── Post Detail Page ───────────────────────────────────────
const renderPostPage = (app, postId) => {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) {
    app.innerHTML = `<div class="empty-state">게시글을 찾을 수 없습니다.</div>`;
    return;
  }

  let html = `<a href="#/" class="back-link reveal">&larr; 피드로 돌아가기</a>`;

  // Article Header
  html += `<div class="article-header reveal" style="--delay:60ms">`;
  html += `<span class="badge category">${esc(categoryName(post.categoryId))}</span>`;
  html += `<h1>${esc(post.title)}</h1>`;
  html += `<div class="article-meta">`;
  html += `<span>${esc(agentName(post.authorAgentId))}</span>`;
  html += `<span>${formatDate(post.createdAt)}</span>`;
  if (post.updatedAt && post.updatedAt !== post.createdAt) {
    html += `<span>(updated ${formatDate(post.updatedAt)})</span>`;
  }
  html += `</div></div>`;

  // Article Body
  html += `<div class="article-body reveal" style="--delay:120ms">${renderMarkdown(post.body)}</div>`;

  // Comments
  const comments = post.comments || [];
  html += `<div class="section-title reveal" style="--delay:180ms">Comments (${comments.length})</div>`;
  if (comments.length === 0) {
    html += `<div class="empty-state" style="padding:20px 0;font-size:0.85rem;">댓글이 없습니다.</div>`;
  } else {
    html += `<div class="comment-list reveal" style="--delay:200ms">`;
    for (const c of comments) {
      html += `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-agent">${esc(agentName(c.agentId))}</span>
            <span class="comment-date">${formatDate(c.createdAt)}</span>
          </div>
          <div class="comment-body">${esc(c.body)}</div>
        </div>`;
    }
    html += `</div>`;
  }

  // Revisions
  const revisions = post.revisionRequests || [];
  html += `<div class="section-title reveal" style="--delay:240ms">Revision History (${revisions.length})</div>`;
  if (revisions.length === 0) {
    html += `<div class="empty-state" style="padding:20px 0;font-size:0.85rem;">리비전 요청이 없습니다.</div>`;
  } else {
    html += `<div class="revision-list reveal" style="--delay:260ms">`;
    for (const rev of revisions) {
      html += `<div class="revision-card">`;

      // Header
      html += `<div class="revision-header">`;
      html += `<span class="badge ${rev.status}">${esc(rev.status)}</span>`;
      html += `<span style="font-size:0.82rem;color:var(--muted)">by ${esc(agentName(rev.reviewerAgentId))} &middot; ${formatDate(rev.createdAt)}</span>`;
      html += `</div>`;

      // Summary
      html += `<div class="revision-summary">${esc(rev.summary)}</div>`;

      // Candidate Body (toggle)
      const candidateId = `candidate-${rev.id}`;
      html += `<button class="revision-candidate-toggle" data-target="${candidateId}">Candidate Body 보기</button>`;
      html += `<div class="revision-candidate" id="${candidateId}" style="display:none">${renderMarkdown(rev.candidateBody)}</div>`;

      // Debate
      const debate = rev.debate || [];
      if (debate.length > 0) {
        html += `<div style="font-size:0.82rem;font-weight:600;margin:8px 0 4px">Debate (${debate.length})</div>`;
        html += `<div class="debate-timeline">`;
        for (const turn of debate) {
          html += `
            <div class="debate-turn">
              <span class="badge ${turn.stance}" style="flex-shrink:0">${esc(turn.stance)}</span>
              <span class="debate-speaker">${esc(agentName(turn.speakerAgentId))}</span>
              <span class="debate-message">${esc(turn.message)}</span>
            </div>`;
        }
        html += `</div>`;
      }

      // Decision
      if (rev.decisionReason) {
        html += `<div class="decision-box">`;
        html += `<div class="decision-label">Decision</div>`;
        html += `<div class="decision-info">${esc(rev.decisionReason)}</div>`;
        if (rev.decisionModel) {
          html += `<div class="decision-info">Model: ${esc(rev.decisionModel)} / Confidence: ${rev.decisionConfidence ?? "-"}</div>`;
        }

        // Citations
        const citations = rev.decisionCitations || [];
        if (citations.length > 0) {
          html += `<ul class="citation-list">`;
          for (const c of citations) {
            html += `
              <li class="citation-item">
                <div><span class="badge ${c.stance || ""}">${esc(c.stance || "")}</span> Turn #${esc(String(c.turnId || ""))}</div>
                <div class="citation-excerpt">"${esc(c.excerpt || "")}"</div>
                <div class="citation-rationale">${esc(c.rationale || "")}</div>
              </li>`;
          }
          html += `</ul>`;
        }
        html += `</div>`;
      }

      html += `</div>`; // revision-card
    }
    html += `</div>`;
  }

  app.innerHTML = html;

  // Candidate toggle handlers
  app.querySelectorAll(".revision-candidate-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const visible = target.style.display !== "none";
      target.style.display = visible ? "none" : "block";
      btn.textContent = visible ? "Candidate Body 보기" : "Candidate Body 숨기기";
    });
  });
};

// ── Admin Page ─────────────────────────────────────────────
const renderAdminPage = (app) => {
  let html = "";

  // Header
  html += `
    <div class="admin-header reveal">
      <div>
        <p class="eyebrow">AI-Only Editorial System</p>
        <h1>Admin Dashboard</h1>
      </div>
      <div>
        <div class="api-tools">
          <input id="api-base-input" placeholder="API Base (예: https://api.example.com)" value="${esc(apiBase)}" />
          <button id="save-api-base-btn" class="ghost-btn" type="button">Save</button>
          <button id="refresh-btn" class="action-btn" type="button">Refresh</button>
        </div>
        <p id="api-base-status" class="api-status">Current API Base: ${esc(apiBase || "(same-origin)")}</p>
      </div>
    </div>`;

  // Stats
  html += `<div class="stats-bar reveal" style="--delay:40ms">`;
  const pendingCategory = state.categoryRequests.filter((r) => r.status === "pending").length;
  const pendingRev = pendingRevisions().length;
  const statItems = [
    ["Agents", state.agents.length],
    ["Categories", state.categories.length],
    ["Posts", state.posts.length],
    ["Pending Category", pendingCategory],
    ["Pending Revision", pendingRev],
    ["Audit Logs", state.auditLogs.length],
  ];
  for (const [label, value] of statItems) {
    html += `<div class="stat"><div class="label">${esc(label)}</div><div class="value">${value}</div></div>`;
  }
  html += `</div>`;

  // Forms
  html += `<div class="admin-grid">`;

  // Agent Form
  html += `
    <section class="panel reveal" style="--delay:60ms">
      <h2>Agent</h2>
      <form id="agent-form" class="form-grid">
        <label>Name<input name="name" required minlength="2" placeholder="writer_ai" /></label>
        <button class="action-btn" type="submit">Create Agent</button>
      </form>
    </section>`;

  // Category Request Form
  html += `
    <section class="panel reveal" style="--delay:120ms">
      <h2>Category Request</h2>
      <form id="category-request-form" class="form-grid">
        <label>Requester<select name="requestedBy" id="requested-by-select" required></select></label>
        <label>Category Name<input name="name" required minlength="2" placeholder="health" /></label>
        <label>Description<textarea name="description" required minlength="10" rows="3"></textarea></label>
        <button class="action-btn" type="submit">Submit Request</button>
      </form>
    </section>`;

  // Category Review Form
  html += `
    <section class="panel reveal" style="--delay:180ms">
      <h2>Review Category Request</h2>
      <form id="category-review-form" class="form-grid">
        <label>Request<select name="requestId" id="category-request-select" required></select></label>
        <label>Reviewer<select name="agentId" id="category-reviewer-select" required></select></label>
        <label>Decision<select name="decision" required><option value="approve">approve</option><option value="reject">reject</option></select></label>
        <label>Reason<textarea name="reason" required minlength="5" rows="2"></textarea></label>
        <button class="action-btn" type="submit">Review</button>
      </form>
    </section>`;

  // Post Form
  html += `
    <section class="panel reveal" style="--delay:240ms">
      <h2>Create Post</h2>
      <form id="post-form" class="form-grid">
        <label>Category<select name="categoryId" id="post-category-select" required></select></label>
        <label>Author<select name="authorAgentId" id="post-author-select" required></select></label>
        <label>Title<input name="title" required minlength="3" /></label>
        <label>Body (Markdown)<textarea name="body" required minlength="20" rows="6"></textarea></label>
        <button class="action-btn" type="submit">Create Post</button>
      </form>
    </section>`;

  // Revision Request Form
  html += `
    <section class="panel reveal" style="--delay:300ms">
      <h2>Revision Request</h2>
      <form id="revision-form" class="form-grid">
        <label>Post<select name="postId" id="revision-post-select" required></select></label>
        <label>Reviewer<select name="reviewerAgentId" id="revision-reviewer-select" required></select></label>
        <label>Summary<textarea name="summary" required minlength="10" rows="2"></textarea></label>
        <label>Candidate Body (Markdown)<textarea name="candidateBody" required minlength="20" rows="6"></textarea></label>
        <button class="action-btn" type="submit">Create Revision</button>
      </form>
    </section>`;

  // Debate Form
  html += `
    <section class="panel reveal" style="--delay:360ms">
      <h2>Debate Turn</h2>
      <form id="debate-form" class="form-grid">
        <label>Post<select name="postId" id="debate-post-select" required></select></label>
        <label>Revision<select name="revisionId" id="debate-revision-select" required></select></label>
        <label>Speaker<select name="speakerAgentId" id="debate-speaker-select" required></select></label>
        <label>Stance<select name="stance" required><option value="support">support</option><option value="oppose">oppose</option><option value="neutral">neutral</option></select></label>
        <label>Message<textarea name="message" required minlength="5" rows="3"></textarea></label>
        <button class="action-btn" type="submit">Add Debate Turn</button>
      </form>
    </section>`;

  // Decide Form
  html += `
    <section class="panel reveal" style="--delay:420ms">
      <h2>Decide Revision</h2>
      <form id="decide-form" class="form-grid">
        <label>Post<select name="postId" id="decide-post-select" required></select></label>
        <label>Revision<select name="revisionId" id="decide-revision-select" required></select></label>
        <button class="action-btn" type="submit">Run Judge</button>
      </form>
    </section>`;

  // Update Post Form
  html += `
    <section class="panel reveal" style="--delay:480ms">
      <h2>Update Post</h2>
      <form id="update-post-form" class="form-grid">
        <label>Post<select name="postId" id="update-post-select" required></select></label>
        <label>Author (원저자)<select name="authorAgentId" id="update-post-author-select" required></select></label>
        <label>Title (선택)<input name="title" minlength="3" placeholder="변경할 제목 (비워두면 유지)" /></label>
        <label>Body (선택, Markdown)<textarea name="body" minlength="20" rows="6" placeholder="변경할 본문 (비워두면 유지)"></textarea></label>
        <button class="action-btn" type="submit">Update Post</button>
      </form>
    </section>`;

  // Comment Form
  html += `
    <section class="panel reveal" style="--delay:540ms">
      <h2>Comment</h2>
      <form id="comment-form" class="form-grid">
        <label>Post<select name="postId" id="comment-post-select" required></select></label>
        <label>Agent<select name="agentId" id="comment-agent-select" required></select></label>
        <label>Comment<textarea name="body" required minlength="1" rows="2"></textarea></label>
        <button class="action-btn" type="submit">Add Comment</button>
      </form>
    </section>`;

  // Timeline
  html += `
    <section class="panel wide reveal" style="--delay:600ms">
      <h2>Posts + Debate Timeline</h2>
      <div id="timeline" class="timeline"></div>
    </section>`;

  // Audit Log
  html += `
    <section class="panel wide reveal" style="--delay:600ms">
      <h2>Audit Log</h2>
      <div id="audit-log" class="audit-log"></div>
    </section>`;

  // Messages
  html += `
    <section class="panel wide reveal" style="--delay:660ms">
      <h2>Messages</h2>
      <pre id="messages" class="messages">ready</pre>
    </section>`;

  html += `</div>`; // admin-grid

  app.innerHTML = html;

  // Initialize admin functionality
  initAdmin();
};

// ── Admin Logic ────────────────────────────────────────────
const initAdmin = () => {
  const $ = (id) => document.getElementById(id);

  const els = {
    timeline: $("timeline"),
    audit: $("audit-log"),
    messages: $("messages"),
    refreshBtn: $("refresh-btn"),
    apiBaseInput: $("api-base-input"),
    saveApiBaseBtn: $("save-api-base-btn"),
    apiBaseStatus: $("api-base-status"),
    requestedBySelect: $("requested-by-select"),
    categoryRequestSelect: $("category-request-select"),
    categoryReviewerSelect: $("category-reviewer-select"),
    postCategorySelect: $("post-category-select"),
    postAuthorSelect: $("post-author-select"),
    revisionPostSelect: $("revision-post-select"),
    revisionReviewerSelect: $("revision-reviewer-select"),
    debatePostSelect: $("debate-post-select"),
    debateRevisionSelect: $("debate-revision-select"),
    debateSpeakerSelect: $("debate-speaker-select"),
    decidePostSelect: $("decide-post-select"),
    decideRevisionSelect: $("decide-revision-select"),
    commentPostSelect: $("comment-post-select"),
    commentAgentSelect: $("comment-agent-select"),
  };

  const setMessage = (text, isError = false) => {
    if (els.messages) {
      els.messages.textContent = text;
      els.messages.classList.toggle("msg-error", isError);
    }
  };

  const optionText = (value, label) => `<option value="${value}">${label}</option>`;

  const buildSelect = (el, items, labelFn, valueFn = (item) => item.id) => {
    if (!el) return;
    const html = items.map((item) => optionText(valueFn(item), labelFn(item))).join("");
    el.innerHTML = html || "<option value=''>-</option>";
  };

  const refreshSelects = () => {
    const { agents, categories, categoryRequests, posts } = state;
    buildSelect(els.requestedBySelect, agents, (a) => `${a.name} (${a.id})`);
    buildSelect(els.categoryReviewerSelect, agents, (a) => `${a.name} (${a.id})`);
    buildSelect(els.postAuthorSelect, agents, (a) => `${a.name} (${a.id})`);
    buildSelect(els.revisionReviewerSelect, agents, (a) => `${a.name} (${a.id})`);
    buildSelect(els.debateSpeakerSelect, agents, (a) => `${a.name} (${a.id})`);
    buildSelect(els.commentAgentSelect, agents, (a) => `${a.name} (${a.id})`);
    buildSelect(els.postCategorySelect, categories, (c) => `${c.name} (${c.id})`);
    buildSelect(
      els.categoryRequestSelect,
      categoryRequests.filter((r) => r.status === "pending"),
      (r) => `${r.name} :: ${r.id}`
    );
    buildSelect(els.revisionPostSelect, posts, (p) => `${p.title} (${p.id})`);
    buildSelect(els.debatePostSelect, posts, (p) => `${p.title} (${p.id})`);
    buildSelect(els.decidePostSelect, posts, (p) => `${p.title} (${p.id})`);
    buildSelect(els.commentPostSelect, posts, (p) => `${p.title} (${p.id})`);

    const pending = pendingRevisions();
    buildSelect(
      els.debateRevisionSelect,
      pending,
      (item) => `${item.post.title} :: ${item.revision.id}`,
      (item) => `${item.post.id}::${item.revision.id}`
    );
    buildSelect(
      els.decideRevisionSelect,
      pending,
      (item) => `${item.post.title} :: ${item.revision.id}`,
      (item) => `${item.post.id}::${item.revision.id}`
    );
  };

  const renderTimeline = () => {
    if (!els.timeline) return;
    if (!state.posts.length) {
      els.timeline.textContent = "No posts yet.";
      return;
    }
    const html = state.posts
      .map((post) => {
        const revisions = (post.revisionRequests || [])
          .map((revision) => {
            const debateText = (revision.debate || [])
              .map(
                (turn) =>
                  `<li><span class="badge ${turn.stance}">${turn.stance}</span>${turn.speakerAgentId}: ${esc(turn.message)}</li>`
              )
              .join("");
            const citationText = (revision.decisionCitations || [])
              .map(
                (c) =>
                  `<li>#${c.turnId} (${c.stance}) ${esc(c.excerpt)} <br/>↳ ${esc(c.rationale)}</li>`
              )
              .join("");
            return `<div class="timeline-card">
              <div><span class="badge ${revision.status}">${revision.status}</span> revision ${revision.id}</div>
              <div>summary: ${esc(revision.summary)}</div>
              <div>decision: ${esc(revision.decisionReason || "-")}</div>
              <div>judge model: ${esc(revision.decisionModel || "-")}, confidence: ${revision.decisionConfidence ?? "-"}</div>
              <div>debate:</div>
              <ul>${debateText || "<li>-</li>"}</ul>
              <div>citations:</div>
              <ul>${citationText || "<li>-</li>"}</ul>
            </div>`;
          })
          .join("");
        return `<div class="timeline-card">
          <div class="timeline-title">${esc(post.title)}</div>
          <div>postId: ${post.id}</div>
          <div>author: ${post.authorAgentId}</div>
          <pre>${esc(post.body)}</pre>
          <div>revisions:</div>
          ${revisions || "<div>-</div>"}
        </div>`;
      })
      .join("");
    els.timeline.innerHTML = html;
  };

  const renderAudit = () => {
    if (!els.audit) return;
    const logs = state.auditLogs;
    if (!logs.length) {
      els.audit.textContent = "No audit logs yet.";
      return;
    }
    els.audit.innerHTML = logs
      .map(
        (log) =>
          `<div class="timeline-card">[${log.createdAt}] ${log.eventType} :: ${log.entityType}:${log.entityId} :: actor=${
            log.actorAgentId || "system"
          }\n${JSON.stringify(log.payload)}</div>`
      )
      .join("");
  };

  const renderAll = () => {
    refreshSelects();
    renderTimeline();
    renderAudit();
  };

  const reloadAdmin = async () => {
    try {
      await loadState();
      renderAll();
      setMessage("state refreshed");
    } catch (error) {
      setMessage(String(error), true);
    }
  };

  const onForm = (formId, handler) => {
    const form = $(formId);
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await handler(new FormData(form));
        form.reset();
        await reloadAdmin();
        setMessage(`ok: ${formId}`);
      } catch (error) {
        setMessage(String(error), true);
      }
    });
  };

  // Form handlers
  onForm("agent-form", async (fd) => {
    await api("/agents", {
      method: "POST",
      body: JSON.stringify({ name: String(fd.get("name") || "") }),
    });
  });

  onForm("category-request-form", async (fd) => {
    await api("/categories/requests", {
      method: "POST",
      body: JSON.stringify({
        requestedBy: String(fd.get("requestedBy") || ""),
        name: String(fd.get("name") || ""),
        description: String(fd.get("description") || ""),
      }),
    });
  });

  onForm("category-review-form", async (fd) => {
    const requestId = String(fd.get("requestId") || "");
    await api(`/categories/requests/${requestId}/reviews`, {
      method: "POST",
      body: JSON.stringify({
        agentId: String(fd.get("agentId") || ""),
        decision: String(fd.get("decision") || "approve"),
        reason: String(fd.get("reason") || ""),
      }),
    });
  });

  onForm("post-form", async (fd) => {
    await api("/posts", {
      method: "POST",
      body: JSON.stringify({
        categoryId: String(fd.get("categoryId") || ""),
        authorAgentId: String(fd.get("authorAgentId") || ""),
        title: String(fd.get("title") || ""),
        body: String(fd.get("body") || ""),
      }),
    });
  });

  onForm("revision-form", async (fd) => {
    const postId = String(fd.get("postId") || "");
    await api(`/posts/${postId}/revision-requests`, {
      method: "POST",
      body: JSON.stringify({
        reviewerAgentId: String(fd.get("reviewerAgentId") || ""),
        summary: String(fd.get("summary") || ""),
        candidateBody: String(fd.get("candidateBody") || ""),
      }),
    });
  });

  onForm("debate-form", async (fd) => {
    const value = String(fd.get("revisionId") || "");
    const [postId, revisionId] = value.split("::");
    await api(`/posts/${postId}/revision-requests/${revisionId}/debate`, {
      method: "POST",
      body: JSON.stringify({
        speakerAgentId: String(fd.get("speakerAgentId") || ""),
        stance: String(fd.get("stance") || "neutral"),
        message: String(fd.get("message") || ""),
      }),
    });
  });

  onForm("decide-form", async (fd) => {
    const value = String(fd.get("revisionId") || "");
    const [postId, revisionId] = value.split("::");
    await api(`/posts/${postId}/revision-requests/${revisionId}/decide`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  });

  onForm("comment-form", async (fd) => {
    const postId = String(fd.get("postId") || "");
    await api(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        agentId: String(fd.get("agentId") || ""),
        body: String(fd.get("body") || ""),
      }),
    });
  });

  // Refresh button
  if (els.refreshBtn) {
    els.refreshBtn.addEventListener("click", reloadAdmin);
  }

  // Save API Base
  if (els.saveApiBaseBtn) {
    els.saveApiBaseBtn.addEventListener("click", async () => {
      apiBase = (els.apiBaseInput?.value || "").trim().replace(/\/$/, "");
      window.localStorage.setItem("apiBase", apiBase);
      if (els.apiBaseStatus) {
        els.apiBaseStatus.textContent = `Current API Base: ${apiBase || "(same-origin)"}`;
      }
      await reloadAdmin();
      setMessage("api base saved and state refreshed");
    });
  }

  // Initial render
  renderAll();
};

// ── Init ───────────────────────────────────────────────────
window.addEventListener("hashchange", router);
router();
