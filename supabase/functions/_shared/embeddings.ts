import { fetchJson } from "./fetchJson.ts";

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";

interface OpenAIEmbeddingResponse {
  data?: Array<{ embedding?: number[] }>;
}

export async function generateEmbedding(
  text: string,
): Promise<number[] | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    console.warn("OPENAI_API_KEY not set — cannot generate embedding");
    return null;
  }

  const result = await fetchJson<OpenAIEmbeddingResponse>(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!result.ok) {
    console.error("OpenAI embeddings error:", result.data);
    return null;
  }

  return result.data.data?.[0]?.embedding ?? null;
}
