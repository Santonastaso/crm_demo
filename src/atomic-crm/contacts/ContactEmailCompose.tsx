import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useNotify, useRefresh, useGetIdentity } from "ra-core";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { Contact } from "../types";

interface ContactEmailComposeProps {
  contact: Contact;
}

export const ContactEmailCompose = ({ contact }: ContactEmailComposeProps) => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const notify = useNotify();
  const refresh = useRefresh();
  const { data: identity } = useGetIdentity();

  const emails = contact.email_jsonb ?? [];
  const primaryEmail = emails[0]?.email;

  if (!primaryEmail) return null;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      notify("Subject and body are required", { type: "error" });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("gmail-send", {
        method: "POST",
        body: {
          to: primaryEmail,
          subject: subject.trim(),
          body_html: `<div>${body.replace(/\n/g, "<br>")}</div>`,
          body_text: body,
          contact_id: contact.id,
          sales_id: identity?.id,
        },
      });

      if (error) throw error;

      notify(`Email sent to ${primaryEmail}`);
      setSubject("");
      setBody("");
      setOpen(false);
      refresh();
    } catch {
      notify("Failed to send email. Is Gmail connected in Settings?", {
        type: "error",
      });
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
        <Mail className="h-4 w-4" />
        Send Email
      </Button>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mail className="h-4 w-4" />
          New Email to {primaryEmail}
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
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={sending}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={6}
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
            disabled={sending || !subject.trim() || !body.trim()}
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
