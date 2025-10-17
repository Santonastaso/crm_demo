import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreate, useGetIdentity, useGetList, useNotify } from "ra-core";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Sale, Timer } from "../types";

const timerSchema = z.object({
  timer_type: z.enum(['absolute', 'relative']),
  fixed_datetime: z.string().optional(),
  trigger_event: z.string().optional(),
  delay_value: z.number().min(1).optional(),
  delay_unit: z.enum(['minutes', 'hours', 'days', 'weeks']).optional(),
  action_required: z.string().min(1, 'Action required is mandatory'),
  description: z.string().optional(),
  assigned_to: z.number(),
  notify_also: z.array(z.number()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  recurrence_enabled: z.boolean(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  recurrence_interval: z.number().min(1).optional(),
  recurrence_end_condition: z.enum(['never', 'after_n_times', 'until_date']).optional(),
  recurrence_end_value: z.string().optional(),
});

type TimerFormData = z.infer<typeof timerSchema>;

interface TimerCreateDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: 'opportunity' | 'lead' | 'customer' | 'task' | 'proposal';
  entityId: string;
}

export const TimerCreateDialog = ({ open, onClose, entityType, entityId }: TimerCreateDialogProps) => {
  const [create] = useCreate();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  
  const { data: salesUsers } = useGetList<Sale>('sales', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'first_name', order: 'ASC' },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<TimerFormData>({
    resolver: zodResolver(timerSchema),
    defaultValues: {
      timer_type: 'relative',
      delay_unit: 'days',
      delay_value: 7,
      priority: 'medium',
      assigned_to: identity?.id,
      recurrence_enabled: false,
      notify_also: [],
    },
  });

  const timerType = watch('timer_type');
  const recurrenceEnabled = watch('recurrence_enabled');
  const recurrenceEndCondition = watch('recurrence_end_condition');
  const priority = watch('priority');

  const onSubmit = async (data: TimerFormData) => {
    let nextTrigger: string | null = null;

    if (data.timer_type === 'absolute' && data.fixed_datetime) {
      nextTrigger = new Date(data.fixed_datetime).toISOString();
    } else if (data.timer_type === 'relative' && data.delay_value && data.delay_unit) {
      const now = new Date();
      switch (data.delay_unit) {
        case 'minutes':
          now.setMinutes(now.getMinutes() + data.delay_value);
          break;
        case 'hours':
          now.setHours(now.getHours() + data.delay_value);
          break;
        case 'days':
          now.setDate(now.getDate() + data.delay_value);
          break;
        case 'weeks':
          now.setDate(now.getDate() + (data.delay_value * 7));
          break;
      }
      nextTrigger = now.toISOString();
    }

    const timerData: Partial<Timer> = {
      entity_type: entityType,
      entity_id: entityId,
      timer_type: data.timer_type,
      trigger_event: data.trigger_event,
      delay_value: data.delay_value,
      delay_unit: data.delay_unit,
      fixed_datetime: data.fixed_datetime,
      priority: data.priority,
      action_required: data.action_required,
      description: data.description,
      assigned_to: data.assigned_to,
      notify_also: data.notify_also,
      channels: ['in_app', 'email'],
      recurrence_enabled: data.recurrence_enabled,
      recurrence_pattern: data.recurrence_pattern,
      recurrence_interval: data.recurrence_interval,
      recurrence_end_condition: data.recurrence_end_condition,
      recurrence_end_value: data.recurrence_end_value,
      status: 'active',
      trigger_count: 0,
      next_trigger: nextTrigger,
      created_by: identity?.id,
    };

    create(
      'timers',
      { data: timerData },
      {
        onSuccess: () => {
          notify('Timer created successfully', { type: 'success' });
          reset();
          onClose();
        },
        onError: (error) => {
          notify(`Error: ${error.message}`, { type: 'error' });
        },
      }
    );
  };

  const priorityColors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Imposta Promemoria</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* When to trigger */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quando attivare</h3>
            
            <RadioGroup
              value={timerType}
              onValueChange={(value) => setValue('timer_type', value as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="absolute" id="absolute" />
                <Label htmlFor="absolute">Data e ora specifica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="relative" id="relative" />
                <Label htmlFor="relative">Dopo un periodo da ora</Label>
              </div>
            </RadioGroup>

            {timerType === 'absolute' ? (
              <div className="space-y-2">
                <Label htmlFor="fixed_datetime">Data e Ora</Label>
                <Input
                  id="fixed_datetime"
                  type="datetime-local"
                  {...register('fixed_datetime')}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delay_value">Tempo</Label>
                  <Input
                    id="delay_value"
                    type="number"
                    min="1"
                    {...register('delay_value', { valueAsNumber: true })}
                  />
                  {errors.delay_value && (
                    <p className="text-sm text-destructive">{errors.delay_value.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay_unit">Unità</Label>
                  <Select
                    value={watch('delay_unit')}
                    onValueChange={(value) => setValue('delay_unit', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minuti</SelectItem>
                      <SelectItem value="hours">Ore</SelectItem>
                      <SelectItem value="days">Giorni</SelectItem>
                      <SelectItem value="weeks">Settimane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* What to notify */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Cosa notificare</h3>
            
            <div className="space-y-2">
              <Label htmlFor="action_required">Azione da svolgere *</Label>
              <Input
                id="action_required"
                placeholder="Es: Inviare proposta commerciale"
                {...register('action_required')}
              />
              {errors.action_required && (
                <p className="text-sm text-destructive">{errors.action_required.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Note aggiuntive</Label>
              <Textarea
                id="description"
                placeholder="Aggiungi dettagli opzionali..."
                rows={3}
                {...register('description')}
              />
            </div>
          </div>

          {/* Who to assign */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">A chi assegnare</h3>
            
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assegna a</Label>
              <Select
                value={watch('assigned_to')?.toString()}
                onValueChange={(value) => setValue('assigned_to', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {salesUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Priorità</h3>
            
            <Select
              value={priority}
              onValueChange={(value) => setValue('priority', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className={priorityColors.low}>Bassa</span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className={priorityColors.medium}>Media</span>
                </SelectItem>
                <SelectItem value="high">
                  <span className={priorityColors.high}>Alta</span>
                </SelectItem>
                <SelectItem value="urgent">
                  <span className={priorityColors.urgent}>Urgente</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurrence_enabled"
                checked={recurrenceEnabled}
                onCheckedChange={(checked) => setValue('recurrence_enabled', !!checked)}
              />
              <Label htmlFor="recurrence_enabled">Ripeti</Label>
            </div>

            {recurrenceEnabled && (
              <div className="space-y-4 pl-6 border-l-2 border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pattern</Label>
                    <Select
                      value={watch('recurrence_pattern')}
                      onValueChange={(value) => setValue('recurrence_pattern', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Giornalmente</SelectItem>
                        <SelectItem value="weekly">Settimanalmente</SelectItem>
                        <SelectItem value="monthly">Mensilmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ogni</Label>
                    <Input
                      type="number"
                      min="1"
                      defaultValue="1"
                      {...register('recurrence_interval', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fino a</Label>
                  <Select
                    value={recurrenceEndCondition}
                    onValueChange={(value) => setValue('recurrence_end_condition', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Mai</SelectItem>
                      <SelectItem value="after_n_times">Dopo N volte</SelectItem>
                      <SelectItem value="until_date">Fino a data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurrenceEndCondition === 'after_n_times' && (
                  <Input
                    type="number"
                    min="1"
                    placeholder="Numero di ripetizioni"
                    {...register('recurrence_end_value')}
                  />
                )}

                {recurrenceEndCondition === 'until_date' && (
                  <Input
                    type="date"
                    {...register('recurrence_end_value')}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvataggio...' : 'Crea Promemoria'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

