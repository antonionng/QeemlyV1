export function encodeChatEvent(event: unknown): string {
  return `${JSON.stringify(event)}\n`;
}

export function extractOutputTextDelta(event: unknown): string | null {
  if (!event || typeof event !== "object") {
    return null;
  }

  const maybeEvent = event as { type?: string; delta?: string };

  if (maybeEvent.type === "response.output_text.delta") {
    const deltaValue = (event as { delta?: unknown }).delta;
    return typeof deltaValue === "string" && deltaValue.length > 0 ? deltaValue : null;
  }

  return null;
}
