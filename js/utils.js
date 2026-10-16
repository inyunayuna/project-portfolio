export function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const escapeAttr = escapeHTML;

export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export function splitParagraphs(raw) {
  return (raw || "")
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
}

// Parse links before escaping so query-string ampersands remain intact.
export function renderInline(text) {
  const formatText = value => escapeHTML(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
  const links = /\[([^\]]+)\]\(([^)]+)\)/g;
  let html = "";
  let offset = 0;
  for (const match of text.matchAll(links)) {
    html += formatText(text.slice(offset, match.index));
    const [, label, rawUrl] = match;
    const url = rawUrl.trim();
    const safe = /^(https?:\/\/|mailto:|tel:|#|\/(?!\/)|\.{1,2}\/)/i.test(url)
      && !/[\s\\\u0000-\u001f\u007f]/.test(url);
    const attrs = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
    html += safe ? `<a href="${escapeAttr(url)}"${attrs}>${formatText(label)}</a>` : formatText(label);
    offset = match.index + match[0].length;
  }
  return html + formatText(text.slice(offset));
}
