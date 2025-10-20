import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useCreate,
  useGetIdentity,
  useNotify,
  useRecordContext,
  useRefresh,
} from "ra-core";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Deal, DealInteraction } from "../../types";

const interactionSchema = z.object({
  type: z.enum([
    "Email",
    "Chiamata",
    "Meeting",
    "Demo",
    "Proposta",
    "Negoziazione",
    "Follow-up",
    "Altro",
  ]),
  datetime: z.string().min(1, "Date and time are required"),
  duration: z.number().min(0).optional(),
  participants: z.array(z.number()).optional(),
  notes: z.string().optional(),
  sentiment: z.enum(["Positivo", "Neutro", "Negativo", "Critico"]).optional(),
  attachments: z.array(z.any()).optional(),
});

type InteractionFormData = z.infer<typeof interactionSchema>;

export const DealInteractionCreate = ({
  onSuccess,
}: {
  onSuccess?: () => void;
}) => {
  const deal = useRecordContext<Deal>();
  const [create] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();
  const { identity } = useGetIdentity();
  const [files, setFiles] = useState<File[]>([]);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      datetime: new Date().toISOString().slice(0, 16),
      type: "Email",
      participants: [],
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: InteractionFormData) => {
    if (!deal) return;

    const attachments = files.map((file) => ({
      rawFile: file,
      src: URL.createObjectURL(file),
      title: file.name,
      type: file.type,
    }));

    const interactionData: Partial<DealInteraction> = {
      deal_id: deal.id,
      type: data.type,
      date: new Date(data.datetime).toISOString(),
      duration: data.duration,
      participants: data.participants || [],
      notes: data.notes,
      sentiment: data.sentiment,
      attachments: attachments as any,
      sales_id: identity?.id,
    };

    create(
      "dealInteractions",
      { data: interactionData },
      {
        onSuccess: () => {
          notify("Interaction created", { type: "success" });
          reset();
          setFiles([]);
          setShowForm(false);
          refresh();
          onSuccess?.();
        },
        onError: (error) => {
          notify(`Error: ${error.message}`, { type: "error" });
        },
      },
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        + Nuova Interazione
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 p-4 border rounded-lg"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Nuova Interazione</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowForm(false);
            reset();
            setFiles([]);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Tipologia *</Label>
        <Select
          value={selectedType}
          onValueChange={(value) => setValue("type", value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Email">Email</SelectItem>
            <SelectItem value="Chiamata">Chiamata</SelectItem>
            <SelectItem value="Meeting">Meeting</SelectItem>
            <SelectItem value="Demo">Demo</SelectItem>
            <SelectItem value="Proposta">Proposta</SelectItem>
            <SelectItem value="Negoziazione">Negoziazione</SelectItem>
            <SelectItem value="Follow-up">Follow-up</SelectItem>
            <SelectItem value="Altro">Altro</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Date and Time */}
      <div className="space-y-2">
        <Label htmlFor="datetime">Data e Ora *</Label>
        <Input id="datetime" type="datetime-local" {...register("datetime")} />
        {errors.datetime && (
          <p className="text-sm text-destructive">{errors.datetime.message}</p>
        )}
      </div>

      {/* Duration (for calls/meetings) */}
      {["Chiamata", "Meeting", "Demo"].includes(selectedType) && (
        <div className="space-y-2">
          <Label htmlFor="duration">Durata (minuti)</Label>
          <Input
            id="duration"
            type="number"
            min="0"
            {...register("duration", { valueAsNumber: true })}
          />
          {errors.duration && (
            <p className="text-sm text-destructive">
              {errors.duration.message}
            </p>
          )}
        </div>
      )}

      {/* Participants */}
      <div className="space-y-2">
        <Label>Partecipanti</Label>
        <div className="text-sm text-muted-foreground mb-2">
          Seleziona i contatti coinvolti in questa interazione
        </div>
        {/* Note: This would need proper ReferenceArrayInput implementation */}
        <Input
          placeholder="Contact IDs (comma separated)"
          onChange={(e) => {
            const ids = e.target.value
              .split(",")
              .map((id) => parseInt(id.trim()))
              .filter((id) => !isNaN(id));
            setValue("participants", ids);
          }}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea
          id="notes"
          placeholder="Aggiungi dettagli sull'interazione..."
          rows={4}
          {...register("notes")}
        />
      </div>

      {/* Sentiment */}
      <div className="space-y-2">
        <Label>Sentiment</Label>
        <RadioGroup
          onValueChange={(value) => setValue("sentiment", value as any)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Positivo" id="positivo" />
            <Label htmlFor="positivo">Positivo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Neutro" id="neutro" />
            <Label htmlFor="neutro">Neutro</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Negativo" id="negativo" />
            <Label htmlFor="negativo">Negativo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Critico" id="critico" />
            <Label htmlFor="critico">Critico</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <Label htmlFor="attachments">Allegati</Label>
        <div className="flex items-center gap-2">
          <Input
            id="attachments"
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("attachments")?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Carica file
          </Button>
        </div>
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-secondary rounded"
              >
                <span className="text-sm">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvataggio..." : "Salva Interazione"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowForm(false);
            reset();
            setFiles([]);
          }}
        >
          Annulla
        </Button>
      </div>
    </form>
  );
};
