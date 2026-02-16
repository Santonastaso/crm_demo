# Supabase Integration Guide for LLMs

This document explains how to interact with the Supabase backend for this CRM project. It covers database access, Edge Function deployment, secret management, and the patterns that work reliably from an LLM coding agent context.

---

## Project Identifiers

| Key | Value |
|-----|-------|
| Project ref | `ogbfripessbraswwvxtj` |
| Region | East US (North Virginia) |
| Supabase URL | `https://ogbfripessbraswwvxtj.supabase.co` |
| Dashboard | `https://supabase.com/dashboard/project/ogbfripessbraswwvxtj` |

---

## Authentication & Keys

### Frontend (Vite)

Stored in `.env.local`:

```
VITE_SUPABASE_URL=https://ogbfripessbraswwvxtj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...  (full JWT, role=anon)
```

The frontend creates a Supabase client in `src/atomic-crm/providers/supabase/supabase.ts` using these.

### API Keys (from `supabase projects api-keys`)

| Name | Purpose |
|------|---------|
| `anon` | Public key for frontend/unauthenticated requests. Embedded in `.env.local`. |
| `service_role` | Full-access key used by Edge Functions. NEVER expose to frontend. |

### Management API Token

The Supabase CLI authenticates via `$SUPABASE_ACCESS_TOKEN` (env var). This is a personal access token (prefix `sbp_`). It is required for:
- `supabase functions deploy`
- `supabase secrets list/set`
- `supabase projects api-keys`
- **Running SQL via the Management API** (see below)

### Edge Function Secrets

All secrets are set via `supabase secrets set --project-ref ogbfripessbraswwvxtj KEY=VALUE`.

Current secrets:

| Secret | Used By |
|--------|---------|
| `ANTHROPIC_API_KEY` | `chat` (Claude API) |
| `OPENAI_API_KEY` | `chat`, `process-document` (embeddings via `_shared/embeddings.ts`) |
| `CALCOM_API_KEY` | `book-videocall` |
| `GOOGLE_MAPS_API_KEY` | `discovery-scan` |
| `GOOGLE_OAUTH_CLIENT_ID` | `gmail-auth`, `gmail-send`, `gmail-sync` (via `_shared/gmailToken.ts`) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Same as above |
| `TWILIO_ACCOUNT_SID` | `sms-send`, `sms-webhook` |
| `TWILIO_AUTH_TOKEN` | `sms-send`, `sms-webhook` |
| `TWILIO_FROM_NUMBER` | `sms-send` |
| `WHATSAPP_ACCESS_TOKEN` | `whatsapp-send`, `whatsapp-webhook` |
| `WHATSAPP_PHONE_NUMBER_ID` | `whatsapp-send`, `whatsapp-webhook` |
| `WHATSAPP_VERIFY_TOKEN` | `whatsapp-webhook` (GET verification) |
| `FRONTEND_URL` | `gmail-auth` (OAuth redirect) |
| `SUPABASE_URL` | Auto-injected by Supabase runtime |
| `SUPABASE_ANON_KEY` | Auto-injected |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected |
| `SUPABASE_DB_URL` | Available but not directly used (Edge Functions use REST) |

---

## Running SQL Against the Database

### The Problem

Direct database connections (`psql`, `supabase db push`) often fail from local machines due to network restrictions (Supabase Pooler returns "Bad file descriptor"). The Supabase CLI `db push` command requires `supabase link` which may not persist across sessions.

### What Works: Management API

The **Supabase Management API** at `https://api.supabase.com` accepts SQL queries and returns JSON results. This is the most reliable method.

**Endpoint:**
```
POST https://api.supabase.com/v1/projects/{project_ref}/database/query
```

**Headers:**
```
Authorization: Bearer $SUPABASE_ACCESS_TOKEN
Content-Type: application/json
User-Agent: Mozilla/5.0
```

> **CRITICAL**: The `User-Agent: Mozilla/5.0` header is REQUIRED. Without it, Cloudflare blocks the request with error code 1010. Python's `urllib` default user agent (`Python-urllib/3.x`) gets blocked. `curl` works by default because it sends a `curl/x.y.z` user agent.

