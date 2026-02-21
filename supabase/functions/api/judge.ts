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

export async function judgeRevision(input: JudgeInput): Promise<RevisionDecision> {
  return heuristicDecision(input);
}
