import {
  ShowBase,
  useShowContext,
  useGetList,
  useNotify,
  useRefresh,
} from "ra-core";
import { ReferenceField, TextField } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, FileText, Hash, CheckCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { KnowledgeDocument, DocumentChunk } from "../types";

export const KnowledgeShow = () => (
  <ShowBase>
    <KnowledgeShowContent />
  </ShowBase>
);

const KnowledgeShowContent = () => {
  const { record, isPending } = useShowContext<KnowledgeDocument>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [reprocessing, setReprocessing] = useState(false);
  const [expandedChunk, setExpandedChunk] = useState<number | null>(null);

  const { data: chunks = [], isPending: chunksLoading } =
    useGetList<DocumentChunk>(
      "document_chunks",
      {
        pagination: { page: 1, perPage: 200 },
        sort: { field: "chunk_index", order: "ASC" },
        filter: record?.id ? { document_id: record.id } : {},
      },
      { enabled: !!record?.id },
    );

  if (isPending || !record) return null;

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      const { error } = await supabase.functions.invoke("process-document", {
        method: "POST",
        body: { document_id: record.id },
      });
      if (error) throw error;
      notify("Document reprocessing started");
      refresh();
    } catch {
      notify("Failed to reprocess document", { type: "error" });
    } finally {
      setReprocessing(false);
    }
  };

  const statusVariant =
    record.status === "processed"
      ? "default"
      : record.status === "error"
        ? "destructive"
        : "secondary";

  return (
    <div className="mt-2 max-w-4xl mx-auto space-y-4">
      {/* Document metadata */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{record.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {record.project_id && (
                  <span className="text-sm text-muted-foreground">
                    Project:{" "}
                    <ReferenceField
                      source="project_id"
                      reference="projects"
                      link={false}
                    >
                      <TextField source="name" />
                    </ReferenceField>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{record.status}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReprocess}
              disabled={reprocessing}
            >
              {reprocessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Reprocess
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">File Type</span>
              <p className="font-medium">{record.file_type ?? "unknown"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">File Path</span>
              <p className="font-medium text-xs truncate">{record.file_path}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Uploaded</span>
              <p className="font-medium">
                {new Date(record.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chunks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Document Chunks ({chunks.length})
            </CardTitle>
            {record.status === "processed" && chunks.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Indexed
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {chunksLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading chunks...
            </div>
          ) : chunks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {record.status === "pending" || record.status === "processing" as string
                ? "Document is being processed..."
                : record.status === "error"
                  ? "Processing failed. Try reprocessing."
                  : "No chunks found."}
            </p>
          ) : (
            <div className="space-y-2">
              {chunks.map((chunk) => {
                const isExpanded = expandedChunk === Number(chunk.id);
                const preview = chunk.content.substring(0, 200);
                const hasMore = chunk.content.length > 200;

                return (
                  <div
                    key={String(chunk.id)}
                    className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() =>
                      setExpandedChunk(isExpanded ? null : Number(chunk.id))
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Chunk #{chunk.chunk_index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {chunk.content.length} chars
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {isExpanded ? chunk.content : preview}
                      {!isExpanded && hasMore && (
                        <span className="text-muted-foreground">...</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
