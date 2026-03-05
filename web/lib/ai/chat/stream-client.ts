import type { ChatStreamEvent } from "@/lib/ai/chat/protocol";

export async function readChatStream(
  response: Response,
  onEvent: (event: ChatStreamEvent) => void
): Promise<void> {
  if (!response.body) {
    throw new Error("No response stream received");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    try {
      const parsed = JSON.parse(trimmed) as ChatStreamEvent;
      onEvent(parsed);
    } catch {
      // Skip malformed chunk lines to keep stream resilient.
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      processLine(line);
    }
  }

  if (buffer.trim()) {
    processLine(buffer);
  }
}
