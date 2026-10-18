import { loadUI } from "./i18n.js";
import { mountHeader } from "./header.js";
import { mountGridAlignment } from "./grid-alignment.js";
import { renderText } from "./utils.js";

const VIEWS = {
  projects: "./list-view.js",
  writings: "./list-view.js",
  "project-detail": "./detail-view.js",
  notes: "./notes-view.js",
  cv: "./notes-view.js",
};

async function boot() {
  mountGridAlignment();
  const page = document.body.dataset.page;
  const [, view] = await Promise.all([
    loadUI(),
    VIEWS[page] ? import(VIEWS[page]) : null,
  ]);
  mountHeader();

  switch (page) {
    case "projects":
      await view.mountList({
        dataUrl: "data/projects.json",
        containerId: "project-list",
        detailHref: id => `project.html?id=${encodeURIComponent(id)}`,
      });
      break;

    case "writings":
      await view.mountList({
        dataUrl: "data/writings.json",
        containerId: "writings-list",
        detailHref: id => `project.html?id=${encodeURIComponent(id)}&src=writings`,
        useFilter: false,
      });
      break;

    case "project-detail": {
      const src = new URLSearchParams(location.search).get("src");
      await view.mountDetail({
        dataUrl: src === "writings" ? "data/writings.json" : "data/projects.json",
        containerId: "project-detail",
      });
      break;
    }

    case "notes":
    case "cv":
      await view.mountNotes({
        dataUrl: `data/${page}.json`,
        containerId: page === "cv" ? "cv-content" : "notes-list",
      });
      break;

    case "404":
      break;

    default:
      console.warn(`[app] Unknown page: ${page}`);
  }
}

boot().catch(err => {
  console.error("[app] Failed to start:", err);
  document.querySelectorAll('[data-i18n="loading"]').forEach(el => {
    el.innerHTML = renderText("Failed to load. Please reload. / 불러오기에 실패했습니다.");
  });
});
