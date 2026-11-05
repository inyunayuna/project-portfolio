import { subscribe } from "./state.js";
import { pickLang, t } from "./i18n.js";
import { escapeAttr, renderText, fetchJSON, splitParagraphs, renderInline } from "./utils.js";
import { alignRowsToGrid } from "./grid-alignment.js";

export async function mountNotes({ dataUrl, containerId }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let items = [];
  try {
    items = await fetchJSON(dataUrl);
    if (!Array.isArray(items)) throw new Error("Notes data must be an array");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="state-msg">${renderText(t("error.load"))}</li>`;
    return;
  }

  const align = alignRowsToGrid(container);
  const render = () => {
    renderNotes(container, items);
    align();
  };
  render();
  subscribe(render, ["lang"]);
}

function renderNotes(container, items) {
  if (!items.length) {
    container.innerHTML = `<li class="state-msg">${renderText(t("empty"))}</li>`;
    return;
  }
  // Append new notes to the JSON; display the newest block first.
  container.innerHTML = [...items].reverse().map(noteHTML).join("");
}

function noteHTML(item) {
  const body = pickLang(item.body) || "";
  const date = item.date || "";

  const paragraphs = splitParagraphs(body)
    .map(p => `<p>${renderInline(p)}</p>`)
    .join("");

  return `
    <li class="note-item">
      <article class="note-body">
        ${date ? `<time class="note-date" datetime="${escapeAttr(date)}">${renderText(date)}</time>` : ""}
        ${paragraphs}
      </article>
    </li>
  `;
}

