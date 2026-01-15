"use client";

import { useState, useCallback, useEffect } from "react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const MOCK_RESPONSES: Record<string, string> = {
  default: "I'm Qeemly AI, your compensation sidekick. I can help you analyze market trends, compare salary bands across the GCC, or optimize your hiring budget. What would you like to explore today?",
  trends: "Looking at the latest data for Dubai and Riyadh, we're seeing a 12% year-on-year increase in Tech roles. Engineering Managers at P75 are now averaging AED 55,000 per month.",
  underpaid: "Based on your current team data and the Market Pulse widget, your Senior Software Engineers are roughly 8% below the current Dubai median. I recommend adjusting the band by 5-10% to remain competitive.",
  compare: "In Riyadh, the cost of living adjustment for Senior roles is roughly 15% lower than Dubai, but the 'gross' salary offers in Riyadh are currently 5-10% higher for niche AI and FinTech roles.",
  budget: "To optimize your recruitment budget for Q1, I suggest focusing on mid-level hires where the supply is currently higher. For senior roles, consider a 'remote-first' GCC strategy to save up to 20% on base compensation.",
};

const SUGGESTED_PROMPTS = [
  { id: "trends", label: "Market trends summary", query: "Can you summarize current market trends?" },
  { id: "underpaid", label: "Retention risk analysis", query: "Is my team at risk of being underpaid?" },
  { id: "compare", label: "Dubai vs Riyadh comparison", query: "Compare senior dev salaries in Dubai and Riyadh." },
  { id: "budget", label: "Hiring budget tips", query: "How can I optimize my hiring budget?" },
];

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: MOCK_RESPONSES.default,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Simulate AI thinking
    setIsTyping(true);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Find a mock response
    let responseText = MOCK_RESPONSES.default;
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes("trend")) responseText = MOCK_RESPONSES.trends;
    else if (lowerContent.includes("underpaid") || lowerContent.includes("retention")) responseText = MOCK_RESPONSES.underpaid;
    else if (lowerContent.includes("dubai") || lowerContent.includes("riyadh") || lowerContent.includes("compare")) responseText = MOCK_RESPONSES.compare;
    else if (lowerContent.includes("budget") || lowerContent.includes("optimize")) responseText = MOCK_RESPONSES.budget;

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseText,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  }, []);

  return {
    messages,
    sendMessage,
    isTyping,
    suggestedPrompts: SUGGESTED_PROMPTS,
  };
}

