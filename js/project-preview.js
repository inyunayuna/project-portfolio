import { pickLang } from "./i18n.js";
import { renderInline, splitParagraphs } from "./utils.js";

// The full diagonal bounds every rotation; reserve room for the CSS drift too.
export function floatingCardPlacement(bounds, width, height, point) {
  const drift = 10;
  const available = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top);
  const diagonal = Math.hypot(width, height);
  if (available <= drift * 2 + 2 || !diagonal) return null;
  const scale = Math.min(1, (available - drift * 2 - 2) / diagonal);
  const radius = diagonal * scale / 2 + drift + 1;
  const rangeX = Math.max(0, bounds.right - bounds.left - radius * 2);
  const rangeY = Math.max(0, bounds.bottom - bounds.top - radius * 2);
  return {
    x: bounds.left + radius + rangeX * point.x,
    y: bounds.top + radius + rangeY * point.y,
    scale,
  };
}

export function mountProjectPreview(container, items) {
  const main = container.closest(".main-area");
  if (!main) return () => {};

  const projects = new Map(items.map(item => [String(item.id), item]));
  const cache = new Map();
  const layer = document.createElement("div");
  layer.className = "project-preview";
  layer.hidden = true;
  layer.inert = true;
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <div class="project-preview-image-position" hidden>
      <img class="project-preview-image" alt="" decoding="async">
    </div>
    <div class="project-preview-text-position" hidden>
      <div class="project-preview-text-fit">
        <div class="project-preview-text"></div>
      </div>
    </div>`;
  const imagePosition = layer.querySelector(".project-preview-image-position");
  const imageElement = layer.querySelector("img");
  const textPosition = layer.querySelector(".project-preview-text-position");
  const textElement = layer.querySelector(".project-preview-text");
  // Give text its own stacking level above the grid, below the project rows.
  textPosition.inert = true;
  textPosition.setAttribute("aria-hidden", "true");
  main.prepend(layer, textPosition);
  let activeRow = null;
  let activeImage = null;
  let hasText = false;
  let point = { x: 0.5, y: 0.5 };
  let request = 0;
  let layoutFrame = 0;

  const hide = () => {
    request++;
    activeRow = null;
    activeImage = null;
    hasText = false;
    layer.hidden = true;
    imagePosition.hidden = true;
    textPosition.hidden = true;
  };

  const layout = () => {
    if (!activeRow) return;
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = window.innerHeight;
    const rect = main.getBoundingClientRect();
    const top = Math.max(0, Math.min(viewHeight, rect.top));
    const bottom = Math.max(0, Math.min(viewHeight, rect.bottom));
    layer.style.clipPath = `inset(${top}px 0 ${viewHeight - bottom}px)`;

    if (activeImage) {
      const scale = Math.min(
        viewWidth * 0.65 / activeImage.naturalWidth,
        viewHeight * 0.65 / activeImage.naturalHeight,
        840 / activeImage.naturalWidth,
        640 / activeImage.naturalHeight,
        1,
      );
      imageElement.style.width = `${activeImage.naturalWidth * scale}px`;
      imageElement.style.height = `${activeImage.naturalHeight * scale}px`;
    }

    if (!hasText) return;
    // Measure the untransformed card, independent of its current animation angle.
    textPosition.hidden = false;
    const placement = floatingCardPlacement({
      left: Math.max(0, rect.left) + 16,
      right: Math.min(viewWidth, rect.right) - 16,
      top: top + 16,
      bottom: bottom - 16,
    }, textElement.offsetWidth, textElement.offsetHeight, point);
    textPosition.hidden = !placement;
    if (!placement) return;
    textPosition.style.left = `${placement.x}px`;
    textPosition.style.top = `${placement.y}px`;
    textPosition.style.setProperty("--preview-text-scale", placement.scale);
  };

  const load = src => {
    if (!cache.has(src)) {
      cache.set(src, new Promise(resolve => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
      }));
    }
    return cache.get(src);
  };

  const show = async row => {
    if (row === activeRow) return;
    hide();
    const item = projects.get(row.dataset.id);
    if (!item) return;
    activeRow = row;
    const currentRequest = request;
    point = { x: Math.random(), y: Math.random() };
    const content = item.content || [];
    const paragraph = content
      .filter(block => block.type === "text")
      .map(block => splitParagraphs(pickLang(block.value))[0])
      .find(Boolean);
    hasText = Boolean(paragraph);
    textElement.innerHTML = paragraph ? renderInline(paragraph) : "";
    layer.hidden = false;
    layout();

    const media = content.filter(block => block.type === "media")
      .flatMap(block => block.items || []);
    const image = media.find(item => item.type === "image" && item.src);
    const src = item.thumbnail || image?.src;
    if (!src) return;
    let url;
    try { url = new URL(src, document.baseURI); } catch { return; }
    if (!["http:", "https:"].includes(url.protocol)) return;
    const loaded = await load(url.href);
    if (currentRequest !== request || !loaded?.naturalWidth || !loaded.naturalHeight) return;
    activeImage = loaded;
    imageElement.src = url.href;
    layout();
    imagePosition.hidden = false;
  };

  container.addEventListener("pointerover", event => {
    if (event.pointerType === "touch") return;
    const row = event.target.closest(".list-row");
    if (row) show(row);
  });
  container.addEventListener("pointerleave", hide);
  container.addEventListener("pointerout", event => {
    const nextRow = event.relatedTarget?.closest?.(".list-row");
    if (!nextRow || !container.contains(nextRow)) hide();
  });
  container.addEventListener("focusin", event => {
    const row = event.target.closest(".list-row");
    if (row) show(row);
  });
  container.addEventListener("focusout", event => {
    if (!container.contains(event.relatedTarget)) hide();
  });
  window.addEventListener("blur", hide);
  window.addEventListener("pagehide", hide);
  window.addEventListener("resize", layout, { passive: true });
  window.addEventListener("scroll", () => {
    if (!activeRow || layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      layout();
    });
  }, { passive: true });
  document.fonts.ready.then(layout);
  document.fonts.addEventListener("loadingdone", layout);
  return hide;
}
