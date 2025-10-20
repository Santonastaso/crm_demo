import { useMutation } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { Archive, ArchiveRestore, Bell } from "lucide-react";
import { useState } from "react";
import {
  ShowBase,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useUpdate,
} from "ra-core";

import {
  DeleteButton,
  EditButton,
  ReferenceArrayField,
  ReferenceField,
  ReferenceManyField,
} from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyAvatar } from "../companies/CompanyAvatar";
import { NoteCreate, NotesIterator } from "../notes";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { ContactList } from "./ContactList";
import { findDealLabel } from "./deal";
import {
  InteractionsList,
  InteractionsDashboard,
} from "./interactions";
import { ReminderCreate } from "../reminders";

export const DealShow = ({ open, id }: { open: boolean; id?: string }) => {
  const redirect = useRedirect();
  const handleClose = () => {
    redirect("list", "deals");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="lg:max-w-4xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <ShowBase id={id}>
            <DealShowContent />
          </ShowBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const DealShowContent = () => {
  const { dealStages } = useConfigurationContext();
  const record = useRecordContext<Deal>();
  const [reminderOpen, setReminderOpen] = useState(false);
  
  if (!record) return null;

  return (
    <>
      <div className="space-y-2">
        {record.archived_at ? <ArchivedTitle /> : null}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <ReferenceField
                source="company_id"
                reference="companies"
                link="show"
              >
                <CompanyAvatar />
              </ReferenceField>
              <h2 className="text-2xl font-semibold">{record.name}</h2>
            </div>
            <div className={`flex gap-2 ${record.archived_at ? "" : "pr-12"}`}>
              {record.archived_at ? (
                <>
                  <UnarchiveButton record={record} />
                  <DeleteButton />
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setReminderOpen(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2 h-9"
                  >
                    <Bell className="w-4 h-4" />
                    Set Reminder
                  </Button>
                  <ArchiveButton record={record} />
                  <EditButton />
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="flex gap-8 m-4">
                <div className="flex flex-col mr-10">
                  <span className="text-xs text-muted-foreground tracking-wide">
                    Expected closing date
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isValid(new Date(record.expected_closing_date))
                        ? format(new Date(record.expected_closing_date), "PP")
                        : "Invalid date"}
                    </span>
                    {new Date(record.expected_closing_date) < new Date() ? (
                      <Badge variant="destructive">Past</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col mr-10">
                  <span className="text-xs text-muted-foreground tracking-wide">
                    Budget
                  </span>
                  <span className="text-sm">
                    {record.amount.toLocaleString("en-US", {
                      notation: "compact",
                      style: "currency",
                      currency: "USD",
                      currencyDisplay: "narrowSymbol",
                      minimumSignificantDigits: 3,
                    })}
                  </span>
                </div>

                {record.category && (
                  <div className="flex flex-col mr-10">
                    <span className="text-xs text-muted-foreground tracking-wide">
                      Category
                    </span>
                    <span className="text-sm">{record.category}</span>
                  </div>
                )}

                <div className="flex flex-col mr-10">
                  <span className="text-xs text-muted-foreground tracking-wide">
                    Stage
                  </span>
                  <span className="text-sm">
                    {findDealLabel(dealStages, record.stage)}
                  </span>
                </div>
              </div>

              {!!record.contact_ids?.length && (
                <div className="m-4">
                  <div className="flex flex-col min-h-12 mr-10">
                    <span className="text-xs text-muted-foreground tracking-wide">
                      Contacts
                    </span>
                    <ReferenceArrayField
                      source="contact_ids"
                      reference="contacts_summary"
                    >
                      <ContactList />
                    </ReferenceArrayField>
                  </div>
                </div>
              )}

              {record.description && (
                <div className="m-4 whitespace-pre-line">
                  <span className="text-xs text-muted-foreground tracking-wide">
                    Description
                  </span>
                  <p className="text-sm leading-6">{record.description}</p>
                </div>
              )}

              <div className="m-4">
                <Separator className="mb-4" />
                <ReferenceManyField
                  target="deal_id"
                  reference="dealNotes"
                  sort={{ field: "date", order: "DESC" }}
                  empty={<NoteCreate reference={"deals"} />}
                >
                  <NotesIterator reference="deals" />
                </ReferenceManyField>
              </div>
            </TabsContent>

            <TabsContent value="interactions" className="m-4">
              <InteractionsList />
            </TabsContent>

            <TabsContent value="dashboard" className="m-4">
              <InteractionsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <ReminderCreate
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        entityType="deal"
        entityId={record.id}
      />
    </>
  );
};

const ArchivedTitle = () => (
  <div className="bg-orange-500 px-6 py-4">
    <h3 className="text-lg font-bold text-white">Archived Deal</h3>
  </div>
);

const ArchiveButton = ({ record }: { record: Deal }) => {
  const [update] = useUpdate();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();
  const handleClick = () => {
    update(
      "deals",
      {
        id: record.id,
        data: { archived_at: new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => {
          redirect("list", "deals");
          notify("Deal archived", { type: "info", undoable: false });
          refresh();
        },
        onError: () => {
          notify("Error: deal not archived", { type: "error" });
        },
      },
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <Archive className="w-4 h-4" />
      Archive
    </Button>
  );
};

const UnarchiveButton = ({ record }: { record: Deal }) => {
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  const { mutate } = useMutation({
    mutationFn: () => dataProvider.unarchiveDeal(record),
    onSuccess: () => {
      redirect("list", "deals");
      notify("Deal unarchived", {
        type: "info",
        undoable: false,
      });
      refresh();
    },
    onError: () => {
      notify("Error: deal not unarchived", { type: "error" });
    },
  });

  const handleClick = () => {
    mutate();
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <ArchiveRestore className="w-4 h-4" />
      Send back to the board
    </Button>
  );
};
