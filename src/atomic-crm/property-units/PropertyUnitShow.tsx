import { ShowBase, useShowContext, useGetList, useNotify, useRefresh } from "ra-core";
import { ReferenceField, TextField, EditButton } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { Identifier } from "ra-core";
import { UNIT_STATUS_COLORS } from "./unitStatus";
import { formatEUR } from "@/lib/formatPrice";
import type { UnitDocument } from "../types";

const DOC_TYPE_CHOICES = [
  { id: "planimetria", name: "Planimetria" },
  { id: "render", name: "Render" },
  { id: "capitolato", name: "Capitolato" },
  { id: "atto", name: "Atto" },
  { id: "foto", name: "Foto" },
  { id: "altro", name: "Altro" },
];

const UnitDocuments = ({ unitId }: { unitId: Identifier }) => {
  const { data: docs, isLoading } = useGetList<UnitDocument>("unit_documents", {
    filter: { unit_id: unitId },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: 100 },
  });
  const notify = useNotify();
  const refresh = useRefresh();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("planimetria");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `units/${unitId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("unit-documents")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("unit_documents")
        .insert({
          unit_id: unitId,
          title: file.name,
          doc_type: docType,
          file_path: path,
          file_type: file.type || file.name.split(".").pop() || "",
        });
      if (insertError) throw insertError;

      notify("Document uploaded");
      refresh();
    } catch {
      notify("Upload failed", { type: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (doc: UnitDocument) => {
    try {
      await supabase.storage.from("unit-documents").remove([doc.file_path]);
      await supabase.from("unit_documents").delete().eq("id", doc.id);
      notify("Document deleted");
      refresh();
    } catch {
      notify("Delete failed", { type: "error" });
    }
  };

  const handleDownload = async (doc: UnitDocument) => {
    const { data } = await supabase.storage
      .from("unit-documents")
      .createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm">Documents</CardTitle>
        <div className="flex items-center gap-2">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            {DOC_TYPE_CHOICES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !docs?.length ? (
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={String(doc.id)}
                className="flex items-center justify-between border rounded px-3 py-2"
              >
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleDownload(doc)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{doc.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {doc.doc_type}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PropertyUnitShowContent = () => {
  const { record, isPending } = useShowContext();
  if (isPending || !record) return null;

  const fmt = formatEUR;

  return (
    <div className="mt-2 max-w-3xl mx-auto space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{record.code}</h2>
              <div className="text-muted-foreground">
                <ReferenceField source="project_id" reference="projects" link="show">
                  <TextField source="name" />
                </ReferenceField>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={UNIT_STATUS_COLORS[record.status] ?? "outline"} className="text-sm">
                {record.status}
              </Badge>
              <EditButton />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Typology</div>
              <div className="font-medium">{record.typology ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Floor</div>
              <div className="font-medium">{record.floor ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Orientation</div>
              <div className="font-medium">{record.orientation ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Energy Class</div>
              <div className="font-medium">{record.energy_class ?? "—"}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm mt-4">
            <div>
              <div className="text-muted-foreground">SQM</div>
              <div className="font-medium">{record.square_meters ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Rooms</div>
              <div className="font-medium">{record.rooms ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Bathrooms</div>
              <div className="font-medium">{record.bathrooms ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Discount</div>
              <div className="font-medium">{record.discount_pct ? `${record.discount_pct}%` : "—"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div>
              <div className="text-muted-foreground">Base Price</div>
              <div className="font-medium text-lg">{fmt(record.base_price)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Current Price</div>
              <div className="font-medium text-lg">{fmt(record.current_price)}</div>
            </div>
          </div>

          {record.description && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">Description</div>
              <p className="text-sm mt-1">{record.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <UnitDocuments unitId={record.id} />
    </div>
  );
};

export const PropertyUnitShow = () => (
  <ShowBase>
    <PropertyUnitShowContent />
  </ShowBase>
);
