import { describe, expect, it } from "vitest";
import { readChatStream } from "@/lib/ai/chat/stream-client";
import type { ChatStreamEvent } from "@/lib/ai/chat/protocol";

function buildStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
    },
  });
}

describe("readChatStream", () => {
  it("parses ndjson events split across chunks", async () => {
    const response = buildStreamResponse([
      '{"type":"start","mode":"general"}\n{"type":"delta","text":"Hel',
      'lo"}\n{"type":"delta","text":" world"}\n{"type":"final","mode":"general","answer":"Hello world"}\n',
    ]);

    const events: ChatStreamEvent[] = [];
    await readChatStream(response, (event) => {
      events.push(event);
    });

    expect(events.map((event) => event.type)).toEqual(["start", "delta", "delta", "final"]);
    const finalEvent = events[3];
    expect(finalEvent.type).toBe("final");
    if (finalEvent.type === "final") {
      expect(finalEvent.answer).toBe("Hello world");
    }
  });
});
