import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";
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

async function generateEmbedding(text: string): Promise<number[]> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!anthropicKey) {
    // Fallback: generate a zero vector if no API key. Placeholder for when key is available.
    console.warn("ANTHROPIC_API_KEY not set. Using zero embedding placeholder.");
    return new Array(1536).fill(0);
  }

  // Use Anthropic's partner embedding model or an alternative.
  // For now, use a simple fetch to an embedding endpoint.
  // In production, switch to Voyage AI or OpenAI embeddings.
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    const result = await response.json();
    return result.data[0].embedding;
  }

  // No embedding API available — return zero vector
  console.warn("No embedding API key available. Using zero vector.");
  return new Array(1536).fill(0);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

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

    // Generate embeddings and insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      await supabaseAdmin.from("document_chunks").insert({
        document_id,
        content: chunks[i],
        embedding: embedding,
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
