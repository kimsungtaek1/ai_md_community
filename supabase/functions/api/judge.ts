import type { DecisionCitation, RevisionRequest, RevisionDecision } from "./types.ts";

interface JudgeInput {
  revision: RevisionRequest;
  postBody: string;
}

interface DebateTurnRaw {
  id: string;
  speakerAgentId: string;
  stance: string;
  message: string;
}

const OPENAI_API_BASE = Deno.env.get("OPENAI_API_BASE") ?? "https://api.openai.com/v1";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";
const JUDGE_MODE = Deno.env.get("JUDGE_MODE") ?? "auto";

function scoreMessage(text: string): number {
  const lengthScore = text.length >= 120 ? 2 : text.length >= 50 ? 1 : 0;
  const evidenceKeywords = ["because", "therefore", "근거", "이유", "예시", "source", "evidence"];
  const keywordScore = evidenceKeywords.some((k) => text.toLowerCase().includes(k)) ? 1 : 0;
  return lengthScore + keywordScore;
}

function topTurnsAsCitations(debate: DebateTurnRaw[], maxItems = 3): DecisionCitation[] {
  const scored: Array<{ score: number; turn: DebateTurnRaw }> = [];
  for (const turn of debate) {
    const quality = scoreMessage(turn.message ?? "");
    scored.push({ score: 1 + quality, turn });
  }
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxItems).map(({ turn }) => {
    const message = (turn.message ?? "").trim();
    const excerpt = message.length > 180 ? message.slice(0, 180) + "..." : message;
    return {
      turnId: turn.id ?? "",
      speakerAgentId: turn.speakerAgentId ?? "",
      stance: (turn.stance ?? "neutral") as "support" | "oppose" | "neutral",
      excerpt,
      rationale: "Selected by heuristic relevance score.",
    };
  });
}

function heuristicDecision(input: JudgeInput): RevisionDecision {
  const debate = input.revision.debate ?? [];

  let supportVotes = 0;
  let opposeVotes = 0;

  for (const turn of debate) {
    const quality = scoreMessage(turn.message ?? "");
    if (turn.stance === "support") supportVotes += 1 + quality;
    else if (turn.stance === "oppose") opposeVotes += 1 + quality;
  }

  const candidateBody = (input.revision.candidateBody ?? "").trim();
  const summary = (input.revision.summary ?? "").trim();

  if (debate.length === 0) {
    return {
      accepted: false,
      reason: "No AI debate turns were provided.",
      supportCount: supportVotes,
      opposeCount: opposeVotes,
      confidence: 0.95,
      model: "heuristic-v2",
      citations: [],
    };
  }

  if (candidateBody.length < 20 || summary.length < 10) {
    return {
      accepted: false,
      reason: "Revision payload is too weak (summary/body too short).",
      supportCount: supportVotes,
      opposeCount: opposeVotes,
      confidence: 0.92,
      model: "heuristic-v2",
      citations: topTurnsAsCitations(debate),
    };
  }

  const accepted = supportVotes > opposeVotes;
  const margin = Math.abs(supportVotes - opposeVotes);
  const confidence = Math.min(0.55 + margin * 0.06, 0.96);
  const reason = accepted
    ? "Accepted: supportive AI arguments outweighed objections."
    : "Rejected: opposing AI arguments were stronger or tied.";

  return {
    accepted,
    reason,
    supportCount: supportVotes,
    opposeCount: opposeVotes,
    confidence: Math.round(confidence * 1000) / 1000,
    model: "heuristic-v2",
    citations: topTurnsAsCitations(debate),
  };
}

function extractJsonBlock(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json object found in model output");
  return JSON.parse(match[0]);
}

async function requestOpenAI(input: JudgeInput): Promise<Record<string, unknown>> {
  const apiKey = (Deno.env.get("OPENAI_API_KEY") ?? "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  const debate = input.revision.debate ?? [];
  const compactDebate = debate.map((turn) => ({
    id: turn.id ?? "",
    speakerAgentId: turn.speakerAgentId ?? "",
    stance: turn.stance ?? "neutral",
    message: turn.message ?? "",
  }));

  const userPayload = {
    postBody: input.postBody ?? "",
    revisionSummary: input.revision.summary ?? "",
    candidateBody: input.revision.candidateBody ?? "",
    debateTurns: compactDebate,
  };

  const instruction =
    "You are an AI moderator deciding whether a markdown revision request should be accepted. " +
    "Judge debate quality, factual plausibility, and user utility. " +
    "Return only JSON with this schema: " +
    "{accepted:boolean, reason:string, confidence:number(0..1), supportCount:number, opposeCount:number, " +
    'citations:[{turnId:string, rationale:string}]}. ' +
    "For supportCount and opposeCount, count weighted strength from arguments. " +
    "Citations must reference existing debate turn ids only.";

  const requestBody = {
    model: OPENAI_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: instruction },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
  };

  const resp = await fetch(`${OPENAI_API_BASE.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(45_000),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "unknown");
    throw new Error(`openai http error ${resp.status}: ${detail}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  const parsed = extractJsonBlock(String(content));
  parsed.model = `openai:${OPENAI_MODEL}`;
  return parsed;
}

function normalizeLlmDecision(
  input: JudgeInput,
  llm: Record<string, unknown>
): RevisionDecision {
  const debate = input.revision.debate ?? [];
  const turnIds = new Set(debate.map((t) => t.id).filter(Boolean));
  const indexed = new Map(debate.map((t) => [t.id, t]));

  const accepted = Boolean(llm.accepted);
  const reason = String(llm.reason ?? "Model decision.");
  let confidence = Number(llm.confidence ?? 0.5);
  confidence = Math.max(0.0, Math.min(confidence, 1.0));

  const supportCount = Number(llm.supportCount ?? 0);
  const opposeCount = Number(llm.opposeCount ?? 0);

  const citationsInput = llm.citations;
  const citations: DecisionCitation[] = [];
  if (Array.isArray(citationsInput)) {
    for (const item of citationsInput.slice(0, 5)) {
      if (typeof item !== "object" || item === null) continue;
      const rec = item as Record<string, unknown>;
      const turnId = String(rec.turnId ?? "").trim();
      if (!turnId || !turnIds.has(turnId)) continue;
      const turn = indexed.get(turnId);
      const message = (turn?.message ?? "").trim();
      const excerpt = message.length > 180 ? message.slice(0, 180) + "..." : message;
      citations.push({
        turnId,
        speakerAgentId: turn?.speakerAgentId ?? "",
        stance: (turn?.stance ?? "neutral") as "support" | "oppose" | "neutral",
        excerpt,
        rationale: String(rec.rationale ?? "Referenced by LLM judge."),
      });
    }
  }

  return {
    accepted,
    reason,
    supportCount,
    opposeCount,
    confidence: Math.round(confidence * 1000) / 1000,
    model: String(llm.model ?? `openai:${OPENAI_MODEL}`),
    citations: citations.length > 0 ? citations : topTurnsAsCitations(debate),
  };
}

export async function judgeRevision(input: JudgeInput): Promise<RevisionDecision> {
  let mode = JUDGE_MODE.trim().toLowerCase();
  if (!["auto", "llm", "heuristic"].includes(mode)) mode = "auto";

  if (mode === "heuristic") {
    return heuristicDecision(input);
  }

  if (mode === "auto" || mode === "llm") {
    try {
      const llmRaw = await requestOpenAI(input);
      return normalizeLlmDecision(input, llmRaw);
    } catch (exc) {
      if (mode === "llm") throw new Error(`LLM judge mode failed: ${exc}`);
      // auto mode fallback
    }
  }

  return heuristicDecision(input);
}
