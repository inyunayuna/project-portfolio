import { subscribe } from "./state.js";
import { pickLang, t } from "./i18n.js";
import { renderText, escapeAttr, fetchJSON, splitParagraphs, renderInline } from "./utils.js";
import { alignRowsToGrid } from "./grid-alignment.js";
import { mountImageViewer } from "./image-viewer.js";
import { loadProjectContent } from "./project-data.js";
import { imageAttributes } from "./responsive-images.js";
import { mountTextReveal } from "./text-reveal.js";

export async function mountDetail({ dataUrl, containerId }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    container.innerHTML = `<p class="state-msg">${renderText(t("error.no_id"))}</p>`;
    return;
  }

  let item = null;
  try {
    const items = await fetchJSON(dataUrl);
    const entry = items.find(x => x.id === id);
    item = entry ? await loadProjectContent(entry) : null;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="state-msg">${renderText(t("error.load"))}</p>`;
    return;
  }

  if (!item) {
    container.innerHTML = `<p class="state-msg">${renderText(t("error.not_found"))}</p>`;
    return;
  }

  const align = alignRowsToGrid(container);
  const reveal = mountTextReveal(container, align);
  mountImageViewer(container);
  const render = () => {
    renderDetail(container, item);
    document.title = `Yuna — ${pickLang(item.title)}`;
    align();
    reveal();
  };
  render();
  subscribe(render, ["lang"]);
}

function renderDetail(container, item) {
  const title = renderText(pickLang(item.title));
  const categories = (item.categories || []).map(c => t("filters." + c)).join(", ");
  const year = item.year ?? "";

  const blocksHTML = (item.content || [])
    .map((block, index) => blockHTML(block, index === 0))
    .filter(Boolean)
    .join("");

  container.innerHTML = `
    <header class="project-header${categories ? "" : " without-categories"}">
      <h1 class="row-title">${title}</h1>
      ${categories ? `<span class="row-meta">${renderText(categories)}</span>` : ""}
      <span class="row-year">${renderText(year)}</span>
    </header>
    ${blocksHTML ? `<div class="project-content">${blocksHTML}</div>` : ""}
  `;
}

function blockHTML(block, aboveFold) {
  if (!block?.type) return "";
  switch (block.type) {
    case "media": return mediaBlockHTML(block, aboveFold);
    case "text":  return textBlockHTML(block);
    case "embed": return embedBlockHTML(block);
    default:
      console.warn(`[detail-view] Unknown block type: ${block.type}`);
      return "";
  }
}

function embedBlockHTML(block) {
  let url;
  try { url = new URL(block.src); } catch { return ""; }
  if (url.protocol !== "https:" || url.username || url.password) return "";

  const match = String(block.aspectRatio || "").match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  const ratio = match && Number(match[1]) > 0 && Number(match[2]) > 0
    && Number.isFinite(Number(match[1])) && Number.isFinite(Number(match[2]))
    ? `${Number(match[1])} / ${Number(match[2])}` : "16 / 9";

  const width = Number.isFinite(block.maxWidth) && block.maxWidth > 0
    ? Math.min(block.maxWidth, 760) : 760;

  return `<div class="content-embed" style="--embed-ratio: ${ratio}; --embed-max-width: ${width}px">
      <iframe src="${escapeAttr(url.href)}"
              title="${escapeAttr(pickLang(block.title) || t("embed.title"))}"
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen></iframe>
    </div>`;
}

function mediaBlockHTML(block, aboveFold) {
  const items = Array.isArray(block.items)
    ? block.items.filter(item => item?.type === "image" && item.src).slice(0, 3) : [];
  if (!items.length) return "";

  const inner = items.map((m, index) => `<button type="button" class="media-item media-image" aria-label="${escapeAttr(t("image.open"))}">
        <img ${imageAttributes(m.src, items.length)} data-original-src="${escapeAttr(m.src)}"
             alt="${escapeAttr(m.alt || "")}"
             loading="${aboveFold ? "eager" : "lazy"}" ${aboveFold && index === 0 ? 'fetchpriority="high"' : ""} decoding="async">
      </button>`).join("");

  return `<div class="media-row" data-count="${items.length}">${inner}</div>`;
}

function textBlockHTML(block) {
  const raw = pickLang(block.value) || "";
  if (!raw.trim()) return "";

  const paragraphs = splitParagraphs(raw)
    .map(p => `<p>${renderInline(p)}</p>`)
    .join("");

  return `<div class="content-text">${paragraphs}</div>`;
}
