#!/bin/bash

# Verification script for Deal Interactions and Reminders implementation
echo "🔍 Verifying Deal Interactions and Reminders Setup..."
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "❌ node_modules directory not found"
    echo "   Run: npm install"
    exit 1
fi

# Check for date-fns
if [ -d "node_modules/date-fns" ]; then
    echo "✅ date-fns is installed"
else
    echo "❌ date-fns not found in node_modules"
    echo "   Run: npm install"
    exit 1
fi

# Check migration files
if [ -f "supabase/migrations/20250120000001_deal_interactions.sql" ]; then
    echo "✅ Deal interactions migration file exists"
else
    echo "❌ Deal interactions migration not found"
    exit 1
fi

if [ -f "supabase/migrations/20250120000002_reminders.sql" ]; then
    echo "✅ Reminders migration file exists"
else
    echo "❌ Reminders migration not found"
    exit 1
fi

# Check component files
components=(
    "src/atomic-crm/deals/interactions/InteractionCreate.tsx"
    "src/atomic-crm/deals/interactions/InteractionsList.tsx"
    "src/atomic-crm/deals/interactions/InteractionsDashboard.tsx"
    "src/atomic-crm/reminders/ReminderCreate.tsx"
    "src/atomic-crm/reminders/RemindersList.tsx"
    "src/atomic-crm/reminders/RemindersPage.tsx"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo "✅ Component exists: $(basename $component)"
    else
        echo "❌ Component missing: $component"
        exit 1
    fi
done

# Check if types are updated
if grep -q "DealInteraction" src/atomic-crm/types.ts; then
    echo "✅ DealInteraction type added"
else
    echo "❌ DealInteraction type not found in types.ts"
    exit 1
fi

if grep -q "Reminder" src/atomic-crm/types.ts; then
    echo "✅ Reminder type added"
else
    echo "❌ Reminder type not found in types.ts"
    exit 1
fi

# Check if routes are configured
if grep -q "RemindersPage" src/atomic-crm/root/CRM.tsx; then
    echo "✅ Reminders route configured"
else
    echo "❌ Reminders route not configured in CRM.tsx"
    exit 1
fi

# Check if resources are registered
if grep -q "dealInteractions" src/atomic-crm/root/CRM.tsx; then
    echo "✅ dealInteractions resource registered"
else
    echo "❌ dealInteractions resource not registered"
    exit 1
fi

if grep -q "reminders" src/atomic-crm/root/CRM.tsx; then
    echo "✅ reminders resource registered"
else
    echo "❌ reminders resource not registered"
    exit 1
fi

echo ""
echo "✨ All verification checks passed!"
echo ""
echo "Next steps:"
echo "1. Run database migrations: supabase db push"
echo "2. Start dev server: npm run dev"
echo "3. Test the features using TESTING_GUIDE.md"

