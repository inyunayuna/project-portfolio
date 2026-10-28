import { t } from "./i18n.js";
import { renderText } from "./utils.js";

export function mountImageViewer(container) {
  let dialog;
  let image;
  let closeButton;
  let previousButton;
  let nextButton;
  let message;
  let opener;
  let gallery = [];
  let index = -1;
  let swipe = null;
  let suppressClick = false;
  let scrollState = null;

  const fit = () => {
    if (!dialog?.open || !image.naturalWidth || !image.naturalHeight) return;
    const style = getComputedStyle(dialog);
    const width = dialog.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = dialog.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    // Keep one source pixel per screen pixel, including Retina displays.
    const density = Math.max(1, window.devicePixelRatio || 1);
    const scale = Math.min(
      1 / density,
      width / image.naturalWidth,
      height / image.naturalHeight,
      1200 / image.naturalWidth,
      900 / image.naturalHeight,
    );
    image.style.width = `${image.naturalWidth * scale}px`;
    image.style.height = `${image.naturalHeight * scale}px`;
  };

  const unlock = () => {
    if (!scrollState) return;
    document.body.style.overflow = scrollState.overflow;
    document.body.style.paddingRight = scrollState.paddingRight;
    scrollState = null;
  };

  const show = target => {
    if (target < 0 || target >= gallery.length) return;
    index = target;
    previousButton.disabled = index === 0;
    nextButton.disabled = index === gallery.length - 1;
    previousButton.hidden = nextButton.hidden = gallery.length < 2;
    message.innerHTML = renderText(t("loading"));
    message.hidden = false;
    image.hidden = true;
    image.alt = gallery[index].alt;
    image.src = gallery[index].src;
  };

  const create = () => {
    dialog = document.createElement("dialog");
    dialog.className = "image-viewer";
    dialog.innerHTML = `
      <button type="button" class="image-viewer-close" autofocus>×</button>
      <button type="button" class="image-viewer-nav image-viewer-previous" disabled></button>
      <button type="button" class="image-viewer-nav image-viewer-next" disabled></button>
      <img class="image-viewer-image" alt="" decoding="async" draggable="false">
      <p class="image-viewer-message" role="status"></p>`;
    document.body.append(dialog);
    image = dialog.querySelector("img");
    closeButton = dialog.querySelector(".image-viewer-close");
    previousButton = dialog.querySelector(".image-viewer-previous");
    nextButton = dialog.querySelector(".image-viewer-next");
    message = dialog.querySelector('[role="status"]');
    closeButton.addEventListener("click", () => dialog.close());
    previousButton.addEventListener("click", () => show(index - 1));
    nextButton.addEventListener("click", () => show(index + 1));
    dialog.addEventListener("click", event => {
      // A completed swipe may generate a click on the backdrop: keep the viewer open.
      if (suppressClick) {
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("keydown", event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        show(index + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    dialog.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse") return;
      const edgeWidth = Math.min(160, Math.max(56, dialog.clientWidth * 0.12));
      const edge = event.clientX <= edgeWidth ? "left"
        : event.clientX >= dialog.clientWidth - edgeWidth ? "right" : "";
      if (dialog.dataset.edge !== edge) dialog.dataset.edge = edge;
    });
    dialog.addEventListener("pointerleave", () => { dialog.dataset.edge = ""; });
    dialog.addEventListener("pointerdown", event => {
      suppressClick = false;
      if (event.pointerType !== "touch") return;
      dialog.dataset.edge = "";
      if (event.isPrimary === false || event.target.closest("button")) {
        swipe = null;
        return;
      }
      swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    dialog.addEventListener("pointerup", event => {
      if (!swipe || swipe.id !== event.pointerId) return;
      const dx = event.clientX - swipe.x;
      const dy = event.clientY - swipe.y;
      swipe = null;
      if (Math.hypot(dx, dy) > 8) suppressClick = true;
      const threshold = Math.min(80, Math.max(40, dialog.clientWidth * 0.1));
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      suppressClick = true;
      show(index + (dx < 0 ? 1 : -1));
    });
    dialog.addEventListener("pointercancel", () => {
      swipe = null;
      suppressClick = false;
    });
    dialog.addEventListener("close", () => {
      unlock();
      gallery = [];
      index = -1;
      swipe = null;
      suppressClick = false;
      dialog.dataset.edge = "";
      image.removeAttribute("src");
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      opener = null;
    });
    image.addEventListener("load", () => {
      if (!dialog.open) return;
      fit();
      message.hidden = true;
      image.hidden = false;
    });
    image.addEventListener("error", () => {
      if (!dialog.open) return;
      message.innerHTML = renderText(t("image.error"));
      message.hidden = false;
      image.hidden = true;
    });
  };

  window.addEventListener("resize", () => {
    fit();
    if (dialog) dialog.dataset.edge = "";
  }, { passive: true });

  container.addEventListener("click", event => {
    const trigger = event.target.closest("button.media-image");
    if (!trigger || !container.contains(trigger) || dialog?.open) return;
    gallery = [...container.querySelectorAll("button.media-image")].flatMap(button => {
      const source = button.querySelector("img");
      return source?.src ? [{ button, src: source.dataset.originalSrc || source.src, alt: source.alt }] : [];
    });
    const start = gallery.findIndex(item => item.button === trigger);
    if (start === -1) return;
    if (!dialog) create();

    opener = trigger;
    dialog.setAttribute("aria-label", t("image.view"));
    for (const [button, key] of [
      [closeButton, "close"], [previousButton, "previous"], [nextButton, "next"],
    ]) {
      button.setAttribute("aria-label", t(`image.${key}`));
      button.title = t(`image.${key}`);
    }

    // Reserve the scrollbar width so opening the viewer does not move the grid.
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    scrollState = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    document.body.style.overflow = "hidden";
    if (scrollbar) document.body.style.paddingRight = `${padding + scrollbar}px`;
    // Native dialog handles Escape, focus trapping and the inert background.
    dialog.showModal();
    show(start);
  });
}