**Body:**
```json
{"query": "SELECT 1 AS test"}
```

**Response:** JSON array of rows, e.g. `[{"test":1}]`

### curl Example

```bash
ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN"
curl -s -X POST "https://api.supabase.com/v1/projects/ogbfripessbraswwvxtj/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0" \
  -d '{"query":"SELECT table_name FROM information_schema.tables WHERE table_schema='\''public'\'' LIMIT 5"}'
```

### Python Example

```python
import os, json, urllib.request, urllib.error

PROJECT_REF = "ogbfripessbraswwvxtj"
ACCESS_TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

def run_sql(sql):
    body = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(API_URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",  # REQUIRED — Cloudflare blocks Python default UA
    })
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
```

### Best Practices for Migrations

1. **Always write the migration SQL file** first (in `supabase/migrations/`) for version control.
2. **Use a Python script** to apply it via the Management API in blocks.
3. **Wrap DDL in `DO $$ ... EXCEPTION ... END $$` blocks** for idempotency:
   ```sql
   DO $$ BEGIN
     ALTER TABLE "public"."my_table" ADD CONSTRAINT "my_fkey"
       FOREIGN KEY (col) REFERENCES other(id);
   EXCEPTION WHEN duplicate_object THEN NULL;
   END $$;
   ```
4. **Use `CREATE TABLE IF NOT EXISTS`** and `ADD COLUMN IF NOT EXISTS`.
5. **Split large migrations** into separate API calls — the endpoint handles one logical block at a time better than a massive multi-statement string.
6. **Status 201** = success (not just 200). Both are valid.
7. **Verify after applying** by querying `information_schema.tables`, `information_schema.columns`, and `pg_policies`.

### What Does NOT Work

| Method | Issue |
|--------|-------|
| `psql` to pooler (`aws-0-us-east-1.pooler.supabase.com`) | "Bad file descriptor" — network-level block |
| `psql` to direct host (`db.{ref}.supabase.co`) | DNS resolution fails |
| `supabase db push --linked` | Requires `supabase link` which doesn't persist |
| `supabase db push --db-url` | Same network issue as psql |
| PostgREST `/rest/v1/rpc/exec_sql` | No such function exists by default |
| Management API without `User-Agent` header | Cloudflare 1010 error |

---

## Edge Functions

### Deploying

```bash
supabase functions deploy <function-name> --project-ref ogbfripessbraswwvxtj --no-verify-jwt
```

The `--no-verify-jwt` flag is used because some functions (webhooks, public chat) accept unauthenticated requests.

### Function Inventory

| Function | Method | Purpose |
|----------|--------|---------|
| `chat` | POST | AI conversational assistant (Claude + RAG + tools) |
| `process-document` | POST | PDF extraction, chunking, embedding for knowledge base |
| `gmail-auth` | GET | OAuth2 flow for connecting Gmail accounts |
| `gmail-send` | POST | Send email via Gmail API with tracking |
| `gmail-sync` | POST | Sync inbox from Gmail and log to CRM |
| `whatsapp-send` | POST | Send WhatsApp messages via Meta Cloud API |
| `whatsapp-webhook` | GET/POST | Receive WhatsApp messages, forward to AI |
| `sms-send` | POST | Send SMS via Twilio |
| `sms-webhook` | POST | Receive inbound SMS from Twilio |
| `campaign-send` | POST | Execute multi-channel campaigns |
| `segments-refresh` | POST | Recompute segment membership from criteria |
| `book-videocall` | POST | Book video calls via Cal.com API |
| `discovery-scan` | POST | Google Places lead discovery |
| `email-track` | GET | Pixel/redirect tracking for email opens/clicks |
| `users` | POST/PATCH | User invitation and management |
| `updatePassword` | POST | Trigger password reset email |
| `postmark` | POST | Inbound email webhook (Postmark) |

### Shared Modules (`supabase/functions/_shared/`)

