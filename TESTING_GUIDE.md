# Testing Guide - Deal Interactions and Reminders

## Prerequisites

1. **Apply Database Migrations**
   ```bash
   # If using local Supabase
   supabase db push
   
   # Or if using remote/linked Supabase
   supabase db push --linked
   ```

2. **Verify Tables Created**
   ```bash
   # Check in Supabase Studio or run:
   supabase db diff
   ```
   
   Should show `dealInteractions` and `reminders` tables.

## Testing Deal Interactions

### 1. Basic Interaction Creation
- [ ] Navigate to Deals page
- [ ] Click on any deal to open the detail view
- [ ] Verify you see three tabs: "Overview", "Interactions", "Dashboard"
- [ ] Click "Interactions" tab
- [ ] Fill in the interaction form:
  - Type: Select any type (e.g., "Meeting")
  - Date & Time: Select a date/time
  - Duration: Enter minutes (e.g., "30")
  - Sentiment: Select sentiment (e.g., "Positivo")
  - Notes: Add some text
- [ ] Click "Add Interaction"
- [ ] Verify the interaction appears in the timeline below

### 2. Interaction Timeline
- [ ] Create multiple interactions with different types
- [ ] Verify they appear in chronological order (newest first)
- [ ] Check that each card shows:
  - Type badge
  - Sentiment indicator (colored dot)
  - Date and time
  - Duration (if provided)
- [ ] Click "Show details" on an interaction with notes
- [ ] Verify notes are displayed
- [ ] Click "Hide details" to collapse

### 3. Interaction Dashboard
- [ ] Click "Dashboard" tab
- [ ] Verify KPI cards show:
  - Deal Value (from deal amount)
  - Days in Pipeline (calculated from creation date)
  - Total Interactions count
  - Current Stage
- [ ] Verify "Interaction Breakdown" card shows:
  - Most common interaction type
  - Count of each type
- [ ] Verify "Sentiment Analysis" card shows:
  - Distribution of sentiment levels
  - Progress bars with percentages

### 4. Participants and Attachments
- [ ] Create a deal with contacts
- [ ] Go to Interactions tab
- [ ] Verify "Participants" field appears
- [ ] Select one or more contacts
- [ ] Add an attachment file
- [ ] Submit the interaction
- [ ] Verify participants are displayed
- [ ] Verify attachment count is shown

## Testing Reminders

### 1. Create Reminder from Deal
- [ ] Open any deal detail page
- [ ] Click "Set Reminder" button (next to Edit/Archive)
- [ ] Dialog opens with reminder form
- [ ] Test Absolute Time:
  - Select "Specific date and time" radio
  - Choose a future date/time
  - Fill in action text (e.g., "Follow up on proposal")
  - Add description
  - Select priority (e.g., "High")
  - Verify "Assigned to" defaults to current user
  - Click "Create Reminder"
  - Verify notification "Reminder created"
- [ ] Click "Set Reminder" again to test Relative Time:
  - Select "Relative (from now)" radio
  - Enter "7" days
  - Fill in action text
  - Click "Create Reminder"

### 2. Reminders Page - Navigation
- [ ] Click "Reminders" in the main navigation menu
- [ ] Verify you're on `/reminders` page
- [ ] Verify three tabs: "Upcoming", "Completed", "All"
- [ ] Verify "New Reminder" button in top right

### 3. Reminders List - Upcoming Tab
- [ ] Click "Upcoming" tab
- [ ] Verify only pending reminders are shown
- [ ] For each reminder, check:
  - Priority indicator (colored dot)
  - Action text is displayed
  - Date/time is shown
  - Entity type badge (e.g., "Deal")
  - "Mark as completed" button (checkmark icon)
  - "Delete" button (trash icon)
- [ ] Verify link to related deal works

### 4. Mark Reminder as Complete
- [ ] Click checkmark icon on a reminder
- [ ] Verify notification "Reminder marked as completed"
- [ ] Go to "Completed" tab
- [ ] Verify the reminder now appears there
- [ ] Verify it shows "Completed" badge

### 5. Delete Reminder
- [ ] Click trash icon on a reminder
- [ ] Verify notification "Reminder deleted" with undo option
- [ ] Verify reminder is removed from list

### 6. Overdue Reminders
- [ ] Create a reminder with a past date/time
- [ ] Verify it shows "(Overdue)" in red text
- [ ] Verify it still appears in "Upcoming" tab

### 7. All Reminders Tab
- [ ] Click "All" tab
- [ ] Verify both pending and completed reminders are shown
- [ ] Verify proper sorting by date

### 8. Priority Levels
- [ ] Create reminders with different priorities:
  - Low (blue dot)
  - Medium (yellow dot)
  - High (orange dot)
  - Urgent (red dot)
- [ ] Verify color indicators match

## Edge Cases to Test

### Deal Interactions
- [ ] Create interaction without optional fields (duration, participants, sentiment, notes)
- [ ] Verify it still works
- [ ] Create interaction on deal with no contacts
- [ ] Verify participants field doesn't appear
- [ ] Test with very long notes text
- [ ] Test with multiple file attachments

### Reminders
- [ ] Create reminder with very short action text
- [ ] Create reminder with very long action and description
- [ ] Test relative time with weeks instead of days
- [ ] Create reminder for a deal, then delete the deal (verify behavior)
- [ ] Create multiple reminders with same due date
- [ ] Verify sorting works correctly

## Performance Checks
- [ ] Create 20+ interactions on one deal
- [ ] Verify dashboard metrics calculate correctly
- [ ] Verify timeline scrolls smoothly
- [ ] Create 50+ reminders
- [ ] Verify list loads quickly
- [ ] Test tab switching responsiveness

## Browser Console
- [ ] Open browser console (F12)
- [ ] Perform all actions above
- [ ] Verify NO errors appear in console
- [ ] Verify NO network request failures

## Data Verification (Optional)

Check in Supabase Studio:
- [ ] `dealInteractions` table has correct data
- [ ] Attachments are in `storage.attachments` bucket
- [ ] `reminders` table has correct data
- [ ] Foreign keys are properly set
- [ ] Dates are stored in UTC

## Cleanup

After testing:
- [ ] Delete test interactions
- [ ] Delete test reminders
- [ ] Verify deletions work without errors

## Known Limitations

These are intentional to keep implementation simple:
- No email/push notifications (in-app only)
- No recurring reminders in UI (DB supports it)
- No charts in dashboard (text-based metrics only)
- No advanced filtering on interactions timeline
- Participants limited to contacts already on the deal

