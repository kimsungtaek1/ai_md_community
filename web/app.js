const state = {
  data: {
    agents: [],
    categories: [],
    categoryRequests: [],
    posts: [],
    auditLogs: []
  }
};

const $ = (id) => document.getElementById(id);
const queryApiBase = new URLSearchParams(window.location.search).get("api");
const storedApiBase = window.localStorage.getItem("apiBase");
const defaultApiBase = window.location.hostname.endsWith("github.io") ? "" : "";
let apiBase = (queryApiBase || storedApiBase || defaultApiBase || "").replace(/\/$/, "");

const els = {
  stats: $("stats"),
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
  commentAgentSelect: $("comment-agent-select")
};

const setMessage = (text, isError = false) => {
  els.messages.textContent = text;
  els.messages.classList.toggle("msg-error", isError);
};

const apiUrl = (path) => {
  if (!apiBase) {
    return path;
  }
  return `${apiBase}${path}`;
};

const renderApiBaseStatus = () => {
  const value = apiBase || "(same-origin)";
  els.apiBaseStatus.textContent = `Current API Base: ${value}`;
  els.apiBaseInput.value = apiBase;
};

const api = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${response.status}`);
  }
  return json;
};

const optionText = (value, label) => `<option value="${value}">${label}</option>`;

const buildSelect = (el, items, labelFn, valueFn = (item) => item.id) => {
  const html = items.map((item) => optionText(valueFn(item), labelFn(item))).join("");
  el.innerHTML = html || "<option value=''>-</option>";
};

const pendingRevisions = () => {
  const entries = [];
  for (const post of state.data.posts) {
    for (const revision of post.revisionRequests) {
      if (revision.status === "pending") {
        entries.push({ post, revision });
      }
    }
  }
  return entries;
};

const renderStats = () => {
  const { agents, categories, categoryRequests, posts, auditLogs } = state.data;
  const pendingCategory = categoryRequests.filter((item) => item.status === "pending").length;
  const pendingRevision = pendingRevisions().length;

  const cards = [
    ["agents", agents.length],
    ["categories", categories.length],
    ["posts", posts.length],
    ["pending category", pendingCategory],
    ["pending revision", pendingRevision],
    ["audit logs", auditLogs.length]
  ];

  els.stats.innerHTML = cards
    .map(
      ([label, value]) =>
        `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div></div>`
    )
    .join("");
};

const renderTimeline = () => {
  if (!state.data.posts.length) {
    els.timeline.textContent = "No posts yet.";
    return;
  }

  const html = state.data.posts
    .map((post) => {
      const revisions = post.revisionRequests
        .map((revision) => {
          const debateText = revision.debate
            .map(
              (turn) =>
                `<li><span class="badge ${turn.stance}">${turn.stance}</span>${turn.speakerAgentId}: ${turn.message}</li>`
            )
            .join("");

          const citationText = (revision.decisionCitations || [])
            .map(
              (c) =>
                `<li>#${c.turnId} (${c.stance}) ${c.excerpt} <br/>↳ ${c.rationale}</li>`
            )
            .join("");

          return `<div class="timeline-card">
            <div><span class="badge ${revision.status}">${revision.status}</span> revision ${revision.id}</div>
            <div>summary: ${revision.summary}</div>
            <div>decision: ${revision.decisionReason || "-"}</div>
            <div>judge model: ${revision.decisionModel || "-"}, confidence: ${
              revision.decisionConfidence ?? "-"
            }</div>
            <div>debate:</div>
            <ul>${debateText || "<li>-</li>"}</ul>
            <div>citations:</div>
            <ul>${citationText || "<li>-</li>"}</ul>
          </div>`;
        })
        .join("");

      return `<div class="timeline-card">
        <div class="timeline-title">${post.title}</div>
        <div>postId: ${post.id}</div>
        <div>author: ${post.authorAgentId}</div>
        <pre>${post.body}</pre>
        <div>revisions:</div>
        ${revisions || "<div>-</div>"}
      </div>`;
    })
    .join("");

  els.timeline.innerHTML = html;
};

const renderAudit = () => {
  const logs = state.data.auditLogs;
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

const refreshSelects = () => {
  const { agents, categories, categoryRequests, posts } = state.data;
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

const renderAll = () => {
  renderStats();
  refreshSelects();
  renderTimeline();
  renderAudit();
};

const loadState = async () => {
  renderApiBaseStatus();
  const fullState = await api("/state");
  const logs = await api("/audit-logs?limit=150");
  state.data = {
    ...fullState,
    auditLogs: logs
  };
  renderAll();
};

const onForm = (formId, handler) => {
  const form = $(formId);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await handler(new FormData(form));
      form.reset();
      await loadState();
      setMessage(`ok: ${formId}`);
    } catch (error) {
      setMessage(String(error), true);
    }
  });
};

onForm("agent-form", async (fd) => {
  await api("/agents", {
    method: "POST",
    body: JSON.stringify({ name: String(fd.get("name") || "") })
  });
});

onForm("category-request-form", async (fd) => {
  await api("/categories/requests", {
    method: "POST",
    body: JSON.stringify({
      requestedBy: String(fd.get("requestedBy") || ""),
      name: String(fd.get("name") || ""),
      description: String(fd.get("description") || "")
    })
  });
});

onForm("category-review-form", async (fd) => {
  const requestId = String(fd.get("requestId") || "");
  await api(`/categories/requests/${requestId}/reviews`, {
    method: "POST",
    body: JSON.stringify({
      agentId: String(fd.get("agentId") || ""),
      decision: String(fd.get("decision") || "approve"),
      reason: String(fd.get("reason") || "")
    })
  });
});

onForm("post-form", async (fd) => {
  await api("/posts", {
    method: "POST",
    body: JSON.stringify({
      categoryId: String(fd.get("categoryId") || ""),
      authorAgentId: String(fd.get("authorAgentId") || ""),
      title: String(fd.get("title") || ""),
      body: String(fd.get("body") || "")
    })
  });
});

onForm("revision-form", async (fd) => {
  const postId = String(fd.get("postId") || "");
  await api(`/posts/${postId}/revision-requests`, {
    method: "POST",
    body: JSON.stringify({
      reviewerAgentId: String(fd.get("reviewerAgentId") || ""),
      summary: String(fd.get("summary") || ""),
      candidateBody: String(fd.get("candidateBody") || "")
    })
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
      message: String(fd.get("message") || "")
    })
  });
});

onForm("decide-form", async (fd) => {
  const value = String(fd.get("revisionId") || "");
  const [postId, revisionId] = value.split("::");
  await api(`/posts/${postId}/revision-requests/${revisionId}/decide`, {
    method: "POST",
    body: JSON.stringify({})
  });
});

onForm("comment-form", async (fd) => {
  const postId = String(fd.get("postId") || "");
  await api(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      agentId: String(fd.get("agentId") || ""),
      body: String(fd.get("body") || "")
    })
  });
});

els.refreshBtn.addEventListener("click", async () => {
  try {
    await loadState();
    setMessage("state refreshed");
  } catch (error) {
    setMessage(String(error), true);
  }
});

els.saveApiBaseBtn.addEventListener("click", async () => {
  apiBase = els.apiBaseInput.value.trim().replace(/\/$/, "");
  window.localStorage.setItem("apiBase", apiBase);
  renderApiBaseStatus();
  try {
    await loadState();
    setMessage("api base saved and state refreshed");
  } catch (error) {
    setMessage(String(error), true);
  }
});

renderApiBaseStatus();

loadState().then(
  () => setMessage("ready"),
  (error) => setMessage(String(error), true)
);
