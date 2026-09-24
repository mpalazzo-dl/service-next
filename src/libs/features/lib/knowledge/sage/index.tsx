"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import NextLink from "next/link";

import type { SageArticle } from "@/app/api/sage/route";
import { SageOpenOnLoad } from "../../../config";

/**
 * Sage — a support assistant in the Agentforce idiom.
 *
 * She retrieves; she does not generate. Every article she shows is a real
 * published entry, and the words around them come from a fixed set of
 * openers — so she can be demoed safely without the risk of a language model
 * inventing an answer or a URL.
 *
 * Colours are Salesforce's own blue ramp rather than the site theme, because
 * the point of the component is to look like the agent a Service Cloud
 * customer already recognises sitting on top of their help centre.
 */

const SF_BLUE = "#0176D3";
const SF_BLUE_DARK = "#032D60";
const SF_BLUE_TINT = "#EAF5FE";

interface Message {
  id: number;
  from: "sage" | "user";
  text: string;
  articles?: SageArticle[];
}

const SUGGESTIONS = [
  "How do I connect Salesforce?",
  "What spends a credit?",
  "How is intent scored?",
];

const GREETING =
  "Hi, I'm Sage. I can look things up in the ZoomInfo Knowledge Center — " +
  "ask me a question and I'll point you at the right article.";

const SparkleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 2.5l1.9 5.3 5.3 1.9-5.3 1.9L12 16.9l-1.9-5.3L4.8 9.7l5.3-1.9L12 2.5z"
      fill="currentColor"
    />
    <path
      d="M18.5 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z"
      fill="currentColor"
      opacity="0.75"
    />
  </svg>
);

export const Sage = () => {
  const [open, setOpen] = useState(SageOpenOnLoad);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "sage", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  // Focus only when the user opens the panel. Focusing on first paint would
  // steal focus from the page and jump the viewport for keyboard and screen
  // reader users, which is not a reasonable thing to do on load.
  const openedByUser = useRef(false);

  useEffect(() => {
    if (open && openedByUser.current) inputRef.current?.focus();
  }, [open]);

  const toggle = () => {
    openedByUser.current = true;
    setOpen((value) => !value);
  };

  // Escape closes the panel, as it would in any dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || thinking) return;

    setMessages((current) => [
      ...current,
      { id: nextId.current++, from: "user", text },
    ]);
    setInput("");
    setThinking(true);

    try {
      const response = await fetch("/api/sage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error(String(response.status));

      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          from: "sage",
          text: data.reply,
          articles: data.articles,
        },
      ]);
    } catch (error) {
      console.error("Sage request failed:", error);
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          from: "sage",
          text: "Something went wrong on my side. Try again in a moment.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Close Sage" : "Ask Sage"}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 52,
          padding: open ? 0 : "0 20px",
          width: open ? 52 : "auto",
          justifyContent: "center",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          color: "#fff",
          background: `linear-gradient(135deg, ${SF_BLUE} 0%, #0B5CAB 100%)`,
          boxShadow: "0 6px 20px rgba(3, 45, 96, 0.28)",
          font: "inherit",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <>
            <SparkleIcon />
            Ask Sage
          </>
        )}
      </button>

      {/* Panel */}
      {open && (
        <section
          role="dialog"
          aria-label="Sage, the knowledge assistant"
          style={{
            position: "fixed",
            right: 24,
            bottom: 88,
            zIndex: 1200,
            width: "min(384px, calc(100vw - 48px))",
            height: "min(560px, calc(100vh - 140px))",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #D8DCDE",
            boxShadow: "0 18px 48px rgba(3, 45, 96, 0.22)",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              color: "#fff",
              background: `linear-gradient(135deg, ${SF_BLUE_DARK} 0%, ${SF_BLUE} 100%)`,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
              }}
            >
              <SparkleIcon size={18} />
            </span>
            <span style={{ lineHeight: 1.25 }}>
              <strong style={{ display: "block", fontSize: 15 }}>Sage</strong>
              <span style={{ fontSize: 12, opacity: 0.85 }}>
                AI Agent · ZoomInfo Knowledge Center
              </span>
            </span>
          </header>

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              background: "#F8F9F9",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  alignSelf: message.from === "user" ? "flex-end" : "flex-start",
                  maxWidth: "92%",
                }}
              >
                <div
                  style={{
                    padding: "10px 13px",
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: message.from === "user" ? "#fff" : "#2F3941",
                    background: message.from === "user" ? SF_BLUE : "#fff",
                    border:
                      message.from === "user" ? "none" : "1px solid #E9EBED",
                    borderBottomRightRadius: message.from === "user" ? 4 : 12,
                    borderBottomLeftRadius: message.from === "user" ? 12 : 4,
                  }}
                >
                  {message.text}
                </div>

                {message.articles?.map((article) => (
                  <NextLink
                    key={article.path}
                    href={article.path}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block",
                      marginTop: 8,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#fff",
                      border: `1px solid ${SF_BLUE_TINT}`,
                      borderLeft: `3px solid ${SF_BLUE}`,
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: SF_BLUE_DARK,
                        lineHeight: 1.4,
                      }}
                    >
                      {article.title}
                    </span>
                    {article.summary && (
                      <span
                        style={{
                          display: "block",
                          marginTop: 3,
                          fontSize: 12.5,
                          color: "#68737D",
                          lineHeight: 1.45,
                        }}
                      >
                        {article.summary.length > 110
                          ? `${article.summary.slice(0, 110)}…`
                          : article.summary}
                      </span>
                    )}
                  </NextLink>
                ))}
              </div>
            ))}

            {thinking && (
              <div
                aria-live="polite"
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 13px",
                  borderRadius: 12,
                  borderBottomLeftRadius: 4,
                  background: "#fff",
                  border: "1px solid #E9EBED",
                  fontSize: 14,
                  color: "#68737D",
                }}
              >
                Searching the knowledge base…
              </div>
            )}

            {messages.length === 1 && !thinking && (
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}
              >
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => ask(suggestion)}
                    style={{
                      font: "inherit",
                      fontSize: 12.5,
                      padding: "6px 11px",
                      borderRadius: 999,
                      cursor: "pointer",
                      color: SF_BLUE_DARK,
                      background: "#fff",
                      border: `1px solid ${SF_BLUE}`,
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderTop: "1px solid #E9EBED",
              background: "#fff",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question…"
              aria-label="Ask Sage a question"
              style={{
                flex: 1,
                height: 40,
                padding: "0 12px",
                borderRadius: 8,
                border: "1px solid #C2C8CC",
                outline: "none",
                font: "inherit",
                fontSize: 14,
                color: "#2F3941",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 8,
                border: "none",
                cursor: input.trim() && !thinking ? "pointer" : "default",
                background: input.trim() && !thinking ? SF_BLUE : "#E9EBED",
                color: input.trim() && !thinking ? "#fff" : "#87929D",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 20l18-8L3 4l4 8-4 8z" fill="currentColor" />
              </svg>
            </button>
          </form>

          <p
            style={{
              margin: 0,
              padding: "0 12px 10px",
              background: "#fff",
              fontSize: 11,
              color: "#87929D",
              textAlign: "center",
            }}
          >
            Sage searches published articles. She does not generate answers.
          </p>
        </section>
      )}
    </>
  );
};