| Module | Export | Purpose |
|--------|--------|---------|
| `supabaseAdmin.ts` | `supabaseAdmin` | Supabase client with service role key |
| `utils.ts` | `corsHeaders`, `createErrorResponse` | CORS headers and error response factory |
| `requestHandler.ts` | `requirePost(req)` | Returns 204 for OPTIONS, 405 for non-POST, null for POST |
| `communicationLog.ts` | `logCommunication`, `logCommunicationBatch` | Insert into `communication_log` table |
| `embeddings.ts` | `generateEmbedding` | OpenAI text-embedding-3-small |
| `gmailToken.ts` | `getValidGmailToken`, `refreshGoogleAccessToken` | Gmail OAuth token refresh |
| `invokeFunction.ts` | `invokeEdgeFunction(name, body)` | Call another Edge Function internally with service role |

### Calling Edge Functions from Frontend

```typescript
const res = await fetch(`${SUPABASE_URL}/functions/v1/<function-name>`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,  // or user JWT
    apikey: SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({ ... }),
});
```

### Calling Edge Functions from Other Edge Functions

```typescript
import { invokeEdgeFunction } from "../_shared/invokeFunction.ts";

const response = await invokeEdgeFunction("whatsapp-send", {
  to: "+39...",
  message: "Hello",
});
```

---

## Database Schema (Key Tables)

### Core CRM
- `sales` — CRM users (agents, managers, admins)
- `contacts` — Leads/clients (has `lead_type`, `email_jsonb`, `phone_jsonb`, `tags`)
- `contacts_summary` — View joining contacts + companies + task count + lead_type
- `companies` — Business entities
- `deals` — Sales pipeline deals (has `project_id`, `unit_id`, `stage`, `amount`)
- `dealInteractions` — Interaction log per deal (has `amount`, `offer_status` for offers)
- `contactNotes` / `dealNotes` — Notes on contacts and deals
- `tasks` — To-do items linked to contacts
- `tags` — Tag definitions (name, color)
- `reminders` — Scheduled reminders

### Real Estate
- `projects` — Real estate development projects
- `project_pipelines` — Custom pipeline stages per project
- `property_units` — Individual units within projects (apartments, etc.)
- `unit_documents` — Documents attached to units (stored in `unit-documents` bucket)

### Communication
- `conversations` — Chat/WhatsApp/email conversation threads
- `messages` — Messages within conversations
- `communication_log` — Unified log of all communications across channels
- `email_accounts` — Gmail OAuth credentials per sales user

### AI & Knowledge
- `knowledge_documents` — Uploaded documents for RAG
- `document_chunks` — Chunked text with vector embeddings (uses pgvector)

### Marketing
- `segments` — Dynamic contact segments with criteria
- `segment_contacts` — Many-to-many segment membership
- `campaigns` — Email/WhatsApp/SMS campaigns
- `campaign_steps` — Multi-step campaign sequences
- `campaign_sends` — Per-contact send tracking with status
- `templates` — Message templates with variables

### Discovery
- `discovery_scans` — Google Places scan configurations
- `discovery_prospects` — Discovered businesses/leads

### Scheduling
- `bookings` — Video call bookings (Cal.com integration)

---

## Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `knowledge-documents` | RAG document storage (PDFs) | No |
| `unit-documents` | Property unit documents (plans, renders, photos) | No |

---

## PostgREST (REST API)

The frontend uses React Admin's Supabase data provider, which maps CRUD operations to PostgREST endpoints automatically:

```
GET    /rest/v1/contacts?select=*&order=id.asc     → List
GET    /rest/v1/contacts?id=eq.5                    → GetOne
POST   /rest/v1/contacts                            → Create
PATCH  /rest/v1/contacts?id=eq.5                    → Update
DELETE /rest/v1/contacts?id=eq.5                    → Delete
```

The `contacts_summary` view is used for list/read operations (includes computed fields like `company_name`, `nb_tasks`, `email_fts`, `phone_fts`, `lead_type`). Writes go to the `contacts` table directly.

### Filtering Conventions in the Data Provider

The Supabase data provider uses PostgREST operators via the `@` separator in filter keys:

```typescript
filter: {
  "archived_at@is": null,        // WHERE archived_at IS NULL
  "last_seen@gte": "2026-01-01", // WHERE last_seen >= '2026-01-01'
  "tags@cs": "{5}",              // WHERE tags @> '{5}' (array contains)
  "status": "cold",              // WHERE status = 'cold'
}
```
