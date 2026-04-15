/**
 * Decode common HTML entities to their character equivalents.
 * Must run BEFORE tag stripping so entity-encoded tags
 * (e.g. &lt;div&gt;) are resolved into real tags first.
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/**
 * Strip all HTML tags and return clean plain text.
 *
 * Order matters:
 *  1. Decode entities first — converts &lt;div&gt; into real <div> so the
 *     tag stripper can remove them.
 *  2. Remove script/style blocks (including their content).
 *  3. Convert semantic tags to whitespace / bullet markers.
 *  4. Character-by-character tag removal — handles multiline attributes,
 *     nested quotes, and any other edge cases regex can't.
 */
export function stripHtml(html: string): string {
  // 1. Decode entities so entity-encoded tags become real tags
  let s = decodeEntities(html);

  // 2. Remove entire blocks whose inner content is irrelevant
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // 3. Convert semantic tags to text equivalents before stripping
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n\n");
  s = s.replace(/<\/h[1-6]>/gi, "\n\n");
  s = s.replace(/<h[1-6][^>]*>/gi, "\n");
  s = s.replace(/<\/li>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "• ");
  s = s.replace(/<hr\s*\/?>/gi, "\n");

  // 4. Character-by-character removal of every remaining tag
  let out = "";
  let inside = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "<") {
      inside = true;
    } else if (ch === ">") {
      inside = false;
    } else if (!inside) {
      out += ch;
    }
  }

  // 5. Clean up whitespace
  return out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
