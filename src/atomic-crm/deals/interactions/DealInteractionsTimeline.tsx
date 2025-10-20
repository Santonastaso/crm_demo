import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Presentation,
  FileText,
  Handshake,
  MessageCircle,
  MoreHorizontal,
  Download,
} from "lucide-react";
import { useState } from "react";
import { useListContext, useRecordContext } from "ra-core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Deal, DealInteraction } from "../../types";
import { DealInteractionCreate } from "./DealInteractionCreate";

const interactionIcons = {
  Email: Mail,
  Chiamata: Phone,
  Meeting: MessageSquare,
  Demo: Presentation,
  Proposta: FileText,
  Negoziazione: Handshake,
  "Follow-up": MessageCircle,
  Altro: MoreHorizontal,
};

const sentimentVariants = {
  Positivo: "default" as const,
  Neutro: "secondary" as const,
  Negativo: "outline" as const,
  Critico: "destructive" as const,
};

export const DealInteractionsTimeline = () => {
  const { data, isPending } = useListContext<DealInteraction>();
  const deal = useRecordContext<Deal>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");

  if (!deal) return null;

  const filteredData = data?.filter((interaction) => {
    if (typeFilter !== "all" && interaction.type !== typeFilter) return false;
    if (sentimentFilter !== "all" && interaction.sentiment !== sentimentFilter)
      return false;
    return true;
  });

  if (isPending) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DealInteractionCreate />

      {/* Filters */}
      {data && data.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Chiamata">Chiamata</SelectItem>
                <SelectItem value="Meeting">Meeting</SelectItem>
                <SelectItem value="Demo">Demo</SelectItem>
                <SelectItem value="Proposta">Proposta</SelectItem>
                <SelectItem value="Negoziazione">Negoziazione</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Altro">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i sentiment</SelectItem>
                <SelectItem value="Positivo">Positivo</SelectItem>
                <SelectItem value="Neutro">Neutro</SelectItem>
                <SelectItem value="Negativo">Negativo</SelectItem>
                <SelectItem value="Critico">Critico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Timeline */}
      {filteredData && filteredData.length > 0 ? (
        <div className="space-y-4 mt-6">
          {filteredData.map((interaction, index) => (
            <InteractionItem
              key={interaction.id}
              interaction={interaction}
              isLast={index === filteredData.length - 1}
            />
          ))}
        </div>
      ) : (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground mb-2">
              Nessuna interazione trovata
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {typeFilter !== "all" || sentimentFilter !== "all"
                ? "Prova a modificare i filtri"
                : "Inizia a tracciare le interazioni con il cliente"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const InteractionItem = ({
  interaction,
  isLast,
}: {
  interaction: DealInteraction;
  isLast: boolean;
}) => {
  const Icon = interactionIcons[interaction.type] || MoreHorizontal;

  return (
    <div className="flex gap-4">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className="rounded-full p-2 bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {!isLast && (
          <div
            className="flex-1 w-0.5 bg-border mt-2"
            style={{ minHeight: "40px" }}
          />
        )}
      </div>

      {/* Content */}
      <Card className="flex-1 mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{interaction.type}</h4>
                {interaction.sentiment && (
                  <Badge variant={sentimentVariants[interaction.sentiment]}>
                    {interaction.sentiment}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(interaction.date), "PPP")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(interaction.date), "p")}
                </span>
                {interaction.duration && (
                  <span>{interaction.duration} min</span>
                )}
              </div>
            </div>
          </div>

          {interaction.participants && interaction.participants.length > 0 && (
            <div className="mb-2">
              <span className="text-sm text-muted-foreground">
                Partecipanti:{" "}
              </span>
              <div className="flex gap-1 mt-1 flex-wrap">
                {interaction.participants.map((participantId) => (
                  <Badge key={participantId} variant="outline">
                    Contatto #{participantId}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {interaction.notes && (
            <div className="mt-2">
              <p className="text-sm whitespace-pre-line">{interaction.notes}</p>
            </div>
          )}

          {interaction.attachments && interaction.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              <span className="text-sm font-medium">Allegati:</span>
              <div className="space-y-1">
                {interaction.attachments.map(
                  (attachment: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      <a
                        href={attachment.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {attachment.title}
                      </a>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={attachment.src} download={attachment.title}>
                          <Download className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
