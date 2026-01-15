"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, User } from "lucide-react";
import clsx from "clsx";
import { useAIChat, type Message } from "@/lib/dashboard/use-ai-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AIDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AIDrawer({ isOpen, onClose }: AIDrawerProps) {
  const { messages, sendMessage, isTyping, suggestedPrompts } = useAIChat();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-brand-900/10 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={clsx(
          "fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border/40 bg-white shadow-2xl transition-transform duration-300 sm:w-[440px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 bg-brand-50/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-brand-900">
                Qeemly AI
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-medium text-brand-600 uppercase tracking-wider">
                  Sidekick Online
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 widget-scroll bg-brand-50/10">
          <div className="flex flex-col gap-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex max-w-[85%] flex-col gap-2",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center gap-2">
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-100 text-brand-500">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-brand-400 uppercase tracking-widest">
                    {msg.role === "assistant" ? "Qeemly AI" : "You"}
                  </span>
                  {msg.role === "user" && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-900 text-white">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <div
                  className={clsx(
                    "rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "bg-brand-900 text-white"
                      : "bg-white border border-border/40 text-brand-900"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-2 mr-auto">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-100 text-brand-500">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <div className="bg-white border border-border/40 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-300 [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-300 [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-300"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input & Suggestions */}
        <div className="border-t border-border/40 bg-white px-6 py-6">
          {/* Suggested Prompts */}
          {messages.length < 3 && !isTyping && (
            <div className="mb-6 flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => sendMessage(prompt.query)}
                  className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2 text-left text-[13px] font-medium text-brand-700 transition-all hover:border-brand-300 hover:bg-white hover:text-brand-900 hover:shadow-sm"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about GCC market trends..."
              className="h-12 w-full rounded-xl border-border/60 pr-12 focus:ring-brand-500/20"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              size="icon"
              className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-3 text-center text-[10px] text-brand-400 font-medium uppercase tracking-wider">
            AI can make mistakes. Verify important data.
          </p>
        </div>
      </aside>
    </>
  );
}

