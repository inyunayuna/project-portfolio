import { FILTERS, LANGUAGES, getState, setState, subscribe } from "./state.js";
import { t } from "./i18n.js";
import { renderText } from "./utils.js";

function currentPage() {
  return document.body.dataset.page || "projects";
}

function pageToTab() {
  const p = currentPage();
  if (p !== "project-detail") return p;
  return new URLSearchParams(location.search).get("src") === "writings"
    ? "writings"
    : "projects";
}

export function mountHeader() {
  const render = () => {
    updateLanguage();
    renderHeader();
    renderSubHeader();
  };
  render();
  subscribe(render, ["lang"]);

  subscribe(() => {
    const { filter } = getState();
    document.querySelectorAll(".filter-btn").forEach(btn => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }, ["filter"]);
}

function updateLanguage() {
  const { lang } = getState();
  document.body.dataset.lang = lang;
  document.documentElement.lang = lang;
  const page = currentPage();
  const tab = pageToTab();
  if (page !== "project-detail" && page !== "404") {
    document.title = `Yuna — ${t(tab === "cv" ? "cv" : "nav." + tab)}`;
  }
}

function renderHeader() {
  const el = document.querySelector('[data-component="header"]');
  if (!el) return;

  const activeTab = pageToTab();
  const { lang } = getState();

  el.innerHTML = `
    <div class="nav-left">
      <a class="nav-link ${activeTab === "notes"     ? "is-active" : ""}" href="notes.html">${renderText(t("nav.notes"))}</a>
      <a class="nav-link ${activeTab === "projects"  ? "is-active" : ""}" href="index.html">${renderText(t("nav.projects"))}</a>
      <a class="nav-link ${activeTab === "writings"  ? "is-active" : ""}" href="writings.html">${renderText(t("nav.writings"))}</a>
    </div>

    <div class="nav-center lang-switch" role="group" aria-label="Language">
      ${LANGUAGES.map((lc, i) => `
        ${i > 0 ? '<span class="sep">/</span>' : ""}
        <button type="button"
                class="lang-btn ${lc === lang ? "is-active" : ""}"
                data-lang="${lc}"
                aria-pressed="${lc === lang}"
                aria-label="${lc.toUpperCase()}">
          ${lc[0].toUpperCase() + lc.slice(1)}
        </button>
      `).join("")}
    </div>

    <div class="nav-right">${renderText(t("brand"))}</div>
  `;

  el.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => setState({ lang: btn.dataset.lang }));
  });
}

function renderSubHeader() {
  const el = document.querySelector('[data-component="sub-header"]');
  if (!el) return;

  if (pageToTab() !== "projects") {
    el.innerHTML = `<span class="nav-brand">${renderText(t("brand"))}</span>`;
    return;
  }

  const { filter } = getState();
  const goToList = "index.html";

  el.innerHTML = `
    <div class="filter-list" role="group" aria-label="Filter">
      ${FILTERS.map(f => `
        <button type="button"
                class="filter-btn ${f === filter ? "is-active" : ""}"
                data-filter="${f}"
                aria-pressed="${f === filter}">
          ${renderText(t("filters." + f))}
        </button>
      `).join("")}
    </div>
    <span class="nav-brand">${renderText(t("brand"))}</span>
    <a class="cv-link" href="cv.html">${renderText(t("cv"))}</a>
  `;

  el.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setState({ filter: btn.dataset.filter });
      if (currentPage() === "project-detail") {
        window.location.href = goToList;
      }
    });
  });
}
