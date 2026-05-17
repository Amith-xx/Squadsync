"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useLobbyStore } from "@/store/lobbyStore";
import { useUserStore } from "@/store/userStore";

interface Props {
  lobbyId: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ name, image }: { name: string; image: string }) {
  const initials = name
    .trim()
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-navy-border bg-navy-surface">
      {image ? (
        <Image src={image} alt={name} width={28} height={28} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-neon-green">
          {initials}
        </div>
      )}
    </div>
  );
}

export function LobbyChat({ lobbyId }: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useLobbyStore((s) => s.chatMessages);
  const addChatMessage = useLobbyStore((s) => s.addChatMessage);
  const userId = useUserStore((s) => s.id);
  const userName = useUserStore((s) => s.name);
  const userImage = useUserStore((s) => s.image);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !userId) return;

    // Optimistic add — messageId prefixed so Pusher's real event (different id) also shows
    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    addChatMessage({
      messageId: optimisticId,
      userId,
      name: userName ?? "You",
      image: userImage ?? "",
      message: trimmed,
      sentAt: new Date().toISOString(),
    });

    setInput("");
    setSending(true);

    try {
      await fetch(`/api/lobbies/${lobbyId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
    } catch { /* Best effort */ }

    setSending(false);
    inputRef.current?.focus();
  }, [input, sending, userId, userName, userImage, lobbyId, addChatMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="rounded-2xl border border-navy-border bg-navy-dark overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-navy-surface"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">
            Lobby Chat
          </span>
          {messages.length > 0 && (
            <span className="rounded-full bg-neon-green/20 px-1.5 py-0.5 text-[10px] font-bold text-neon-green">
              {messages.length}
            </span>
          )}
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Message list */}
          <div className="h-60 overflow-y-auto px-4 py-2 space-y-3 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-muted-foreground/60">
                  No messages yet — say something!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.userId === userId;
                return (
                  <div
                    key={msg.messageId}
                    className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {!isOwn && <Avatar name={msg.name} image={msg.image} />}
                    <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                      {!isOwn && (
                        <span className="text-[10px] font-semibold text-muted-foreground px-1">
                          {msg.name}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm leading-snug break-words ${
                          isOwn
                            ? "rounded-br-sm bg-neon-green text-navy-darkest font-medium"
                            : "rounded-bl-sm bg-navy-surface text-white"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="px-1 text-[9px] text-muted-foreground/50">
                        {formatTime(msg.sentAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="border-t border-navy-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                placeholder="Say something…"
                className="flex-1 rounded-xl border border-navy-border bg-navy-surface px-3 py-2 text-sm text-white placeholder-muted-foreground/50 outline-none transition-colors focus:border-neon-green/40"
              />
              <button
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neon-green text-navy-darkest transition-all hover:bg-neon-green/90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
