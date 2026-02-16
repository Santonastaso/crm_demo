"""
Validates the foundation migration SQL by parsing it with sqlparse
and checking structural integrity. Does NOT execute against a live database.
"""
import subprocess
import sys
import os

def ensure_sqlparse():
    try:
        import sqlparse
        return sqlparse
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "sqlparse", "-q"])
        import sqlparse
        return sqlparse

def main():
    sqlparse = ensure_sqlparse()

    migration_path = os.path.join(
        os.path.dirname(__file__), "..",
        "supabase", "migrations", "20260216000001_foundation.sql"
    )

    with open(migration_path, "r") as f:
        sql_content = f.read()

    statements = sqlparse.split(sql_content)
    statements = [s.strip() for s in statements if s.strip() and not s.strip().startswith("--")]

    print(f"Total SQL statements parsed: {len(statements)}")

    expected_tables = [
        "projects", "project_pipelines", "segments", "segment_contacts",
        "conversations", "messages", "knowledge_documents", "document_chunks",
        "bookings", "discovery_scans", "discovery_prospects", "campaigns",
        "campaign_steps", "campaign_sends", "templates", "communication_log",
    ]

    create_tables_found = []
    rls_enabled = []
    policies_found = []
    grants_found = 0
    errors = []

    sql_lower = sql_content.lower()
    for t in expected_tables:
        if f'create table "public"."{t}"' in sql_lower:
            create_tables_found.append(t)
        if f'"{t}" enable row level security' in sql_lower:
            rls_enabled.append(t)

    for stmt in statements:
        lower = stmt.lower()
        if "create policy" in lower:
            policies_found.append(stmt[:80])
        if lower.startswith("grant"):
            grants_found += 1

    missing_tables = set(expected_tables) - set(create_tables_found)
    if missing_tables:
        errors.append(f"Missing CREATE TABLE for: {missing_tables}")

    missing_rls = set(expected_tables) - set(rls_enabled)
    if missing_rls:
        errors.append(f"Missing RLS enable for: {missing_rls}")

    if policies_found:
        print(f"RLS policies created: {len(policies_found)}")
    else:
        errors.append("No RLS policies found")

    print(f"Tables created: {len(create_tables_found)}/{len(expected_tables)}")
    print(f"RLS enabled: {len(rls_enabled)}/{len(expected_tables)}")
    print(f"Grant statements: {grants_found}")

    # Check for pgvector extension
    if "create extension" not in sql_content.lower() or "vector" not in sql_content.lower():
        errors.append("pgvector extension not found")

    # Check for role migration
    if "user_role" not in sql_content.lower():
        errors.append("user_role enum not found")

    # Check for similarity search function
    if "match_document_chunks" not in sql_content:
        errors.append("match_document_chunks function not found")

    if errors:
        print("\nERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nAll structural checks passed.")

if __name__ == "__main__":
    main()
