import { useListContext, useRecordContext } from "ra-core";
import { ReferenceManyField, ReferenceField } from "@/components/admin";
import { format } from "date-fns";
import { formatEUR } from "@/lib/formatPrice";
import {
  Mail,
  Phone,
  Users,
  Eye,
  FileText,
  MessageSquare,
  Clock,
  MoreHorizontal,
  PenLine,
  Handshake,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import type { DealInteraction, Deal, Contact } from "../../types";
import { InteractionCreate } from "./InteractionCreate";
import { Button } from "@/components/ui/button";

const interactionIcons: Record<string, any> = {
  Chiamata: Phone,
  Email: Mail,
  Visita: Eye,
  Proposta: FileText,
  Controfferta: MessageSquare,
  Trattativa: Handshake,
  Firma: PenLine,
  "Follow-up": Clock,
  Altro: MoreHorizontal,
};

const offerStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
  countered: "outline",
};

const sentimentColors: Record<string, string> = {
  Positivo: "bg-green-500",
  Neutro: "bg-gray-500",
  Negativo: "bg-orange-500",
  Critico: "bg-red-500",
};

export const InteractionsList = () => {
  const record = useRecordContext<Deal>();

  if (!record) return null;

  return (
    <div className="space-y-4">
      <div className="font-semibold text-lg">Interactions</div>
      <InteractionCreate />
      <ReferenceManyField
        target="deal_id"
        reference="dealInteractions"
        sort={{ field: "date", order: "DESC" }}
      >
        <InteractionsIterator />
      </ReferenceManyField>
    </div>
  );
};

const InteractionsIterator = () => {
  const { data, isPending, error } = useListContext<DealInteraction>();

  if (isPending) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (error) return <div className="text-sm text-destructive">Error loading interactions</div>;
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground mt-4">
        No interactions yet. Add one above to start tracking.
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {data.map((interaction) => (
        <InteractionCard key={interaction.id} interaction={interaction} />
      ))}
    </div>
  );
};

const InteractionCard = ({ interaction }: { interaction: DealInteraction }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = interactionIcons[interaction.type] || MoreHorizontal;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{interaction.type}</Badge>
              {interaction.sentiment && (
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${sentimentColors[interaction.sentiment] || "bg-gray-500"}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {interaction.sentiment}
                  </span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(interaction.date), "PPp")}
            </div>
          </div>

          {(interaction.amount != null || interaction.offer_status) && (
            <div className="flex items-center gap-2 text-sm">
              {interaction.amount != null && (
                <span className="font-medium">
                  {formatEUR(interaction.amount)}
                </span>
              )}
              {interaction.offer_status && (
                <Badge variant={offerStatusColors[interaction.offer_status] ?? "outline"}>
                  {interaction.offer_status}
                </Badge>
              )}
            </div>
          )}

          {interaction.duration && (
            <div className="text-sm text-muted-foreground">
              Duration: {interaction.duration} minutes
            </div>
          )}

          {interaction.participant_ids && interaction.participant_ids.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Participants: </span>
              <span className="space-x-2">
                {interaction.participant_ids.map((contactId) => (
                  <ReferenceField
                    key={contactId}
                    source="id"
                    reference="contacts_summary"
                    record={{ id: contactId }}
                    link="show"
                    render={({ referenceRecord }: { referenceRecord?: Contact }) => {
                      if (!referenceRecord) return null;
                      return (
                        <span className="inline-block">
                          {referenceRecord.first_name} {referenceRecord.last_name}
                        </span>
                      );
                    }}
                  />
                ))}
              </span>
            </div>
          )}

          {interaction.notes && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="px-0 h-auto text-sm text-primary"
              >
                {expanded ? "Hide" : "Show"} details
              </Button>
              {expanded && (
                <div className="text-sm whitespace-pre-line bg-muted p-3 rounded">
                  {interaction.notes}
                </div>
              )}
            </>
          )}

          {interaction.attachments && interaction.attachments.length > 0 && (
            <div className="text-sm text-muted-foreground">
              📎 {interaction.attachments.length} attachment(s)
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

