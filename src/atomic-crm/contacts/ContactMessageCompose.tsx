import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, Loader2, X, Phone } from "lucide-react";
import { useState } from "react";
import { useNotify, useRefresh } from "ra-core";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { Contact } from "../types";

interface ContactMessageComposeProps {
  contact: Contact;
  channel: "whatsapp" | "sms";
}

export const ContactMessageCompose = ({
  contact,
  channel,
}: ContactMessageComposeProps) => {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const notify = useNotify();
  const refresh = useRefresh();

  const phones = contact.phone_jsonb ?? [];
  const primaryPhone = phones[0]?.number;

  if (!primaryPhone) return null;

  const label = channel === "whatsapp" ? "WhatsApp" : "SMS";
  const functionName = channel === "whatsapp" ? "whatsapp-send" : "sms-send";
  const Icon = channel === "whatsapp" ? MessageSquare : Phone;

  const handleSend = async () => {
    if (!body.trim()) {
      notify("Message is required", { type: "error" });
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        to: primaryPhone,
        message: body.trim(),
        contact_id: contact.id,
      };

      const { error } = await supabase.functions.invoke(functionName, {
        method: "POST",
        body: payload,
      });

      if (error) throw error;

      notify(`${label} sent to ${primaryPhone}`);
      setBody("");
      setOpen(false);
      refresh();
    } catch {
      notify(`Failed to send ${label}`, { type: "error" });
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label} to {primaryPhone}
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Write your ${label} message...`}
          rows={4}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={sending}
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending || !body.trim()}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
