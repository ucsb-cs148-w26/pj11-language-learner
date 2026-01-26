import json
import sys
from typing import Any, Dict

import requests

BASE_URL = "http://localhost:3000"  # or http://192.168.0.28:3000
USER_ID = "u_test_1"


def pretty(resp: requests.Response) -> None:
    print(f"\n[{resp.request.method}] {resp.url}")
    print(f"Status: {resp.status_code}")
    ctype = resp.headers.get("content-type", "")
    if "application/json" in ctype:
        try:
            print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
        except Exception:
            print(resp.text)
    else:
        print(resp.text)


def post_profile() -> None:
    url = f"{BASE_URL}/api/profile"
    payload: Dict[str, Any] = {
        "user_id": USER_ID,
        "email": "u_test_1@example.com",
        "first_name": "Test",
        "last_name": "User",
        "level": "beginner",
        "target_languages": ["Spanish", "Japanese"],
        "native_language": "Chinese",
        "bio": "Hello from python test script!",
    }
    resp = requests.post(url, json=payload, timeout=15)
    pretty(resp)


def get_profile() -> None:
    url = f"{BASE_URL}/api/profile/{USER_ID}"
    resp = requests.get(url, timeout=15)
    pretty(resp)


def patch_profile() -> None:
    url = f"{BASE_URL}/api/profile/{USER_ID}"
    payload: Dict[str, Any] = {
        "bio": "Updated bio from PATCH (python)!",
        "level": "intermediate",
        "target_languages": ["Spanish"],
        "profile_picture_url": None,
    }
    resp = requests.patch(url, json=payload, timeout=15)
    pretty(resp)


def delete_profile() -> None:
    url = f"{BASE_URL}/api/profile/{USER_ID}"
    resp = requests.delete(url, timeout=15)
    pretty(resp)


def negative_tests() -> None:
    # 1) Missing required fields (POST) -> 400
    url = f"{BASE_URL}/api/profile"
    resp = requests.post(url, json={"user_id": USER_ID}, timeout=15)
    pretty(resp)

    # 2) Unknown keys (POST) -> 400
    resp = requests.post(
        url,
        json={
            "user_id": USER_ID,
            "email": "x@y.com",
            "first_name": "A",
            "last_name": "B",
            "level": "beginner",
            "target_languages": ["Spanish"],
            "native_language": "English",
            "bio": "hi",
            "created_at": "nope",  # unknown key
        },
        timeout=15,
    )
    pretty(resp)

    # 3) Bad level -> 400
    resp = requests.post(
        url,
        json={
            "user_id": USER_ID,
            "email": "x@y.com",
            "first_name": "A",
            "last_name": "B",
            "level": "expert",  # invalid
            "target_languages": ["Spanish"],
            "native_language": "English",
            "bio": "hi",
        },
        timeout=15,
    )
    pretty(resp)


def main() -> None:
    print("=== 1) POST (create) ===")
    post_profile()

    print("\n=== 2) GET (fetch) ===")
    get_profile()

    print("\n=== 3) PATCH (update) ===")
    patch_profile()

    print("\n=== 4) GET (fetch after patch) ===")
    get_profile()

    print("\n=== 5) DELETE (remove) ===")
    delete_profile()

    print("\n=== 6) GET (should be 404) ===")
    get_profile()

    print("\n=== 7) Negative tests ===")
    negative_tests()


if __name__ == "__main__":
    try:
        main()
    except requests.RequestException as e:
        print(f"Request failed: {e}", file=sys.stderr)
        sys.exit(1)
