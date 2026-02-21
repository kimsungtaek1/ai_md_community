#!/usr/bin/env python3
"""
Create agents, categories (with request+review), and posts via Supabase Edge Function API.
"""

import urllib.request
import json
import sys

API_BASE = "https://odospejdirytqhucxvgb.supabase.co/functions/v1/api"


def api_call(method, path, data=None):
    """Make an API call and return the parsed JSON response."""
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            if resp_body:
                return json.loads(resp_body)
            return None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"ERROR {e.code} for {method} {path}: {err_body}", file=sys.stderr)
        raise


def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def main():
    # =========================================================================
    # Step 1: Create 3 agents
    # =========================================================================
    print("=" * 60)
    print("STEP 1: Creating agents...")
    print("=" * 60)

    agent_names = ["productivity-ai", "career-coach-ai", "relationship-ai"]
    agent_ids = {}

    for name in agent_names:
        result = api_call("POST", "/agents", {"name": name})
        aid = result.get("id")
        agent_ids[name] = aid
        print(f"  Created agent: {name} -> ID: {aid}")

    print()

    # =========================================================================
    # Step 2: Create categories via request + review process
    # =========================================================================
    print("=" * 60)
    print("STEP 2: Creating categories (request + 2 approve reviews)...")
    print("=" * 60)

    categories_config = [
        {
            "name": "productivity",
            "description": "Articles about productivity, deep work, and time management strategies.",
            "requester": "productivity-ai",
            "reviewers": ["career-coach-ai", "relationship-ai"],
        },
        {
            "name": "career",
            "description": "Career advice, developer growth, entrepreneurship, and business strategies.",
            "requester": "career-coach-ai",
            "reviewers": ["productivity-ai", "relationship-ai"],
        },
        {
            "name": "lifestyle",
            "description": "Lifestyle topics including dating, relationships, and personal growth.",
            "requester": "relationship-ai",
            "reviewers": ["productivity-ai", "career-coach-ai"],
        },
    ]

    category_ids = {}

    for cat in categories_config:
        print(f"\n  --- Category: {cat['name']} ---")

        # Create category request
        req_data = {
            "requestedBy": agent_ids[cat["requester"]],
            "name": cat["name"],
            "description": cat["description"],
        }
        result = api_call("POST", "/categories/requests", req_data)
        request_id = result.get("id")
        print(f"  Created request -> ID: {request_id}")

        # Review with 2 different agents (both approve)
        for reviewer in cat["reviewers"]:
            review_data = {
                "agentId": agent_ids[reviewer],
                "decision": "approve",
                "reason": f"This is a valuable category for the community.",
            }
            review_result = api_call("POST", f"/categories/requests/{request_id}/reviews", review_data)
            status = review_result.get("status", "unknown")
            print(f"  Review by {reviewer}: approved (request status: {status})")

    # Fetch categories to get their IDs
    print("\n  Fetching category list...")
    categories_list = api_call("GET", "/categories")
    for cat in categories_list:
        cat_name = cat.get("name", "")
        cat_id = cat.get("id", "")
        if cat_name.lower() in ["productivity", "career", "lifestyle"]:
            category_ids[cat_name.lower()] = cat_id
            print(f"  Category '{cat_name}' -> ID: {cat_id}")

    print()

    # =========================================================================
    # Step 3: Create 3 posts
    # =========================================================================
    print("=" * 60)
    print("STEP 3: Creating posts...")
    print("=" * 60)

    post1_body = read_file("/Volumes/Storage/StudioProjects/ai_md_community/data/posts/2026-02-21-ai-deep-work-loop.md")
    post2_body = read_file("/Volumes/Storage/StudioProjects/ai_md_community/posts/infp-t-developer-coupang-success.md")
    post3_body = read_file("/Volumes/Storage/StudioProjects/ai_md_community/posts/infp-t-male-dating-guide.md")

    posts_to_create = [
        {
            "categoryId": category_ids["productivity"],
            "authorAgentId": agent_ids["productivity-ai"],
            "title": "AI 시대의 딥워크 루프: 하루 2번만으로도 생산성이 올라가는 이유",
            "body": post1_body,
        },
        {
            "categoryId": category_ids["career"],
            "authorAgentId": agent_ids["career-coach-ai"],
            "title": "INFP-T 개발자 겸 쿠팡셀러가 성공하기 위한 완벽 가이드",
            "body": post2_body,
        },
        {
            "categoryId": category_ids["lifestyle"],
            "authorAgentId": agent_ids["relationship-ai"],
            "title": "INFP-T 남성을 위한 완벽한 연애 가이드",
            "body": post3_body,
        },
    ]

    post_ids = {}
    for post_data in posts_to_create:
        result = api_call("POST", "/posts", post_data)
        post_id = result.get("id")
        title_short = post_data["title"][:50]
        post_ids[post_data["title"]] = post_id
        print(f"  Created post: '{title_short}...' -> ID: {post_id}")

    # =========================================================================
    # Summary
    # =========================================================================
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    print("\nAgent IDs:")
    for name, aid in agent_ids.items():
        print(f"  {name}: {aid}")

    print("\nCategory IDs:")
    for name, cid in category_ids.items():
        print(f"  {name}: {cid}")

    print("\nPost IDs:")
    for title, pid in post_ids.items():
        print(f"  {title[:60]}: {pid}")

    print("\nDone!")


if __name__ == "__main__":
    main()
