"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, MessageSquare, Plus, Send, Sparkles, Trash2, User, X } from "lucide-react";
import clsx from "clsx";
import { useAIChat } from "@/lib/dashboard/use-ai-chat";
import type { ChatMode } from "@/lib/ai/chat/protocol";
import { parseAssistantMessageBlocks } from "@/lib/ai/chat/presentation";
import type { EmployeeContextSnapshot } from "@/lib/ai/chat/threads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export type AIDrawerInitialRequest = {
  requestId: string;
  mode: ChatMode;
  employeeId?: string;
  employee?: EmployeeContextSnapshot;
  message: string;
};

type AIDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  initialRequest?: AIDrawerInitialRequest | null;
  onInitialRequestHandled?: () => void;
};

function renderInlineMarkdown(text: string) {
  const nodes: Array<string | JSX.Element> = [];
  const boldPattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = boldPattern.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <strong key={`strong-${match.index}`} className="font-semibold text-brand-900">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
    match = boldPattern.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  if (nodes.length === 0) {
    return text;
  }

  return nodes.map((node, index) =>
    typeof node === "string" ? <Fragment key={`text-${index}`}>{node}</Fragment> : node
  );
}

function AssistantMessageBody({ text }: { text: string }) {
  const blocks = useMemo(() => parseAssistantMessageBlocks(text), [text]);

  return (
    <div className="space-y-2">
      {blocks.map((block, idx) => {
        if (block.kind === "paragraph") {
          return (
            <p key={`p-${idx}`} className="whitespace-pre-wrap break-words">
              {renderInlineMarkdown(block.text)}
            </p>
          );
        }

        if (block.kind === "unordered-list") {
          return (
            <ul key={`ul-${idx}`} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIdx) => (
                <li key={`ul-item-${idx}-${itemIdx}`} className="break-words">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <ol key={`ol-${idx}`} className="list-decimal space-y-1 pl-5">
            {block.items.map((item, itemIdx) => (
              <li key={`ol-item-${idx}-${itemIdx}`} className="break-words">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}

function QeemlyAIAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const wrapper = size === "sm" ? "h-6 w-6 rounded-lg" : "h-10 w-10 rounded-xl";
  const mark = size === "sm" ? "text-[9px]" : "text-sm";

  return (
    <div
      className={clsx(
        "flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-500/20",
        wrapper,
      )}
      aria-label="Qeemly AI avatar"
    >
      <div className="flex h-[88%] w-[88%] items-center justify-center rounded-md bg-white text-brand-600">
        <span className={clsx("font-bold tracking-tight", mark)}>Q</span>
      </div>
    </div>
  );
}

function formatThreadGroup(dateValue: string): "Today" | "Previous 7 days" | "Older" {
  const now = new Date();
  const date = new Date(dateValue);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays <= 7) return "Previous 7 days";
  return "Older";
}

type UserProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
};

export function AIDrawer({
  isOpen,
  onClose,
  initialRequest,
  onInitialRequestHandled,
}: AIDrawerProps) {
  const {
    threads,
    activeThread,
    activeThreadId,
    messages,
    sendMessage,
    startNewChat,
    openThread,
    deleteThread,
    isLoadingThreads,
    isLoadingMessages,
    isTyping,
    suggestedPrompts,
  } = useAIChat();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastHandledRequestIdRef = useRef<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("full_name,avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setUserProfile(data));
    });
  }, []);

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

  useEffect(() => {
    if (!isOpen || !initialRequest) return;
    if (lastHandledRequestIdRef.current === initialRequest.requestId) return;

    lastHandledRequestIdRef.current = initialRequest.requestId;
    sendMessage(initialRequest.message, {
      mode: initialRequest.mode,
      employeeId: initialRequest.employeeId,
      employee: initialRequest.employee,
    });
    onInitialRequestHandled?.();
  }, [isOpen, initialRequest, onInitialRequestHandled, sendMessage]);

  const groupedThreads = useMemo(() => {
    const groups: Record<"Today" | "Previous 7 days" | "Older", typeof threads> = {
      Today: [],
      "Previous 7 days": [],
      Older: [],
    };
    for (const thread of threads) {
      groups[formatThreadGroup(thread.last_message_at)].push(thread);
    }
    return groups;
  }, [threads]);

  const visibleMessages = useMemo(
    () =>
      messages.filter((msg) => {
        if (msg.role !== "assistant") return true;
        const hasContent = msg.content.trim().length > 0;
        const hasStructured =
          typeof msg.confidence === "number" ||
          (msg.reasons && msg.reasons.length > 0) ||
          (msg.missingData && msg.missingData.length > 0);
        return hasContent || hasStructured;
      }),
    [messages]
  );

  const handleNewChat = () => {
    void startNewChat();
    setInputValue("");
  };

  const handleDeleteThread = async (threadId: string) => {
    setDeletingThreadId(threadId);
    try {
      await deleteThread(threadId);
    } finally {
      setDeletingThreadId(null);
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
          "fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border/40 bg-white shadow-2xl transition-transform duration-300 sm:w-[920px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 bg-brand-50/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <QeemlyAIAvatar />
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

        <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[280px_minmax(0,1fr)]">
          <section className="border-b border-border/40 bg-accent-50/40 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-accent-500">Chats</h3>
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-50"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            </div>
            <div className="widget-scroll max-h-full overflow-y-auto px-2 pb-3">
              {isLoadingThreads ? (
                <p className="px-2 py-3 text-xs text-accent-500">Loading chats...</p>
              ) : threads.length === 0 ? (
                <p className="px-2 py-3 text-xs text-accent-500">No chats yet. Start a new conversation.</p>
              ) : (
                (Object.entries(groupedThreads) as Array<[keyof typeof groupedThreads, typeof threads]>).map(
                  ([groupName, groupThreads]) =>
                    groupThreads.length > 0 ? (
                      <div key={groupName} className="mb-3">
                        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-accent-400">
                          {groupName}
                        </p>
                        <div className="space-y-1">
                          {groupThreads.map((thread) => (
                            <button
                              key={thread.id}
                              type="button"
                              onClick={() => void openThread(thread.id)}
                              className={clsx(
                                "group flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                                thread.id === activeThreadId
                                  ? "bg-brand-50 ring-1 ring-brand-200"
                                  : "hover:bg-white"
                              )}
                            >
                              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-400" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-accent-800">{thread.title}</p>
                                <p className="mt-0.5 truncate text-[11px] text-accent-500">
                                  {thread.mode === "employee" && thread.employee_name
                                    ? thread.employee_name
                                    : "General"}
                                </p>
                              </div>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  void handleDeleteThread(thread.id);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key !== "Enter" && event.key !== " ") return;
                                  event.preventDefault();
                                  event.stopPropagation();
                                  void handleDeleteThread(thread.id);
                                }}
                                className="mt-0.5 rounded-md p-1 text-accent-400 opacity-0 transition-opacity hover:bg-accent-100 hover:text-red-600 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null
                )
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto bg-brand-50/10 px-6 py-5 widget-scroll">
              {activeThread?.mode === "employee" && (
                <div className="mb-4 rounded-xl border border-brand-100 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">
                    Employee Context
                  </p>
                  <p className="mt-1 text-sm font-semibold text-accent-900">
                    {activeThread.employee_name || "Selected employee"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeThread.employee_role && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[11px] text-accent-600">
                        <Briefcase className="h-3 w-3" />
                        {activeThread.employee_role}
                      </span>
                    )}
                    {activeThread.employee_department && (
                      <span className="inline-flex items-center rounded-full bg-accent-100 px-2 py-0.5 text-[11px] text-accent-600">
                        {activeThread.employee_department}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isLoadingMessages ? (
                <p className="text-sm text-accent-500">Loading messages...</p>
              ) : visibleMessages.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-white p-4 text-sm text-accent-700">
                  Ask about market trends, retention risk, compensation fairness, or role-level benchmarking.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {visibleMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={clsx(
                        "flex max-w-[85%] flex-col gap-2",
                        msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {msg.role === "assistant" && <QeemlyAIAvatar size="sm" />}
                        <span className="text-[11px] font-bold text-brand-400 uppercase tracking-widest">
                          {msg.role === "assistant" ? "Qeemly AI" : "You"}
                        </span>
                        {msg.role === "user" && (
                          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-brand-900 text-white">
                            {userProfile?.avatar_url ? (
                              <img
                                src={userProfile.avatar_url}
                                alt={userProfile.full_name ?? "You"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-semibold">
                                {userProfile?.full_name?.charAt(0).toUpperCase() ?? <User className="h-3.5 w-3.5" />}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        className={clsx(
                          "rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm",
                          msg.role === "user"
                            ? "bg-brand-900 text-white"
                            : "border border-border/40 bg-white text-brand-900"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <AssistantMessageBody text={msg.content} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                        {msg.role === "assistant" && (
                          <div className="mt-2 space-y-1.5 text-xs text-accent-600">
                            {typeof msg.confidence === "number" && (
                              <p>
                                <span className="font-semibold text-accent-700">Confidence:</span>{" "}
                                {msg.confidence}%
                              </p>
                            )}
                            {msg.reasons && msg.reasons.length > 0 && (
                              <p>
                                <span className="font-semibold text-accent-700">Reasons:</span>{" "}
                                {msg.reasons.join(" · ")}
                              </p>
                            )}
                            {msg.missingData && msg.missingData.length > 0 && (
                              <p>
                                <span className="font-semibold text-accent-700">Missing data:</span>{" "}
                                {msg.missingData.join(", ")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="mr-auto flex items-start gap-2">
                      <div className="animate-pulse">
                        <QeemlyAIAvatar size="sm" />
                      </div>
                      <div className="rounded-2xl border border-border/40 bg-white px-4 py-3 shadow-sm">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-300 [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-300 [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-300" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-border/40 bg-white px-6 py-5">
              {visibleMessages.length === 0 && !isTyping && (
                <div className="mb-3 flex flex-wrap gap-2">
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

              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for a compensation insight..."
                  className="h-11 flex-1 rounded-xl border-border/60 focus:ring-brand-500/20"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping || deletingThreadId !== null}
                  size="sm"
                  className="h-11 rounded-xl px-3 shadow-sm"
                  aria-label="Send message"
                  title="Send"
                >
                  <Send className="mr-1 h-4 w-4" />
                  Send
                </Button>
              </div>
              <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-wider text-brand-400">
                AI can make mistakes. Verify important data.
              </p>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

