import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, Loader2, Trash2, Link as LinkIcon } from "lucide-react";
import { useGetIdentity, useNotify, useGetList, useRefresh } from "ra-core";
import { useState, useEffect } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { EmailAccount } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const EmailSettingsPage = () => {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();
  const refresh = useRefresh();
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState<number | null>(null);

  // Check for ?connected= query param from OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    const searchPart = hash.split("?")[1];
    if (searchPart) {
      const params = new URLSearchParams(searchPart);
      const connected = params.get("connected");
      if (connected) {
        notify(`Gmail account connected: ${connected}`);
        // Clean URL
        window.history.replaceState(null, "", `${window.location.pathname}#/settings/email`);
        refresh();
      }
    }
  }, [notify, refresh]);

  const salesId = identity?.id;

  const { data: accounts = [], isPending } = useGetList<EmailAccount>(
    "email_accounts",
    {
      pagination: { page: 1, perPage: 10 },
      sort: { field: "created_at", order: "DESC" },
      filter: salesId ? { sales_id: salesId } : {},
    },
    { enabled: !!salesId },
  );

  const handleConnect = () => {
    if (!salesId) {
      notify("You must be logged in to connect Gmail", { type: "error" });
      return;
    }
    const authUrl = `${SUPABASE_URL}/functions/v1/gmail-auth?action=authorize&sales_id=${salesId}`;
    window.location.href = authUrl;
  };

  const handleSync = async (accountSalesId?: number) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("gmail-sync", {
        method: "POST",
        body: { sales_id: accountSalesId ?? salesId },
      });
      if (error) throw error;
      const results = data?.results ?? [];
      const total = results.reduce(
        (sum: number, r: { synced: number }) => sum + r.synced,
        0,
      );
      notify(`Synced ${total} email${total !== 1 ? "s" : ""}`);
      refresh();
    } catch {
      notify("Email sync failed", { type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (accountId: number) => {
    setDisconnecting(accountId);
    try {
      const { error } = await supabase.functions.invoke("gmail-auth", {
        method: "POST",
        body: { action: "disconnect", email_account_id: accountId },
      });
      if (error) throw error;
      notify("Gmail account disconnected");
      refresh();
    } catch {
      notify("Failed to disconnect account", { type: "error" });
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle className="text-lg">Email Integration</CardTitle>
          </div>
          <Button size="sm" onClick={handleConnect}>
            <LinkIcon className="h-4 w-4 mr-1" />
            Connect Gmail
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Gmail account to send and receive emails directly from
            the CRM. Email history is automatically tracked on contact cards.
          </p>

          {isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No Gmail accounts connected yet.
            </p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={String(account.id)}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {account.email_address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {account.last_synced_at
                          ? `Last synced: ${new Date(account.last_synced_at).toLocaleString()}`
                          : "Never synced"}
                      </p>
                    </div>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(account.sales_id as number)}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDisconnect(Number(account.id))
                      }
                      disabled={disconnecting === Number(account.id)}
                    >
                      {disconnecting === Number(account.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

EmailSettingsPage.path = "/settings/email";
