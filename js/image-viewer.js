import { t } from "./i18n.js";

export function mountImageViewer(container) {
  let dialog;
  let image;
  let closeButton;
  let message;
  let opener;
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

  const create = () => {
    dialog = document.createElement("dialog");
    dialog.className = "image-viewer";
    dialog.innerHTML = `
      <button type="button" class="image-viewer-close" autofocus>×</button>
      <img class="image-viewer-image" alt="" decoding="async">
      <p class="image-viewer-message" role="status"></p>`;
    document.body.append(dialog);
    image = dialog.querySelector("img");
    closeButton = dialog.querySelector("button");
    message = dialog.querySelector('[role="status"]');
    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      unlock();
      image.removeAttribute("src");
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      opener = null;
    });
    image.addEventListener("load", () => {
      fit();
      message.hidden = true;
      image.hidden = false;
    });
    image.addEventListener("error", () => {
      message.textContent = t("image.error");
      message.hidden = false;
      image.hidden = true;
    });
  };

  window.addEventListener("resize", fit, { passive: true });

  container.addEventListener("click", event => {
    const trigger = event.target.closest("button.media-image");
    if (!trigger || !container.contains(trigger)) return;
    const source = trigger.querySelector("img");
    if (!source?.src) return;
    if (!dialog) create();
    if (dialog.open) return;

    opener = trigger;
    dialog.setAttribute("aria-label", t("image.view"));
    closeButton.setAttribute("aria-label", t("image.close"));
    closeButton.title = t("image.close");
    message.textContent = t("loading");
    message.hidden = false;
    image.hidden = true;
    image.alt = source.alt;
    image.src = source.currentSrc || source.src;

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
  });
}
