import { FILTERS, getState, setState, subscribe } from "./state.js";
import { t } from "./i18n.js";

// 배열: sub-header에 필터 버튼 표시 / null: 브랜드만 표시
const FILTERS_BY_PAGE = {
  projects: FILTERS,
  research: null,
  notes:    null,
};

const LANGS = ["ko", "en", "de"];

function currentPage() {
  return document.body.dataset.page || "projects";
}

// project-detail 페이지는 ?src=research 여부로 탭 결정, 나머지는 페이지명 그대로
function pageToTab() {
  const p = currentPage();
  if (p !== "project-detail") return p;
  return new URLSearchParams(location.search).get("src") === "research"
    ? "research"
    : "projects";
}

export function mountHeader() {
  renderHeader();
  renderSubHeader();
  updateLanguage();

  subscribe(() => {
    updateLanguage();
    renderHeader();
    renderSubHeader();
  }, ["lang"]);

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
    document.title = `Yuna — ${t("nav." + tab)}`;
  }
}

function renderHeader() {
  const el = document.querySelector('[data-component="header"]');
  if (!el) return;

  const activeTab = pageToTab();
  const { lang } = getState();

  el.innerHTML = `
    <div class="nav-left">
      <a class="nav-link ${activeTab === "notes"     ? "is-active" : ""}" href="notes.html">${t("nav.notes")}</a>
      <a class="nav-link ${activeTab === "projects"  ? "is-active" : ""}" href="index.html">${t("nav.projects")}</a>
      <a class="nav-link ${activeTab === "research"  ? "is-active" : ""}" href="research.html">${t("nav.research")}</a>
    </div>

    <div class="nav-center lang-switch" role="group" aria-label="Language">
      ${LANGS.map((lc, i) => `
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

    <div class="nav-right">${t("brand")}</div>
  `;

  el.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => setState({ lang: btn.dataset.lang }));
  });
}

function renderSubHeader() {
  const el = document.querySelector('[data-component="sub-header"]');
  if (!el) return;

  const filterList = FILTERS_BY_PAGE[pageToTab()];

  if (!filterList) {
    el.innerHTML = `<span class="nav-brand">${t("brand")}</span>`;
    return;
  }

  const { filter } = getState();
  const goToList = "index.html";

  el.innerHTML = `
    <div class="filter-list" role="group" aria-label="Filter">
      ${filterList.map(f => `
        <button type="button"
                class="filter-btn ${f === filter ? "is-active" : ""}"
                data-filter="${f}"
                aria-pressed="${f === filter}">
          ${t("filters." + f)}
        </button>
      `).join("")}
    </div>
    <span class="nav-brand">${t("brand")}</span>
    <a class="index-link" href="${goToList}">${t("index")}</a>
  `;

  el.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      // 상세 페이지에서 필터를 누르면 목록으로 이동
      if (currentPage().endsWith("detail")) {
        setState({ filter: f });
        window.location.href = goToList;
      } else {
        setState({ filter: f });
      }
    });
  });
}
