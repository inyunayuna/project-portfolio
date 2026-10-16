import { loadUI } from "./i18n.js";
import { mountHeader } from "./header.js";
import { mountGridAlignment } from "./grid-alignment.js";

const VIEWS = {
  projects: "./list-view.js",
  writings: "./list-view.js",
  "project-detail": "./detail-view.js",
  notes: "./notes-view.js",
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
      await view.mountNotes({
        dataUrl: "data/notes.json",
        containerId: "notes-list",
      });
      break;

    case "404":
      break;

    default:
      console.warn(`[app] Unknown page: ${page}`);
  }
}

function start() {
  boot().catch(err => {
    console.error("[app] Failed to start:", err);
    document.querySelectorAll('[data-i18n="loading"]').forEach(el => {
      el.textContent = "Failed to load. Please reload. / 불러오기에 실패했습니다.";
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
