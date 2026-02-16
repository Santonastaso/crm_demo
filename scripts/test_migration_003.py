"""
Test that migration 003 SQL syntax is valid and covers all expected changes.
"""
import re
import sys

MIGRATION_PATH = "supabase/migrations/20260216000003_gmail_discovery.sql"

EXPECTED_PATTERNS = [
    # email_accounts table
    r'create\s+table\s+"public"\."email_accounts"',
    r'"sales_id"\s+bigint',
    r'"email_address"\s+text\s+not\s+null',
    r'"access_token"\s+text\s+not\s+null',
    r'"refresh_token"\s+text\s+not\s+null',
    r'"token_expires_at"\s+timestamp',
    r'"last_sync_history_id"\s+text',
    r'"last_synced_at"\s+timestamp',
    # email_accounts RLS
    r'alter\s+table\s+"public"\."email_accounts"\s+enable\s+row\s+level\s+security',
    # email_accounts FK to sales
    r'email_accounts_sales_id_fkey',
    # discovery_prospects new columns
    r'alter\s+table\s+"public"\."discovery_prospects"\s+add\s+column\s+if\s+not\s+exists\s+"phone"\s+text',
    r'alter\s+table\s+"public"\."discovery_prospects"\s+add\s+column\s+if\s+not\s+exists\s+"website"\s+text',
    r'alter\s+table\s+"public"\."discovery_prospects"\s+add\s+column\s+if\s+not\s+exists\s+"status"\s+text',
    # communication_log new columns
    r'alter\s+table\s+"public"\."communication_log"\s+add\s+column\s+if\s+not\s+exists\s+"external_id"\s+text',
    r'alter\s+table\s+"public"\."communication_log"\s+add\s+column\s+if\s+not\s+exists\s+"subject"\s+text',
    # campaign_sends tracking_id
    r'alter\s+table\s+"public"\."campaign_sends"\s+add\s+column\s+if\s+not\s+exists\s+"tracking_id"\s+uuid',
]

def main():
    try:
        with open(MIGRATION_PATH, "r") as f:
            sql = f.read()
    except FileNotFoundError:
        print(f"FAIL: Migration file not found at {MIGRATION_PATH}")
        sys.exit(1)

    failed = 0
    for pattern in EXPECTED_PATTERNS:
        if not re.search(pattern, sql, re.IGNORECASE):
            print(f"MISSING: {pattern}")
            failed += 1
        else:
            print(f"OK: {pattern}")

    if failed:
        print(f"\n{failed} patterns missing")
        sys.exit(1)
    else:
        print(f"\nAll {len(EXPECTED_PATTERNS)} patterns found. Migration looks correct.")
        sys.exit(0)

if __name__ == "__main__":
    main()
