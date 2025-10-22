import { useState } from "react";
import { ListBase, useGetIdentity } from "ra-core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RemindersList } from "./RemindersList";
import { ReminderCreate } from "./ReminderCreate";

export const RemindersPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const { identity } = useGetIdentity();

  if (!identity) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">
            Manage your scheduled reminders and notifications
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Reminder
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <ListBase
            resource="reminders"
            filter={{ status: "pending", "sales_id@eq": identity.id }}
            sort={{ field: "trigger_date", order: "ASC" }}
            perPage={50}
          >
            <RemindersList />
          </ListBase>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <ListBase
            resource="reminders"
            filter={{ status: "completed", "sales_id@eq": identity.id }}
            sort={{ field: "trigger_date", order: "DESC" }}
            perPage={50}
          >
            <RemindersList />
          </ListBase>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <ListBase
            resource="reminders"
            filter={{ "sales_id@eq": identity.id }}
            sort={{ field: "trigger_date", order: "DESC" }}
            perPage={50}
          >
            <RemindersList />
          </ListBase>
        </TabsContent>
      </Tabs>

      <ReminderCreate
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        entityType="deal"
        entityId={0}
      />
    </div>
  );
};

RemindersPage.path = "/reminders";

