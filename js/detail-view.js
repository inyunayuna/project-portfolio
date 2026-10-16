import { subscribe } from "./state.js";
import { pickLang, t } from "./i18n.js";
import { escapeHTML, escapeAttr, fetchJSON, splitParagraphs, renderInline } from "./utils.js";
import { alignRowsToGrid } from "./grid-alignment.js";

export async function mountDetail({ dataUrl, containerId }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    container.innerHTML = `<p class="state-msg">${t("error.no_id")}</p>`;
    return;
  }

  let item = null;
  try {
    const items = await fetchJSON(dataUrl);
    item = items.find(x => x.id === id);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="state-msg">${t("error.load")}</p>`;
    return;
  }

  if (!item) {
    container.innerHTML = `<p class="state-msg">${t("error.not_found")}</p>`;
    return;
  }

  const align = alignRowsToGrid(container);
  const render = () => {
    renderDetail(container, item);
    document.title = `Yuna — ${pickLang(item.title)}`;
    align();
  };
  render();
  subscribe(render, ["lang"]);
}

function renderDetail(container, item) {
  const title = escapeHTML(pickLang(item.title));
  const categories = (item.categories || []).map(c => t("filters." + c)).join(", ");
  const year = item.year ?? "";

  const blocksHTML = (item.content || [])
    .map(blockHTML)
    .filter(Boolean)
    .join("");

  container.innerHTML = `
    <header class="project-header">
      <h1 class="row-title">${title}</h1>
      <span class="row-meta">${escapeHTML(categories)}</span>
      <span class="row-year">${escapeHTML(String(year))}</span>
    </header>
    ${blocksHTML ? `<div class="project-content">${blocksHTML}</div>` : ""}
  `;
}

function blockHTML(block) {
  if (!block?.type) return "";
  switch (block.type) {
    case "media": return mediaBlockHTML(block);
    case "text":  return textBlockHTML(block);
    default:
      console.warn(`[detail-view] Unknown block type: ${block.type}`);
      return "";
  }
}

function mediaBlockHTML(block) {
  const items = Array.isArray(block.items) ? block.items.slice(0, 3) : [];
  if (!items.length) return "";

  const inner = items.map(m => {
    if (m.type === "video") {
      return `<div class="media-item">
          <video src="${escapeAttr(m.src)}"
                 ${m.poster ? `poster="${escapeAttr(m.poster)}"` : ""}
                 muted loop playsinline preload="none"
                 ${m.autoplay ? "autoplay" : "controls"}></video>
        </div>`;
    }
    return `<div class="media-item">
        <img src="${escapeAttr(m.src)}"
             alt="${escapeAttr(m.alt || "")}"
             loading="lazy" decoding="async">
      </div>`;
  }).join("");

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
