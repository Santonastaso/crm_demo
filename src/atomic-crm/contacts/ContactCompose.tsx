import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Phone, Send, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useNotify, useRefresh, useGetIdentity } from "ra-core";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { Contact } from "../types";

type Channel = "email" | "whatsapp" | "sms";

interface ContactComposeProps {
  contact: Contact;
  channel: Channel;
}

const CHANNEL_CONFIG: Record<
  Channel,
  {
    label: string;
    icon: typeof Mail;
    functionName: string;
    getRecipient: (contact: Contact) => string | undefined;
    recipientLabel: (r: string) => string;
    hasSubject: boolean;
  }
> = {
  email: {
    label: "Send Email",
    icon: Mail,
    functionName: "gmail-send",
    getRecipient: (c) => (c.email_jsonb ?? [])[0]?.email,
    recipientLabel: (r) => `New Email to ${r}`,
    hasSubject: true,
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageSquare,
    functionName: "whatsapp-send",
    getRecipient: (c) => (c.phone_jsonb ?? [])[0]?.number,
    recipientLabel: (r) => `WhatsApp to ${r}`,
    hasSubject: false,
  },
  sms: {
    label: "SMS",
    icon: Phone,
    functionName: "sms-send",
    getRecipient: (c) => (c.phone_jsonb ?? [])[0]?.number,
    recipientLabel: (r) => `SMS to ${r}`,
    hasSubject: false,
  },
};

export const ContactCompose = ({ contact, channel }: ContactComposeProps) => {
  const config = CHANNEL_CONFIG[channel];
  const Icon = config.icon;
  const recipient = config.getRecipient(contact);

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const notify = useNotify();
  const refresh = useRefresh();
  const { data: identity } = useGetIdentity();

  if (!recipient) return null;

  const handleSend = async () => {
    if (!body.trim() || (config.hasSubject && !subject.trim())) {
      notify("All fields are required", { type: "error" });
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, unknown> =
        channel === "email"
          ? {
              to: recipient,
              subject: subject.trim(),
              body_html: `<div>${body.replace(/\n/g, "<br>")}</div>`,
              body_text: body,
              contact_id: contact.id,
              sales_id: identity?.id,
            }
          : {
              to: recipient,
              message: body.trim(),
              contact_id: contact.id,
            };

      const { error } = await supabase.functions.invoke(config.functionName, {
        method: "POST",
        body: payload,
      });

      if (error) throw error;

      notify(`${config.label} sent to ${recipient}`);
      setSubject("");
      setBody("");
      setOpen(false);
      refresh();
    } catch {
      notify(`Failed to send ${config.label}`, { type: "error" });
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
        {config.label}
      </Button>
    );
  }

  const canSend = config.hasSubject
    ? body.trim() && subject.trim()
    : body.trim();

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {config.recipientLabel(recipient)}
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
        {config.hasSubject && (
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={sending}
          />
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={channel === "email" ? 6 : 4}
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
          <Button size="sm" onClick={handleSend} disabled={sending || !canSend}>
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
