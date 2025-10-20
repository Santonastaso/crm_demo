import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Timer {
  id: string;
  entity_type: string;
  entity_id: string;
  timer_type: string;
  priority: string;
  action_required: string;
  description?: string;
  assigned_to: number;
  notify_also?: number[];
  channels: string[];
  recurrence_enabled: boolean;
  recurrence_pattern?: string;
  recurrence_interval?: number;
  recurrence_end_condition?: string;
  recurrence_end_value?: string;
  trigger_count: number;
  delay_value?: number;
  delay_unit?: string;
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active timers that need to be triggered
    const { data: timers, error: timersError } = await supabase
      .from("timers")
      .select("*")
      .eq("status", "active")
      .lte("next_trigger", new Date().toISOString());

    if (timersError) {
      console.error("Error fetching timers:", timersError);
      throw timersError;
    }

    if (!timers || timers.length === 0) {
      return new Response(JSON.stringify({ message: "No timers to process" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${timers.length} timers`);

    const results = await Promise.allSettled(
      timers.map((timer) => processTimer(supabase, timer)),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({
        message: "Timers processed",
        total: timers.length,
        successful,
        failed,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing timers:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function processTimer(supabase: any, timer: Timer) {
  console.log(`Processing timer ${timer.id}`);

  // Create in-app notifications
  const usersToNotify = [timer.assigned_to, ...(timer.notify_also || [])];

  const notifications = usersToNotify.map((userId) => ({
    timer_id: timer.id,
    user_id: userId,
    title: `${timer.priority.toUpperCase()}: ${timer.action_required}`,
    message: timer.description || timer.action_required,
    priority: timer.priority,
    entity_type: timer.entity_type,
    entity_id: timer.entity_id,
    read: false,
  }));

  const { error: notifError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (notifError) {
    console.error(
      `Error creating notifications for timer ${timer.id}:`,
      notifError,
    );
    throw notifError;
  }

  // Send email notifications if channel includes email
  if (timer.channels.includes("email")) {
    try {
      await sendEmailNotifications(supabase, timer, usersToNotify);
    } catch (emailError) {
      console.error(`Error sending emails for timer ${timer.id}:`, emailError);
      // Don't throw - we still want to update the timer
    }
  }

  // Calculate next trigger time
  let nextTrigger = null;
  let newStatus = timer.status;

  if (timer.recurrence_enabled) {
    nextTrigger = calculateNextTrigger(timer);

    // Check if we should stop recurring
    if (timer.recurrence_end_condition === "after_n_times") {
      const maxTimes = parseInt(timer.recurrence_end_value || "0");
      if (timer.trigger_count + 1 >= maxTimes) {
        newStatus = "completed";
        nextTrigger = null;
      }
    } else if (timer.recurrence_end_condition === "until_date") {
      if (
        nextTrigger &&
        new Date(nextTrigger) > new Date(timer.recurrence_end_value!)
      ) {
        newStatus = "completed";
        nextTrigger = null;
      }
    }
  } else {
    newStatus = "completed";
  }

  // Update timer
  const { error: updateError } = await supabase
    .from("timers")
    .update({
      last_triggered: new Date().toISOString(),
      trigger_count: timer.trigger_count + 1,
      next_trigger: nextTrigger,
      status: newStatus,
    })
    .eq("id", timer.id);

  if (updateError) {
    console.error(`Error updating timer ${timer.id}:`, updateError);
    throw updateError;
  }

  console.log(`Successfully processed timer ${timer.id}`);
}

function calculateNextTrigger(timer: Timer): string | null {
  if (!timer.recurrence_enabled) return null;

  const now = new Date();
  const next = new Date(now);

  const interval = timer.recurrence_interval || 1;

  switch (timer.recurrence_pattern) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7 * interval);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    default:
      return null;
  }

  return next.toISOString();
}

async function sendEmailNotifications(
  supabase: any,
  timer: Timer,
  userIds: number[],
) {
  // Fetch user emails
  const { data: users, error: usersError } = await supabase
    .from("sales")
    .select("email, first_name, last_name")
    .in("id", userIds);

  if (usersError) {
    console.error("Error fetching users:", usersError);
    throw usersError;
  }

  // Send email to each user via Postmark function
  for (const user of users) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/postmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: "timer_notification",
          to: user.email,
          data: {
            userName: `${user.first_name} ${user.last_name}`,
            priority: timer.priority,
            actionRequired: timer.action_required,
            description: timer.description,
            entityType: timer.entity_type,
            entityId: timer.entity_id,
          },
        }),
      });

      if (!response.ok) {
        console.error(
          `Failed to send email to ${user.email}:`,
          await response.text(),
        );
      }
    } catch (error) {
      console.error(`Error sending email to ${user.email}:`, error);
    }
  }
}
