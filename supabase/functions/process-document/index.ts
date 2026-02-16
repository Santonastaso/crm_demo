import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders } from "../_shared/utils.ts";
import { generateEmbedding } from "../_shared/embeddings.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { extractText, getDocumentProxy } from "npm:unpdf";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const { document_id } = await req.json();

  if (!document_id) {
    return createErrorResponse(400, "document_id is required");
  }

  // Fetch the document record
  const { data: doc, error: docError } = await supabaseAdmin
    .from("knowledge_documents")
    .select("*")
    .eq("id", document_id)
    .single();

  if (!doc || docError) {
    return createErrorResponse(404, "Document not found");
  }

  try {
    // Update status to processing
    await supabaseAdmin
      .from("knowledge_documents")
      .update({ status: "processing" })
      .eq("id", document_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("knowledge")
      .download(doc.file_path);

    if (!fileData || downloadError) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Extract text based on file type
    let text = "";
    const fileType = (doc.file_type ?? "").toLowerCase();

    if (fileType === "pdf") {
      const arrayBuffer = await fileData.arrayBuffer();
      const pdfDoc = await getDocumentProxy(new Uint8Array(arrayBuffer));
      const { text: pdfText } = await extractText(pdfDoc, { mergePages: true });
      text = pdfText ?? "";
    } else {
      // .txt, .md, .docx fallback to plain text
      text = await fileData.text();
    }

    if (!text.trim()) {
      throw new Error("No text could be extracted from the document");
    }

    // Chunk the text
    const chunks = chunkText(text);

    // Delete existing chunks for this document
    await supabaseAdmin
      .from("document_chunks")
      .delete()
      .eq("document_id", document_id);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      if (!embedding) {
        throw new Error("Failed to generate embedding — check OPENAI_API_KEY");
      }
      await supabaseAdmin.from("document_chunks").insert({
        document_id,
        content: chunks[i],
        embedding,
        chunk_index: i,
      });
    }

    // Update document status
    await supabaseAdmin
      .from("knowledge_documents")
      .update({ status: "processed" })
      .eq("id", document_id);

    return new Response(
      JSON.stringify({
        document_id,
        chunks_created: chunks.length,
        status: "processed",
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("Error processing document:", err);

    await supabaseAdmin
      .from("knowledge_documents")
      .update({ status: "error" })
      .eq("id", document_id);

    return createErrorResponse(500, `Processing failed: ${(err as Error).message}`);
  }
});
