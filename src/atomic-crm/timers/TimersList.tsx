import { format } from "date-fns";
import { Clock, Pause, Play, CheckCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGetList, useUpdate, useDelete, useNotify, useGetIdentity } from "ra-core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Timer } from "../types";

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  paused: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const TimersList = () => {
  const { identity } = useGetIdentity();
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: timers, isPending, refetch } = useGetList<Timer>('timers', {
    filter: {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(entityTypeFilter !== 'all' && { entity_type: entityTypeFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    },
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'next_trigger', order: 'ASC' },
  });

  if (isPending) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">I Miei Promemoria</h1>
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">I Miei Promemoria</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="active">Attivo</SelectItem>
            <SelectItem value="paused">In pausa</SelectItem>
            <SelectItem value="completed">Completato</SelectItem>
            <SelectItem value="expired">Scaduto</SelectItem>
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
      </div>

      {/* Timers List */}
      {timers && timers.length > 0 ? (
        <div className="space-y-4">
          {timers.map((timer) => (
            <TimerCard key={timer.id} timer={timer} onUpdate={refetch} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              Nessun promemoria trovato
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {statusFilter !== 'all' || entityTypeFilter !== 'all' || priorityFilter !== 'all'
                ? 'Prova a modificare i filtri'
                : 'Crea il tuo primo promemoria da un\'opportunità o contatto'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const TimerCard = ({ timer, onUpdate }: { timer: Timer; onUpdate: () => void }) => {
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const notify = useNotify();

  const handlePauseResume = () => {
    const newStatus = timer.status === 'active' ? 'paused' : 'active';
    update(
      'timers',
      {
        id: timer.id,
        data: { status: newStatus },
        previousData: timer,
      },
      {
        onSuccess: () => {
          notify(`Timer ${newStatus === 'active' ? 'riattivato' : 'in pausa'}`, { type: 'success' });
          onUpdate();
        },
        onError: (error) => {
          notify(`Errore: ${error.message}`, { type: 'error' });
        },
      }
    );
  };

  const handleComplete = () => {
    update(
      'timers',
      {
        id: timer.id,
        data: { status: 'completed' },
        previousData: timer,
      },
      {
        onSuccess: () => {
          notify('Timer completato', { type: 'success' });
          onUpdate();
        },
        onError: (error) => {
          notify(`Errore: ${error.message}`, { type: 'error' });
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm('Sei sicuro di voler eliminare questo promemoria?')) {
      deleteOne(
        'timers',
        { id: timer.id, previousData: timer },
        {
          onSuccess: () => {
            notify('Timer eliminato', { type: 'success' });
            onUpdate();
          },
          onError: (error) => {
            notify(`Errore: ${error.message}`, { type: 'error' });
          },
        }
      );
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={priorityColors[timer.priority]}>
                {timer.priority.toUpperCase()}
              </Badge>
              <Badge className={statusColors[timer.status]}>
                {timer.status}
              </Badge>
              <Badge variant="outline">
                {timer.entity_type} #{timer.entity_id}
              </Badge>
            </div>

            <h3 className="text-lg font-semibold mb-2">{timer.action_required}</h3>
            
            {timer.description && (
              <p className="text-sm text-muted-foreground mb-3">{timer.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {timer.next_trigger && timer.status === 'active' && (
                <div>
                  <span className="text-muted-foreground">Prossima attivazione:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(timer.next_trigger), "PPp")}
                  </span>
                </div>
              )}

              {timer.last_triggered && (
                <div>
                  <span className="text-muted-foreground">Ultima attivazione:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(timer.last_triggered), "PPp")}
                  </span>
                </div>
              )}

              {timer.recurrence_enabled && (
                <div>
                  <span className="text-muted-foreground">Ricorrenza:</span>
                  <span className="ml-2 font-medium">
                    {timer.recurrence_pattern} (ogni {timer.recurrence_interval})
                  </span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground">Attivazioni:</span>
                <span className="ml-2 font-medium">{timer.trigger_count}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            {timer.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseResume}
                  title="Metti in pausa"
                >
                  <Pause className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleComplete}
                  title="Segna come completato"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </>
            )}

            {timer.status === 'paused' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseResume}
                title="Riattiva"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              title="Elimina"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


