import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { generateEmbedding } from "../_shared/embeddings.ts";
import { KB_MATCH_THRESHOLD, KB_MATCH_COUNT } from "../_shared/constants.ts";

export async function searchKnowledgeBase(
  query: string,
  projectId: number | null,
): Promise<string> {
  const embedding = await generateEmbedding(query);

  if (embedding) {
    const { data, error } = await supabaseAdmin.rpc("match_document_chunks", {
      query_embedding: embedding,
      match_threshold: KB_MATCH_THRESHOLD,
      match_count: KB_MATCH_COUNT,
      filter_project_id: projectId,
    });

    if (!error && data?.length) {
      return data
        .map((chunk: { content: string }) => chunk.content)
        .join("\n\n---\n\n");
    }
  }

  let textQuery = supabaseAdmin
    .from("document_chunks")
    .select("content, document_id")
    .ilike("content", `%${query.split(" ").slice(0, 3).join("%")}%`)
    .limit(5);

  if (projectId) {
    const { data: docIds } = await supabaseAdmin
      .from("knowledge_documents")
      .select("id")
      .eq("project_id", projectId);
    if (docIds?.length) {
      textQuery = textQuery.in(
        "document_id",
        docIds.map((d: { id: number }) => d.id),
      );
    }
  }

  const { data: textResults } = await textQuery;

  if (textResults?.length) {
    return textResults
      .map((chunk: { content: string }) => chunk.content)
      .join("\n\n---\n\n");
  }

  return "No relevant information found in the knowledge base.";
}
