# CRM User Flows

## Prerequisites

- Log in at `http://localhost:5174/` with your credentials
- Top navigation: Dashboard | Contacts | Companies | Deals | Projects | Campaigns | Discovery | Activity | Workflows | Reminders

---

## Flow 1: Set Up a Project

Everything in this CRM is organized around **Projects** (real estate developments).

1. Click **Projects** in the top nav
2. Click **New Project**
3. Fill in:
   - **Name** — e.g. "Milano Centro Residenze"
   - **Slug** — auto-generated URL-friendly name
   - **Description** — free text about the project
   - **Location** — city/address
   - **Status** — `active`, `planning`, or `completed`
4. Click **Save**

You now have a project. All other features (scans, campaigns, segments, knowledge docs, deals) can be linked to this project.

---

## Flow 2: Discover Prospects (Discovery Agent)

Find businesses near your project using Google Maps.

1. Click **Discovery** in the top nav — you'll see a list of past scans
2. Click **New Scan**
3. Fill in:
   - **Project** — select the project this scan is for
   - **Center Latitude / Longitude** — the geographic center of your search (e.g. Milan: `45.4642` / `9.1900`)
   - **Search Radius (km)** — how far from center to search (max 50km)
   - **Scoring Weights** — how to rank results:
     - Sector Match (does the business type match your target?)
     - Company Size (based on review count as proxy)
     - Proximity (closer = higher score)
     - Activity (Google rating as proxy)
4. Click **Create Scan** — this saves the scan record with status `pending`

**What happens next:** The scan record is created in the database. Currently you need to trigger the scan execution manually (the UI saves the record; the Edge Function `discovery-scan` runs the actual Google Maps search). In a production setup, a database trigger or cron would auto-execute pending scans.

**To trigger manually for now:** The scan will run automatically when triggered via the Edge Function API. A "Run Scan" button on the scan list is a planned enhancement.

**Where results appear:**

- Go back to **Discovery** in the top nav
- The scan's status will change from `pending` → `running` → `completed`
- Results appear in the **discovery_prospects** table. The UI shows them in a table with:
  - Business Name
  - Industry
  - Address
  - Score (0-100 badge, color-coded)
  - **Add to CRM** button — clicking this creates a new Contact from the prospect

---

## Flow 3: Build a Segment (Contact Groups)

Segments are dynamic groups of contacts used for campaigns.

1. Navigate to segments (via URL: `/#/segments` — not directly in top nav, accessible from Campaigns workflow)
2. Click **New Segment**
3. Fill in:
   - **Name** — e.g. "High Value Contacts"
   - **Project** — optionally link to a project
   - **Auto-refresh** — toggle on if you want the segment to auto-update
   - **Filter Rules** — click "Add Rule" to define criteria:
     - Field: Status, Tags, Company, Assigned Agent, Gender, etc.
     - Operator: equals, not equals, contains, greater than, less than, in, not in
     - Value: the value to match
4. Click **Create Segment**

The segment is created. Its membership is computed by the `segments-refresh` Edge Function, which queries the contacts table based on your criteria and populates `segment_contacts`.

---

## Flow 4: Create Message Templates

Templates are reusable messages for campaigns.

1. Navigate to `/#/templates`
2. Click **New Template**
3. Fill in:
   - **Name** — e.g. "Welcome SMS"
   - **Channel** — Email, WhatsApp, or SMS
   - **Project** — optionally link to a project
   - **Subject** — for email templates only
   - **Body** — the message content. Use `{{variable_name}}` for dynamic fields (e.g. `{{first_name}}`)
4. Click **Save**

---

## Flow 5: Run a Campaign

Campaigns send messages to a segment of contacts.

1. Click **Campaigns** in the top nav
2. Click **New Campaign**
3. Fill in:
   - **Name** — e.g. "Milan Launch Announcement"
   - **Project** — which project this campaign is for
   - **Target Segment** — select a segment you created in Flow 3
   - **Channel** — Email, WhatsApp, SMS, or Multi-channel
   - **Status** — Draft or Scheduled
   - **Schedule At** — optional datetime to send later
4. Click **Create Campaign** — this takes you to the campaign detail page

**On the campaign detail page:**

- You'll see the campaign name, channel, status, and linked segment
- A **Send Now** button appears for draft/scheduled campaigns
- Click **Send Now** to trigger the `campaign-send` Edge Function
- The function reads the segment contacts, renders the template with each contact's data, and sends via the selected channel (WhatsApp, SMS, or email)
- A **Metrics** section shows delivery stats: sent, delivered, failed, opened

---

## Flow 6: AI Chat (Conversational Agent)

The AI chat widget appears as a blue circle in the bottom-right corner of every page.

**As a visitor/prospect:**

