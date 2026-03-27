"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Dictionary } from "@/locales";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  dict: Dictionary;
};

export default function ChatPanel({ isOpen, onClose, dict }: Props) {
  const t = dict.chat;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    setError(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errMsg =
          res.status === 503
            ? t.errorUnavailable
            : data?.error ?? t.errorGeneric;
        setError(errMsg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const data = line.replace(/^data: /, "").trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data) as { content?: string };
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: m.content + parsed.content }
                    : m,
                ),
              );
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // user cancelled
      } else {
        setError(t.errorGeneric);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retry = () => {
    setError(null);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: full-screen overlay */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
        <ChatHeader title={t.title} onClose={onClose} />
        <ChatBody
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          dict={dict}
          onRetry={retry}
          messagesEndRef={messagesEndRef}
        />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          onKeyDown={handleKeyDown}
          isStreaming={isStreaming}
          dict={dict}
          inputRef={inputRef}
        />
      </div>

      {/* Desktop: fixed side panel */}
      <div className="hidden md:flex fixed bottom-4 right-4 z-50 w-[400px] h-[600px] max-h-[calc(100vh-2rem)] flex-col rounded-xl shadow-2xl border border-gray-200 bg-white overflow-hidden">
        <ChatHeader title={t.title} onClose={onClose} />
        <ChatBody
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          dict={dict}
          onRetry={retry}
          messagesEndRef={messagesEndRef}
        />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          onKeyDown={handleKeyDown}
          isStreaming={isStreaming}
          dict={dict}
          inputRef={inputRef}
        />
      </div>
    </>
  );
}

function ChatHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-green-900 text-white shrink-0">
      <div className="flex items-center gap-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <button
        onClick={onClose}
        className="text-green-300 hover:text-white transition-colors p-1"
        aria-label="Close chat"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path
            d="M1 1l16 16M17 1L1 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function ChatBody({
  messages,
  isStreaming,
  error,
  dict,
  onRetry,
  messagesEndRef,
}: {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  dict: Dictionary;
  onRetry: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const t = dict.chat;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.length === 0 && !error && (
        <div className="text-center text-gray-500 text-sm mt-8 px-4">
          <svg
            className="mx-auto mb-3 text-green-600"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p>{t.welcome}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          <button
            onClick={onRetry}
            className="mt-1 text-red-600 underline hover:text-red-800 text-xs"
          >
            {t.retry}
          </button>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            {msg.content}
            {msg.role === "assistant" && !msg.content && isStreaming && (
              <span className="inline-flex gap-1 py-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </span>
            )}
          </div>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}

function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  isStreaming,
  dict,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isStreaming: boolean;
  dict: Dictionary;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const t = dict.chat;

  return (
    <div className="border-t border-gray-200 px-3 py-2 shrink-0">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t.inputPlaceholder}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-24"
          disabled={isStreaming}
        />
        <button
          onClick={onSend}
          disabled={isStreaming || !value.trim()}
          className="shrink-0 rounded-lg bg-green-700 px-3 py-2 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isStreaming ? t.sending : t.send}
        </button>
      </div>
    </div>
  );
}
