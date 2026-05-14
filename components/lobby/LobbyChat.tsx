"use client";

import { useState } from "react";

// TODO (Day 4): Optimistic send + real-time receive via Pusher chat-message event
export interface ChatMessage {
  userId: string;
  name: string;
  image: string;
  message: string;
  sentAt: string;
}

export interface LobbyChatProps {
  lobbyId: string;
  messages: ChatMessage[];
  currentUserId: string;
}

export function LobbyChat({ messages, currentUserId }: LobbyChatProps) {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-64 border rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.userId === currentUserId ? "flex-row-reverse" : ""}`}
          >
            <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
            <div className="text-sm bg-muted px-2 py-1 rounded max-w-[70%]">
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-2 flex gap-2">
        <input
          className="flex-1 text-sm border rounded px-2 py-1"
          placeholder="Say something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="text-sm px-3 py-1 rounded bg-primary text-primary-foreground">
          Send
        </button>
      </div>
    </div>
  );
}
