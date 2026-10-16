import { subscribe } from "./state.js";
import { pickLang, t } from "./i18n.js";
import { escapeHTML, fetchJSON, splitParagraphs, renderInline } from "./utils.js";

export async function mountNotes({ dataUrl, containerId }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let items = [];
  try {
    items = await fetchJSON(dataUrl);
    if (!Array.isArray(items)) throw new Error("Notes data must be an array");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="state-msg">${t("error.load")}</li>`;
    return;
  }

  const render = () => renderNotes(container, items);
  render();
  subscribe(render, ["lang"]);
}

function renderNotes(container, items) {
  if (!items.length) {
    container.innerHTML = `<li class="state-msg">${t("empty")}</li>`;
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
        ${date ? `<time class="note-date" datetime="${escapeHTML(date)}">${escapeHTML(date)}</time>` : ""}
        ${paragraphs}
      </article>
    </li>
  `;
}

