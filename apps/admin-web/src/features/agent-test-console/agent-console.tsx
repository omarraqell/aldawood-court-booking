"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type AgentChatResponse = {
  conversationId: string;
  message: string;
  intent: string | null;
  language: string;
  pendingAction: string | null;
  bookingResult: { id?: string; status?: string } | null;
  toolResults: Array<{ tool: string; result: unknown }>;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

const starterPrompts = [
  "I want to book 2026-03-20 at 20:00 for 60 minutes, 5v5",
  "I want to book a court",
  "What are your birthday packages?",
  "أريد حجز ملعب يوم 2026-03-20 الساعة 20:00 لمدة 60 دقيقة 5v5"
];

const defaultPhone = "+962788000111";

export function AgentConsole() {
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState(starterPrompts[0]);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolResults, setToolResults] = useState<AgentChatResponse["toolResults"]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, toolResults]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSending) {
      return;
    }

    const outgoingMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed
    };

    setMessages((current) => [...current, outgoingMessage]);
    setIsSending(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AGENT_BASE_URL ?? "http://127.0.0.1:8000"}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phone,
            message: trimmed,
            conversation_id: conversationId || undefined
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Agent request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as AgentChatResponse;
      setConversationId(payload.conversationId);
      setPendingAction(payload.pendingAction);
      setLastIntent(payload.intent);
      setToolResults(payload.toolResults ?? []);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.message,
          meta: [
            payload.intent ? `intent: ${payload.intent}` : null,
            payload.language ? `lang: ${payload.language}` : null,
            payload.pendingAction ? `pending: ${payload.pendingAction}` : null,
            payload.bookingResult?.id ? `booking: ${payload.bookingResult.id}` : null
          ]
            .filter(Boolean)
            .join(" | ")
        }
      ]);
      setMessage("");
    } catch (caughtError) {
      const description =
        caughtError instanceof Error ? caughtError.message : "Unknown agent error.";
      setError(description);
    } finally {
      setIsSending(false);
    }
  }

  function clearSession() {
    setConversationId("");
    setMessages([]);
    setToolResults([]);
    setPendingAction(null);
    setLastIntent(null);
    setError("");
    setMessage("");
  }

  return (
    <section className="agent-lab">
      <aside className="agent-sidebar panel">
        <div className="agent-sidebar__block">
          <p className="eyebrow">Temporary Test UI</p>
          <h2>Agent Console</h2>
          <p className="muted">
            This screen is only for internal testing. It talks directly to the Python agent
            `/chat` endpoint.
          </p>
        </div>

        <div className="agent-sidebar__block">
          <label className="agent-field">
            <span>Test phone</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
        </div>

        <div className="agent-sidebar__block">
          <p className="agent-sidebar__label">Quick prompts</p>
          <div className="agent-prompt-list">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                className="agent-prompt-chip"
                type="button"
                onClick={() => setMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="agent-sidebar__block">
          <p className="agent-sidebar__label">Session state</p>
          <dl className="agent-state-list">
            <div>
              <dt>Conversation</dt>
              <dd>{conversationId || "Not started"}</dd>
            </div>
            <div>
              <dt>Intent</dt>
              <dd>{lastIntent || "Unknown"}</dd>
            </div>
            <div>
              <dt>Pending action</dt>
              <dd>{pendingAction || "None"}</dd>
            </div>
          </dl>
        </div>

        <div className="agent-sidebar__block">
          <button className="agent-secondary-button" type="button" onClick={clearSession}>
            Clear Session
          </button>
        </div>
      </aside>

      <div className="agent-main panel">
        <div className="agent-stream" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="agent-empty">
              <p className="eyebrow">Start Here</p>
              <h3>Send a booking request</h3>
              <p className="muted">
                Try a happy-path booking first, then test missing-info, Arabic, alternatives,
                modification, and cancellation.
              </p>
            </div>
          ) : (
            messages.map((entry) => (
              <article
                key={entry.id}
                className={`agent-bubble ${entry.role === "user" ? "user" : "assistant"}`}
              >
                <span className="agent-bubble__role">
                  {entry.role === "user" ? "Tester" : "Agent"}
                </span>
                <p>{entry.content}</p>
                {entry.meta ? <small>{entry.meta}</small> : null}
              </article>
            ))
          )}
        </div>

        <div className="agent-toolbox">
          <div className="agent-toolbox__header">
            <p className="eyebrow">Latest Tool Trace</p>
            <span className="muted">{toolResults.length} tool events</span>
          </div>
          <div className="agent-toolbox__items">
            {toolResults.length === 0 ? (
              <p className="muted">No tool output yet.</p>
            ) : (
              toolResults.map((item, index) => (
                <details key={`${item.tool}-${index}`} className="agent-toolbox__item">
                  <summary>{item.tool}</summary>
                  <pre>{JSON.stringify(item.result, null, 2)}</pre>
                </details>
              ))
            )}
          </div>
        </div>

        <form className="agent-composer" onSubmit={sendMessage}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type a booking request, inquiry, cancellation, or modification..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />
          <div className="agent-composer__footer">
            <div>
              {error ? <p className="agent-error">{error}</p> : null}
              <p className="muted">
                Press <strong>Enter</strong> to send. Use <strong>Shift+Enter</strong> for a new
                line.
              </p>
            </div>
            <button type="submit" disabled={isSending}>
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
