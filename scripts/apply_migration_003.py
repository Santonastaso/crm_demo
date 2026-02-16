"""
Apply migration 003 via Supabase Management API.
"""
import json
import subprocess
import sys

PROJECT_REF = "ogbfripessbraswwvxtj"
MIGRATION_PATH = "supabase/migrations/20260216000003_gmail_discovery.sql"

def get_access_token():
    result = subprocess.run(
        ["bash", "-c", "echo $SUPABASE_ACCESS_TOKEN"],
        capture_output=True, text=True
    )
    token = result.stdout.strip()
    if not token:
        print("ERROR: SUPABASE_ACCESS_TOKEN not set. Export it first.")
        sys.exit(1)
    return token

def main():
    token = get_access_token()

    with open(MIGRATION_PATH, "r") as f:
        sql = f.read()

    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

    cmd = [
        "curl", "-s", "-w", "\n%{http_code}",
        "-X", "POST", url,
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"query": sql}),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    output = result.stdout.strip()
    lines = output.split("\n")
    http_code = lines[-1] if lines else "000"
    body = "\n".join(lines[:-1])

    print(f"HTTP {http_code}")
    if http_code.startswith("2"):
        print("Migration applied successfully.")
        if body:
            print(body[:500])
    else:
        print(f"FAILED: {body[:1000]}")
        sys.exit(1)

if __name__ == "__main__":
    main()