1. Click the chat bubble (bottom-right)
2. Type a question — e.g. "I'm interested in buying an apartment in Milan. What do you have?"
3. The AI (Claude) responds using knowledge from uploaded documents
4. The AI can:
   - Answer questions about floor plans, pricing, payment methods
   - Capture your contact information naturally during conversation
   - Book a video call with a sales rep (via Cal.com)
   - Escalate to a human agent if needed
5. Each conversation is saved with full message history

**As a sales agent monitoring conversations:**

1. Navigate to `/#/conversations`
2. You'll see a list of all active conversations with:
   - Contact name (or "Anonymous")
   - Channel (web_chat, whatsapp)
   - Status: `active` (AI handling), `escalated` (needs human), `closed`
3. Click on a conversation to see the full message history
4. If status is `escalated`, you'll see a **Take Over** button — click it to switch the conversation back to active and respond manually

---

## Flow 7: Upload Knowledge Documents (RAG)

The AI chat uses uploaded documents to answer questions accurately.

1. Navigate to `/#/knowledge_documents`
2. Click **Upload Document**
3. Fill in:
   - **Title** — e.g. "Milano Centro Floor Plans"
   - **Project** — which project this document is about
   - **File** — upload a PDF, TXT, MD, or DOCX file
4. Click **Upload Document**

The `process-document` Edge Function will:
- Download the file from storage
- Split it into chunks
- Generate vector embeddings for each chunk
- Store them in `document_chunks` for RAG search

When someone asks the AI a question, it searches these chunks for relevant context before responding.

---

## Flow 8: WhatsApp Integration

Inbound and outbound WhatsApp messaging is integrated.

**Inbound (prospect messages you):**
- A prospect sends a WhatsApp message to your business number
- The `whatsapp-webhook` Edge Function receives it
- It finds or creates a contact record
- It finds or creates a conversation
- It routes the message to the AI chat agent
- The AI responds directly via WhatsApp

**Outbound (you message a prospect):**
- Used by campaigns (Flow 5) when channel is "WhatsApp"
- The `whatsapp-send` Edge Function sends the message via Meta's Cloud API
- Delivery is logged in `communication_log`

---

## Flow 9: SMS Integration

**Outbound SMS:**
- Used by campaigns (Flow 5) when channel is "SMS"
- The `sms-send` Edge Function sends via Twilio
- Delivery is logged in `communication_log`

---

## Flow 10: View a Contact's Full History

1. Click **Contacts** in the top nav
2. Click on any contact
3. You'll see:
   - Contact details (name, title, company, avatar)
   - Notes section (internal notes by your team)
   - **Communication Timeline** — a chronological log of ALL interactions across ALL channels (WhatsApp, SMS, email, web chat) with direction (inbound/outbound) and timestamps
4. The sidebar shows: status, tags, email, phone, assigned agent, company

---

## Flow 11: Video Call Booking

The AI chat can book video calls via Cal.com.

1. During a conversation, a prospect says "I'd like to schedule a call"
2. The AI calls the `book-videocall` tool to fetch available Cal.com slots
3. It presents options to the prospect
4. On confirmation, it creates the booking via Cal.com API
5. The booking is saved in the `bookings` table linked to the conversation

---

## Flow 12: Role-Based Access

Users have one of four roles: `admin`, `manager`, `agent`, `read_only`.

| Action | admin | manager | agent | read_only |
|---|---|---|---|---|
| Manage sales team | Yes | No | No | No |
| Create campaigns, segments, scans, templates, projects | Yes | Yes | No | No |
| Create/edit contacts, companies, deals | Yes | Yes | Yes | No |
| View everything | Yes | Yes | Yes | Yes |

To change a user's role:
1. Navigate to the Sales team section
2. Edit a team member
3. Change the **Role** dropdown
4. Save

---

## Typical End-to-End Workflow

1. **Create a Project** (Flow 1) — "Milano Centro Residenze"
2. **Upload knowledge documents** (Flow 7) — floor plans, pricing sheets, FAQ
3. **Run a discovery scan** (Flow 2) — find real estate agencies near Milan
4. **Add promising prospects to CRM** — click "Add to CRM" on high-scoring results
5. **Create a segment** (Flow 3) — "Milan Prospects" with criteria matching your new contacts
6. **Create a template** (Flow 4) — "Hi {{first_name}}, we have exciting new residences in Milan..."
7. **Launch a campaign** (Flow 5) — send the template to the segment via WhatsApp/SMS
8. **Monitor AI conversations** (Flow 6) — prospects who reply are handled by the AI
9. **Handle escalations** (Flow 6) — take over conversations the AI can't handle
10. **Check contact histories** (Flow 10) — see every interaction in one timeline
11. **Book video calls** (Flow 11) — let the AI schedule calls with serious buyers
