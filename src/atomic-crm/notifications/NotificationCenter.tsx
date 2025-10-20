import { formatDistanceToNow } from "date-fns";
import { Bell, Check, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { useGetIdentity, useGetList, useUpdate, useRedirect } from "ra-core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "../types";

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export const NotificationCenter = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const [update] = useUpdate();

  const { data: notifications, refetch } = useGetList<Notification>(
    "notifications",
    {
      filter: { user_id: identity?.id },
      pagination: { page: 1, perPage: 10 },
      sort: { field: "created_at", order: "DESC" },
    },
  );

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const markAsRead = (notificationId: string | number) => {
    const notification = notifications?.find((n) => n.id === notificationId);
    if (!notification) return;

    update(
      "notifications",
      {
        id: notificationId,
        data: { read: true },
        previousData: notification,
      },
      {
        onSuccess: () => {
          refetch();
        },
      },
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    // Navigate to entity if available
    if (notification.entity_type && notification.entity_id) {
      const entityMap: Record<string, string> = {
        opportunity: "deals",
        deal: "deals",
        lead: "contacts",
        customer: "companies",
        task: "tasks",
      };

      const resource =
        entityMap[notification.entity_type] || notification.entity_type;
      redirect("show", resource, notification.entity_id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifiche</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {unreadCount} non {unreadCount === 1 ? "letta" : "lette"}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="max-h-[400px] overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-2 p-3 cursor-pointer ${
                  !notification.read ? "bg-muted/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      priorityColors[
                        notification.priority as keyof typeof priorityColors
                      ]
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold line-clamp-1">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true },
                        )}
                      </span>
                      {notification.entity_type && (
                        <Badge variant="outline" className="text-xs">
                          {notification.entity_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nessuna notifica</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="justify-center cursor-pointer"
          onClick={() => redirect("list", "notifications")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Vedi tutte
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
