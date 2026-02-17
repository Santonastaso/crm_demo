import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { ChatMessage } from "./chatTypes";

export function useChatMessages(projectId?: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const send = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        method: "POST",
        body: {
          message: content,
          conversation_id: conversationId,
          project_id: projectId ?? undefined,
        },
      });

      if (error) throw error;

      if (data?.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai" as const,
          content:
            data?.response ??
            "I apologize, I was unable to process your request.",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      let errorMessage = "Sorry, something went wrong. Please try again.";
      if (
        err &&
        typeof err === "object" &&
        "context" in err &&
        err.context instanceof Response
      ) {
        try {
          const body = await (err.context as Response).json();
          if (body?.message && typeof body.message === "string") {
            errorMessage = body.message;
          }
        } catch {
          // ignore parse errors
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "ai" as const,
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId, projectId]);

  return { messages, input, setInput, isLoading, send, messagesEndRef };
}
