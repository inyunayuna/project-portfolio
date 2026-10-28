import { imageManifest } from "./image-manifest.js";
import { escapeAttr } from "./utils.js";

export function imageAttributes(src, count = 1) {
  const image = imageManifest[src];
  if (!image) return `src="${escapeAttr(src)}"`;
  const candidates = image.variants.map(v => `${v.src} ${v.width}w`);
  if (image.width > image.variants.at(-1).width) {
    candidates.push(`${encodeURI(src)} ${image.width}w`);
  }
  const srcset = candidates.join(", ");
  const sizes = count === 1
    ? "(max-width: 720px) calc(100vw - 72px), (max-width: 904px) calc(100vw - 144px), 760px"
    : `(max-width: 720px) calc((100vw - ${72 + (count - 1) * 9}px) / ${count}), calc((100vw - ${144 + (count - 1) * 18}px) / ${count})`;
  return `src="${escapeAttr(src)}" srcset="${escapeAttr(srcset)}" sizes="${sizes}" width="${image.width}" height="${image.height}"`;
}

export function previewImage(src) {
  const image = imageManifest[src];
  if (!image) return { src };
  const scale = Math.min(
    document.documentElement.clientWidth * 0.65 / image.width,
    window.innerHeight * 0.65 / image.height,
    840 / image.width, 640 / image.height, 1,
  );
  const width = image.width * scale * (window.devicePixelRatio || 1);
  const variant = image.variants.find(v => v.width >= width) || image.variants.at(-1);
  return { src: variant.src, naturalWidth: image.width, naturalHeight: image.height };
}
