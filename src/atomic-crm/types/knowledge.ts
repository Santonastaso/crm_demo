import type { Identifier, RaRecord } from "ra-core";

export type KnowledgeDocumentStatus = "pending" | "processed" | "error";

export type KnowledgeDocument = {
  project_id: Identifier;
  title: string;
  file_path: string;
  file_type?: string;
  status: KnowledgeDocumentStatus;
  created_at: string;
} & Pick<RaRecord, "id">;

export type DocumentChunk = {
  document_id: Identifier;
  content: string;
  chunk_index: number;
} & Pick<RaRecord, "id">;
