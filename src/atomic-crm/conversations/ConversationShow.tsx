import {
  ShowBase,
  useShowContext,
  useGetList,
  useGetOne,
  useUpdate,
  useNotify,
  useRefresh,
  useCreate,
} from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { UserCheck, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { Conversation, Message, Contact } from "../types";

export const ConversationShow = () => (
  <ShowBase>
    <ConversationShowContent />
  </ShowBase>
);

const ConversationShowContent = () => {
  const { record, isPending } = useShowContext<Conversation>();
  const [update] = useUpdate();
  const [create] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useGetList<Message>(
    "messages",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "created_at", order: "ASC" },
      filter: record?.id ? { conversation_id: record.id } : {},
    },
    { enabled: !!record?.id },
  );

  const { data: contact } = useGetOne<Contact>(
    "contacts",
    { id: record?.contact_id as number },
    { enabled: !!record?.contact_id },
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (isPending || !record) return null;

  const handleTakeOver = () => {
    update("conversations", {
      id: record.id,
      data: { status: "active" },
      previousData: record,
    });
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      // Insert message into messages table
      await create("messages", {
        data: {
          conversation_id: record.id,
          sender_type: "agent_human",
          content: text,
        },
      });

      // For WhatsApp/SMS, send via the backend (which also logs to communication_log)
      if (record.channel === "whatsapp" && record.contact_id) {
        const contactPhone = (contact?.phone_jsonb ?? [])[0]?.number ?? "";
        if (contactPhone) {
          const { error } = await supabase.functions.invoke("whatsapp-send", {
            method: "POST",
            body: {
              to: contactPhone,
              message: text,
              contact_id: record.contact_id,
              project_id: record.project_id ?? null,
            },
          });
          if (error) {
            console.error("WhatsApp send error:", error);
          }
        } else {
          notify("No phone number found for this contact", { type: "warning" });
        }
      } else if (record.channel === "sms" && record.contact_id) {
        const contactPhone = (contact?.phone_jsonb ?? [])[0]?.number ?? "";
        if (contactPhone) {
          const { error } = await supabase.functions.invoke("sms-send", {
            method: "POST",
            body: {
              to: contactPhone,
              message: text,
              contact_id: record.contact_id,
              project_id: record.project_id ?? null,
            },
          });
          if (error) {
            console.error("SMS send error:", error);
          }
        }
      } else if (record.contact_id) {
        // For other channels (web_chat), log manually since there's no send function
        await create("communication_log", {
          data: {
            contact_id: record.contact_id,
            project_id: record.project_id ?? null,
            channel: record.channel,
            direction: "outbound",
            content_summary: text.substring(0, 500),
          },
        });
      }

      setMessageText("");
      refresh();
    } catch {
      notify("Failed to send message", { type: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSendMessages =
    record.status === "active" || record.status === "escalated";

  return (
    <div className="mt-2 max-w-3xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Conversation #{String(record.id)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {record.channel} &middot; started{" "}
              {formatDistance(new Date(record.created_at), new Date(), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                record.status === "escalated" ? "destructive" : "default"
              }
            >
              {record.status}
            </Badge>
            {record.status === "escalated" && (
              <Button size="sm" variant="outline" onClick={handleTakeOver}>
                <UserCheck className="h-4 w-4 mr-1" />
                Take Over
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="space-y-3 max-h-[500px] overflow-y-auto mb-4"
          >
            {messages.map((msg) => (
              <div
                key={String(msg.id)}
                className={`flex ${msg.sender_type === "contact" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender_type === "contact"
                      ? "bg-muted"
                      : msg.sender_type === "agent_ai"
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {msg.sender_type === "contact"
                        ? "Prospect"
                        : msg.sender_type === "agent_ai"
                          ? "AI"
                          : "Agent"}
                    </Badge>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistance(new Date(msg.created_at), new Date(), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message input */}
          {canSendMessages && (
            <div className="flex gap-2 border-t pt-3">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={1}
                disabled={sending}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
                className="self-end"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
