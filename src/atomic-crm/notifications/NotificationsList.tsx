import { formatDistanceToNow, isToday, isThisWeek } from "date-fns";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useGetIdentity, useGetList, useUpdate, useNotify, useRedirect } from "ra-core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Notification } from "../types";

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const NotificationsList = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const notify = useNotify();
  const [update] = useUpdate();
  
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');

  const { data: notifications, isPending, refetch } = useGetList<Notification>('notifications', {
    filter: {
      user_id: identity?.id,
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      ...(readFilter !== 'all' && { read: readFilter === 'read' }),
      ...(entityTypeFilter !== 'all' && { entity_type: entityTypeFilter }),
    },
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'created_at', order: 'DESC' },
  });

  const markAsRead = (notificationId: string | number) => {
    const notification = notifications?.find(n => n.id === notificationId);
    if (!notification) return;

    update(
      'notifications',
      {
        id: notificationId,
        data: { read: true },
        previousData: notification,
      },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error) => {
          notify(`Errore: ${error.message}`, { type: 'error' });
        },
      }
    );
  };

  const markAllAsRead = () => {
    const unreadNotifications = notifications?.filter(n => !n.read) || [];
    
    Promise.all(
      unreadNotifications.map(notification =>
        update(
          'notifications',
          {
            id: notification.id,
            data: { read: true },
            previousData: notification,
          }
        )
      )
    ).then(() => {
      notify('Tutte le notifiche segnate come lette', { type: 'success' });
      refetch();
    }).catch((error) => {
      notify(`Errore: ${error.message}`, { type: 'error' });
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to entity if available
    if (notification.entity_type && notification.entity_id) {
      const entityMap: Record<string, string> = {
        opportunity: 'deals',
        deal: 'deals',
        lead: 'contacts',
        customer: 'companies',
        task: 'tasks',
      };

      const resource = entityMap[notification.entity_type] || notification.entity_type;
      redirect('show', resource, notification.entity_id);
    }
  };

  // Group notifications
  const groupedNotifications = {
    today: notifications?.filter(n => isToday(new Date(n.created_at))) || [],
    thisWeek: notifications?.filter(n => 
      !isToday(new Date(n.created_at)) && isThisWeek(new Date(n.created_at))
    ) || [],
    older: notifications?.filter(n => 
      !isThisWeek(new Date(n.created_at))
    ) || [],
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  if (isPending) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Notifiche</h1>
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifiche</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} notifica{unreadCount !== 1 ? 'he' : ''} non {unreadCount !== 1 ? 'lette' : 'letta'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Segna tutte come lette
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Stato lettura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="unread">Non lette</SelectItem>
            <SelectItem value="read">Lette</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Priorità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le priorità</SelectItem>
            <SelectItem value="low">Bassa</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo entità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="opportunity">Opportunità</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="customer">Cliente</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="proposal">Proposta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      {notifications && notifications.length > 0 ? (
        <div className="space-y-8">
          {groupedNotifications.today.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Oggi</h2>
              <div className="space-y-2">
                {groupedNotifications.today.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedNotifications.thisWeek.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Questa settimana</h2>
              <div className="space-y-2">
                {groupedNotifications.thisWeek.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedNotifications.older.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Meno recenti</h2>
              <div className="space-y-2">
                {groupedNotifications.older.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              Nessuna notifica trovata
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {priorityFilter !== 'all' || readFilter !== 'all' || entityTypeFilter !== 'all'
                ? 'Prova a modificare i filtri'
                : 'Le tue notifiche appariranno qui'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const NotificationItem = ({
  notification,
  onRead,
  onClick,
}: {
  notification: Notification;
  onRead: (id: string | number) => void;
  onClick: (notification: Notification) => void;
}) => {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        !notification.read ? 'border-l-4 border-l-primary' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={priorityColors[notification.priority as keyof typeof priorityColors]}>
                {notification.priority.toUpperCase()}
              </Badge>
              {notification.entity_type && (
                <Badge variant="outline">
                  {notification.entity_type}
                </Badge>
              )}
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>

            <h3 className="font-semibold mb-1">{notification.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>

          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRead(notification.id);
              }}
              title="Segna come letto"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


