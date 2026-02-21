#!/usr/bin/env python3
import json
import sys
from typing import Any


def load_input() -> dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        raise ValueError("empty input")
    return json.loads(raw)


def score_message(text: str) -> int:
    length_score = 2 if len(text) >= 120 else 1 if len(text) >= 50 else 0
    evidence_keywords = ["because", "therefore", "근거", "이유", "예시", "source", "evidence"]
    keyword_score = 1 if any(k in text.lower() for k in evidence_keywords) else 0
    return length_score + keyword_score


def top_turns_as_citations(debate: list[dict[str, Any]], max_items: int = 3) -> list[dict[str, Any]]:
    scored: list[tuple[int, dict[str, Any]]] = []
    for turn in debate:
        quality = score_message(str(turn.get("message", "")))
        score = 1 + quality
        scored.append((score, turn))

    scored.sort(key=lambda x: x[0], reverse=True)
    results: list[dict[str, Any]] = []
    for _, turn in scored[:max_items]:
        message = str(turn.get("message", "")).strip()
        excerpt = message[:180] + ("..." if len(message) > 180 else "")
        results.append(
            {
                "turnId": str(turn.get("id", "")),
                "speakerAgentId": str(turn.get("speakerAgentId", "")),
                "stance": str(turn.get("stance", "neutral")),
                "excerpt": excerpt,
                "rationale": "Selected by heuristic relevance score.",
            }
        )
    return results


def heuristic_decision(payload: dict[str, Any]) -> dict[str, Any]:
    revision = payload.get("revision", {})
    debate = revision.get("debate", [])

    support_votes = 0
    oppose_votes = 0

    for turn in debate:
        stance = turn.get("stance", "neutral")
        message = str(turn.get("message", ""))
        quality = score_message(message)

        if stance == "support":
            support_votes += 1 + quality
        elif stance == "oppose":
            oppose_votes += 1 + quality

    candidate_body = str(revision.get("candidateBody", "")).strip()
    summary = str(revision.get("summary", "")).strip()

    if not debate:
        return {
            "accepted": False,
            "reason": "No AI debate turns were provided.",
            "supportCount": support_votes,
            "opposeCount": oppose_votes,
            "confidence": 0.95,
            "model": "heuristic-v2",
            "citations": [],
        }

    if len(candidate_body) < 20 or len(summary) < 10:
        return {
            "accepted": False,
            "reason": "Revision payload is too weak (summary/body too short).",
            "supportCount": support_votes,
            "opposeCount": oppose_votes,
            "confidence": 0.92,
            "model": "heuristic-v2",
            "citations": top_turns_as_citations(debate),
        }

    accepted = support_votes > oppose_votes
    margin = abs(support_votes - oppose_votes)
    confidence = min(0.55 + (margin * 0.06), 0.96)
    reason = (
        "Accepted: supportive AI arguments outweighed objections."
        if accepted
        else "Rejected: opposing AI arguments were stronger or tied."
    )

    return {
        "accepted": accepted,
        "reason": reason,
        "supportCount": support_votes,
        "opposeCount": oppose_votes,
        "confidence": round(confidence, 3),
        "model": "heuristic-v2",
        "citations": top_turns_as_citations(debate),
    }


def main() -> int:
    payload = load_input()
    sys.stdout.write(json.dumps(heuristic_decision(payload), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        sys.stderr.write(str(exc))
        raise
