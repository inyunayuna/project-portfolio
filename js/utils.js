export function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const escapeAttr = escapeHTML;

// Apply Korean tracking to Hangul runs only; keep attributes and Latin text intact.
export function renderText(value) {
  return escapeHTML(value).replace(/\p{Script=Hangul}+/gu, '<span class="hangul">$&</span>');
}

export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
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
  const formatText = value => renderText(value)
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
