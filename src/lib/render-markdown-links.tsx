import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Parse a string that may contain inline `[text](url)` markdown links and
 * return an array of React nodes — plain strings for text segments and
 * Next.js <Link> elements for the links.
 *
 * Only supports the most common case: `[label](url)`. URLs that start with
 * "/" are treated as internal (rendered as <Link>). Others are skipped for
 * safety (don't auto-link arbitrary external URLs from LLM output).
 *
 * This is deliberately tiny — no full markdown parser; we only need this
 * one feature for AI chat bubbles.
 */
const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

export function renderMarkdownLinks(
  text: string,
  linkClassName = "underline font-medium hover:opacity-80 transition-opacity",
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  // Reset regex state — important since LINK_PATTERN is a module-level const with `g`
  LINK_PATTERN.lastIndex = 0;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    const [whole, label, url] = match;
    const start = match.index;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    if (url.startsWith("/")) {
      nodes.push(
        <Link key={`l${key++}`} href={url} className={linkClassName}>
          {label}
        </Link>
      );
    } else {
      // External / unknown — render the label as plain text (no auto-link)
      nodes.push(label);
    }
    lastIndex = start + whole.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
