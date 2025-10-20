import { useListContext, useUpdate, useDelete, useNotify } from "ra-core";
import { format, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Trash2, Clock } from "lucide-react";
import type { Reminder } from "../types";
import { Link } from "react-router";

const priorityColors: Record<string, string> = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const entityTypeLabels: Record<string, string> = {
  deal: "Deal",
  contact: "Contact",
  task: "Task",
};

export const RemindersList = () => {
  const { data, isPending, error } = useListContext<Reminder>();

  if (isPending) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (error) return <div className="text-sm text-destructive">Error loading reminders</div>;
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reminders found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((reminder) => (
        <ReminderCard key={reminder.id} reminder={reminder} />
      ))}
    </div>
  );
};

const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const notify = useNotify();

  const isOverdue = isPast(new Date(reminder.trigger_date)) && reminder.status === "pending";

  const handleComplete = () => {
    update(
      "reminders",
      {
        id: reminder.id,
        data: { status: "completed" },
        previousData: reminder,
      },
      {
        onSuccess: () => notify("Reminder marked as completed"),
      }
    );
  };

  const handleDelete = () => {
    deleteOne(
      "reminders",
      { id: reminder.id, previousData: reminder },
      {
        onSuccess: () => notify("Reminder deleted", { undoable: true }),
      }
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`w-3 h-3 rounded-full ${priorityColors[reminder.priority] || "bg-gray-500"}`}
                title={`Priority: ${reminder.priority}`}
              />
              <h3 className="font-medium">{reminder.action_text}</h3>
            </div>
            {reminder.status === "pending" && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleComplete}
                  title="Mark as completed"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  title="Delete reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {reminder.description && (
            <p className="text-sm text-muted-foreground">{reminder.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className={isOverdue ? "text-destructive font-medium" : ""}>
                {format(new Date(reminder.trigger_date), "PPp")}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {entityTypeLabels[reminder.entity_type] || reminder.entity_type}
            </Badge>
            {reminder.status === "completed" && (
              <Badge variant="secondary" className="text-xs">
                Completed
              </Badge>
            )}
          </div>

          {reminder.entity_type === "deal" && (
            <Link
              to={`/deals/${reminder.entity_id}/show`}
              className="text-sm text-primary hover:underline"
            >
              View related deal →
            </Link>
          )}
          {reminder.entity_type === "contact" && (
            <Link
              to={`/contacts/${reminder.entity_id}/show`}
              className="text-sm text-primary hover:underline"
            >
              View related contact →
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};

