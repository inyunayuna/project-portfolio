import { getState, subscribe } from "./state.js";
import { pickLang, t } from "./i18n.js";
import { escapeHTML, escapeAttr, fetchJSON } from "./utils.js";
import { alignRowsToGrid } from "./grid-alignment.js";
import { mountProjectPreview } from "./project-preview.js";

export async function mountList({ dataUrl, containerId, detailHref, useFilter = true }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 이벤트 위임 — 렌더가 반복돼도 리스너는 한 번만 붙음
  container.addEventListener("click", e => {
    const row = e.target.closest(".list-row");
    if (!row || e.target.closest("a")) return;
    window.location.href = detailHref(row.dataset.id);
  });

  let items = [];
  try {
    items = await fetchJSON(dataUrl);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="state-msg">${t("error.load")}</li>`;
    return;
  }

  const align = alignRowsToGrid(container);
  const hidePreview = useFilter ? mountProjectPreview(container, items) : () => {};
  const render = () => {
    hidePreview();
    renderList(container, items, detailHref, useFilter);
    align();
  };
  render();
  subscribe(render, useFilter ? ["lang", "filter"] : ["lang"]);
}

function renderList(container, items, detailHref, useFilter) {
  const { filter } = getState();

  const filtered = items.filter(item => {
    if (!useFilter || filter === "all") return true;
    return Array.isArray(item.categories) && item.categories.includes(filter);
  });

  if (!filtered.length) {
    container.innerHTML = `<li class="state-msg">${t("empty")}</li>`;
    return;
  }

  container.innerHTML = filtered.map(item => rowHTML(item, detailHref)).join("");
}

function rowHTML(item, detailHref) {
  const title = escapeHTML(pickLang(item.title));
  const categories = (item.categories || []).map(c => t("filters." + c)).join(", ");
  const year = item.year ?? "";

  return `
    <li class="list-row" data-id="${escapeAttr(item.id)}">
      <a class="row-title" href="${escapeAttr(detailHref(item.id))}">${title}</a>
      <span class="row-meta">${escapeHTML(categories)}</span>
      <span class="row-year">${escapeHTML(String(year))}</span>
    </li>
  `;
}
