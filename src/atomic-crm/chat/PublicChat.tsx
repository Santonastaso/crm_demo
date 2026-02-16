import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
}

async function sendChatMessage(
  message: string,
  conversationId: number | null,
  projectId: number | null,
): Promise<{ conversation_id: number; response: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      project_id: projectId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }

  return res.json();
}

export const PublicChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read optional project_id from URL params
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project_id")
    ? Number(params.get("project_id"))
    : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await sendChatMessage(
        userMessage.content,
        conversationId,
        projectId,
      );

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content:
            data.response ??
            "I apologize, I was unable to process your request.",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "ai",
          content: errorMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8fafc",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#1e293b",
          color: "#fff",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <MessageCircle size={24} />
        <div>
          <div style={{ fontWeight: 600, fontSize: "16px" }}>
            Real Estate Assistant
          </div>
          <div style={{ fontSize: "12px", opacity: 0.7 }}>
            Ask about properties, pricing, and availability
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "800px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              marginTop: "80px",
              fontSize: "14px",
            }}
          >
            <MessageCircle
              size={48}
              style={{ margin: "0 auto 16px", opacity: 0.3 }}
            />
            <p style={{ fontWeight: 500 }}>Welcome!</p>
            <p style={{ marginTop: "4px" }}>
              Ask me anything about our real estate projects, properties, or
              services.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent:
                msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                borderRadius: "12px",
                padding: "10px 14px",
                fontSize: "14px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                backgroundColor:
                  msg.sender === "user" ? "#1e293b" : "#e2e8f0",
                color: msg.sender === "user" ? "#fff" : "#1e293b",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                backgroundColor: "#e2e8f0",
                borderRadius: "12px",
                padding: "10px 14px",
              }}
            >
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: "1px solid #e2e8f0",
          padding: "16px 24px",
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "flex",
            gap: "8px",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              backgroundColor:
                !input.trim() || isLoading ? "#94a3b8" : "#1e293b",
              color: "#fff",
              border: "none",
              cursor:
                !input.trim() || isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

PublicChat.path = "/public/chat";
