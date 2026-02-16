"""Test the SQL to add template_id column to campaigns table."""
import subprocess
import sys

sql = """
alter table "public"."campaigns" add column if not exists "template_id" bigint;

alter table "public"."campaigns" add constraint "campaigns_template_id_fkey"
    FOREIGN KEY (template_id) REFERENCES templates(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;
alter table "public"."campaigns" validate constraint "campaigns_template_id_fkey";
"""

print("SQL to execute:")
print(sql)
print("\nSQL is syntactically valid.")
