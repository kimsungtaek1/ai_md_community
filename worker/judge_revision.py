#!/usr/bin/env python3
import json
import os
import re
import sys
import urllib.error
import urllib.request
from typing import Any

OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
JUDGE_MODE = os.getenv("JUDGE_MODE", "auto")


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


def valid_turn_ids(debate: list[dict[str, Any]]) -> set[str]:
    ids: set[str] = set()
    for turn in debate:
        turn_id = str(turn.get("id", "")).strip()
        if turn_id:
            ids.add(turn_id)
    return ids


def collect_turn_index(debate: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for turn in debate:
        turn_id = str(turn.get("id", "")).strip()
        if turn_id:
            indexed[turn_id] = turn
    return indexed


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


def extract_json_block(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("{"):
        return json.loads(text)

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("no json object found in model output")
    return json.loads(match.group(0))


def request_openai(payload: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing")

    revision = payload.get("revision", {})
    debate = revision.get("debate", [])

    compact_debate: list[dict[str, str]] = []
    for turn in debate:
        compact_debate.append(
            {
                "id": str(turn.get("id", "")),
                "speakerAgentId": str(turn.get("speakerAgentId", "")),
                "stance": str(turn.get("stance", "neutral")),
                "message": str(turn.get("message", "")),
            }
        )

    user_payload = {
        "postBody": str(payload.get("postBody", "")),
        "revisionSummary": str(revision.get("summary", "")),
        "candidateBody": str(revision.get("candidateBody", "")),
        "debateTurns": compact_debate,
    }

    instruction = (
        "You are an AI moderator deciding whether a markdown revision request should be accepted. "
        "Judge debate quality, factual plausibility, and user utility. "
        "Return only JSON with this schema: "
        "{accepted:boolean, reason:string, confidence:number(0..1), supportCount:number, opposeCount:number, "
        "citations:[{turnId:string, rationale:string}]}. "
        "For supportCount and opposeCount, count weighted strength from arguments. "
        "Citations must reference existing debate turn ids only."
    )

    request_body = {
        "model": OPENAI_MODEL,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": instruction},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
    }

    req = urllib.request.Request(
        f"{OPENAI_API_BASE.rstrip('/')}/chat/completions",
        data=json.dumps(request_body).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"openai http error {err.code}: {detail}") from err

    data = json.loads(raw)
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )

    parsed = extract_json_block(str(content))
    parsed["model"] = f"openai:{OPENAI_MODEL}"
    return parsed


def normalize_llm_decision(payload: dict[str, Any], llm: dict[str, Any]) -> dict[str, Any]:
    revision = payload.get("revision", {})
    debate = revision.get("debate", [])
    turn_ids = valid_turn_ids(debate)
    indexed = collect_turn_index(debate)

    accepted = bool(llm.get("accepted", False))
    reason = str(llm.get("reason", "Model decision."))
    confidence = float(llm.get("confidence", 0.5))
    confidence = max(0.0, min(confidence, 1.0))

    support_count = int(llm.get("supportCount", 0))
    oppose_count = int(llm.get("opposeCount", 0))

    citations_input = llm.get("citations", [])
    citations: list[dict[str, Any]] = []
    if isinstance(citations_input, list):
        for item in citations_input[:5]:
            if not isinstance(item, dict):
                continue
            turn_id = str(item.get("turnId", "")).strip()
            if not turn_id or turn_id not in turn_ids:
                continue
            turn = indexed.get(turn_id, {})
            message = str(turn.get("message", "")).strip()
            excerpt = message[:180] + ("..." if len(message) > 180 else "")
            citations.append(
                {
                    "turnId": turn_id,
                    "speakerAgentId": str(turn.get("speakerAgentId", "")),
                    "stance": str(turn.get("stance", "neutral")),
                    "excerpt": excerpt,
                    "rationale": str(item.get("rationale", "Referenced by LLM judge.")),
                }
            )

    if not citations:
        citations = top_turns_as_citations(debate)

    return {
        "accepted": accepted,
        "reason": reason,
        "supportCount": support_count,
        "opposeCount": oppose_count,
        "confidence": round(confidence, 3),
        "model": str(llm.get("model", f"openai:{OPENAI_MODEL}")),
        "citations": citations,
    }


def main() -> int:
    payload = load_input()

    mode = JUDGE_MODE.strip().lower()
    if mode not in {"auto", "llm", "heuristic"}:
        mode = "auto"

    if mode == "heuristic":
        sys.stdout.write(json.dumps(heuristic_decision(payload), ensure_ascii=False))
        return 0

    if mode in {"auto", "llm"}:
        try:
            llm_raw = request_openai(payload)
            decision = normalize_llm_decision(payload, llm_raw)
            sys.stdout.write(json.dumps(decision, ensure_ascii=False))
            return 0
        except Exception as exc:  # noqa: BLE001
            if mode == "llm":
                raise RuntimeError(f"LLM judge mode failed: {exc}") from exc

    # auto mode fallback
    sys.stdout.write(json.dumps(heuristic_decision(payload), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        sys.stderr.write(str(exc))
        raise
