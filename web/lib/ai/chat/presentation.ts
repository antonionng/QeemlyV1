export type MessageBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "unordered-list"; items: string[] }
  | { kind: "ordered-list"; items: string[] };

export function normalizeAssistantText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/(\S)\s(?=\d+\.\s)/g, "$1\n")
    .replace(/(\S)\s(?=-\s)/g, "$1\n")
    .trim();
}

export function parseAssistantMessageBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const paragraphBuffer: string[] = [];
  let unorderedBuffer: string[] = [];
  let orderedBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    blocks.push({ kind: "paragraph", text: paragraphBuffer.join(" ").trim() });
    paragraphBuffer.length = 0;
  };

  const flushUnordered = () => {
    if (unorderedBuffer.length === 0) return;
    blocks.push({ kind: "unordered-list", items: unorderedBuffer });
    unorderedBuffer = [];
  };

  const flushOrdered = () => {
    if (orderedBuffer.length === 0) return;
    blocks.push({ kind: "ordered-list", items: orderedBuffer });
    orderedBuffer = [];
  };

  const lines = normalizeAssistantText(text).split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushUnordered();
      flushOrdered();
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushOrdered();
      unorderedBuffer.push(unorderedMatch[1].trim());
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushUnordered();
      orderedBuffer.push(orderedMatch[1].trim());
      continue;
    }

    flushUnordered();
    flushOrdered();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushUnordered();
  flushOrdered();

  return blocks.length > 0 ? blocks : [{ kind: "paragraph", text }];
}
