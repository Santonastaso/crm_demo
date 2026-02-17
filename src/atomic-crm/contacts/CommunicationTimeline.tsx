import { useGetList, useRecordContext } from "ra-core";
import { TIMELINE_PAGE_SIZE } from "../consts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, formatDistance, isSameDay, parseISO } from "date-fns";
import {
  Mail,
  MessageSquare,
  Phone,
  Globe,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { useState } from "react";
import type { Contact, CommunicationLog } from "../types";

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageSquare,
  phone: Phone,
  web_chat: Globe,
  sms: MessageSquare,
};

const CHANNEL_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-800",
  whatsapp: "bg-green-100 text-green-800",
  phone: "bg-yellow-100 text-yellow-800",
  web_chat: "bg-purple-100 text-purple-800",
  sms: "bg-orange-100 text-orange-800",
};

type ChannelFilter = "all" | "email" | "whatsapp" | "phone" | "web_chat" | "sms";

const FILTER_OPTIONS: { key: ChannelFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "sms", label: "SMS" },
  { key: "web_chat", label: "Chat" },
  { key: "phone", label: "Phone" },
];

function groupByDate(logs: CommunicationLog[]): Map<string, CommunicationLog[]> {
  const groups = new Map<string, CommunicationLog[]>();

  for (const log of logs) {
    const date = format(parseISO(log.created_at), "yyyy-MM-dd");
    const existing = groups.get(date) ?? [];
    existing.push(log);
    groups.set(date, existing);
  }

  return groups;
}

function formatDateHeader(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isSameDay(date, new Date())) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";
  return format(date, "EEEE, MMM d, yyyy");
}

export const CommunicationTimeline = () => {
  const contact = useRecordContext<Contact>();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: logs = [], isLoading } = useGetList<CommunicationLog>(
    "communication_log",
    {
      pagination: { page: 1, perPage: TIMELINE_PAGE_SIZE },
      sort: { field: "created_at", order: "DESC" },
      filter: contact?.id ? { contact_id: contact.id } : {},
    },
    { enabled: !!contact?.id },
  );

  if (!contact) return null;

  const filtered =
    channelFilter === "all"
      ? logs
      : logs.filter((l) => l.channel === channelFilter);

  const grouped = groupByDate(filtered);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Communication Timeline</CardTitle>
          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setChannelFilter(opt.key)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                  channelFilter === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {channelFilter === "all"
              ? "No communications recorded yet."
              : `No ${channelFilter} communications.`}
          </p>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([dateKey, dateLogs]) => (
              <div key={dateKey}>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 border-b pb-1">
                  {formatDateHeader(dateKey)}
                </h4>
                <div className="space-y-2">
                  {dateLogs.map((log) => {
                    const Icon = CHANNEL_ICONS[log.channel] ?? Mail;
                    const DirectionIcon =
                      log.direction === "inbound"
                        ? ArrowDownLeft
                        : ArrowUpRight;
                    const isExpanded = expandedId === Number(log.id);
                    const hasSubject = log.channel === "email" && log.subject;

                    return (
                      <div
                        key={String(log.id)}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : Number(log.id))
                        }
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${CHANNEL_COLORS[log.channel] ?? "bg-gray-100 text-gray-800"}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {log.channel}
                            </Badge>
                            <DirectionIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {log.direction}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(parseISO(log.created_at), "HH:mm")}
                            </span>
                          </div>
                          {hasSubject && (
                            <p className="text-sm font-medium mt-1">
                              {log.subject}
                            </p>
                          )}
                          {log.content_summary && (
                            <p
                              className={`text-sm mt-1 text-muted-foreground ${isExpanded ? "whitespace-pre-wrap" : "truncate"}`}
                            >
                              {log.content_summary}
                            </p>
                          )}
                          {log.content_summary &&
                            log.content_summary.length > 80 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3" /> Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3" /> More
                                  </>
                                )}
                              </span>
                            )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistance(
                              parseISO(log.created_at),
                              new Date(),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
