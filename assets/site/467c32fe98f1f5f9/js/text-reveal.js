// One reveal per paragraph per visit; retain the full layout and accessible text.
export function mountTextReveal(container) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  let observer;
  const running = new Map();
  let frame = 0;

  const finish = paragraph => {
    const animation = running.get(paragraph);
    if (animation) {
      for (const { node, wrapper } of animation.originals) wrapper.replaceWith(node);
      running.delete(paragraph);
    }
    paragraph.classList.remove("text-reveal-pending");
    observer?.unobserve(paragraph);
  };

  const tick = now => {
    frame = 0;
    for (const [paragraph, animation] of running) {
      const count = Math.min(animation.chars.length,
        Math.ceil((now - animation.start) / animation.duration * animation.chars.length));
      while (animation.shown < count) {
        animation.chars[animation.shown++].style.opacity = "1";
      }
      if (count === animation.chars.length) finish(paragraph);
    }
    if (running.size) frame = requestAnimationFrame(tick);
  };

  const start = paragraph => {
    observer.unobserve(paragraph);
    if (motion.matches) { finish(paragraph); return; }
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const chars = [];
    const originals = [];
    for (const node of nodes) {
      const wrapper = document.createElement("span");
      const segments = segmenter
        ? [...segmenter.segment(node.data)].map(part => part.segment) : Array.from(node.data);
      for (const text of segments) {
        const char = document.createElement("span");
        char.textContent = text;
        char.style.opacity = "0";
        wrapper.append(char);
        chars.push(char);
      }
      node.replaceWith(wrapper);
      originals.push({ node, wrapper });
    }
    paragraph.classList.remove("text-reveal-pending");
    running.set(paragraph, {
      chars, originals, shown: 0, start: performance.now(),
      duration: Math.min(1400, Math.max(280, chars.length * 5)),
    });
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const complete = () => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    for (const paragraph of [...running.keys()]) finish(paragraph);
    container.querySelectorAll(".text-reveal-pending").forEach(finish);
  };

  const refresh = () => {
    complete();
    if (motion.matches || !("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) start(entry.target);
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    for (const paragraph of container.querySelectorAll(".content-text p, .note-body p")) {
      paragraph.classList.add("text-reveal-pending");
      observer.observe(paragraph);
    }
  };

  // Keyboard users should never focus an invisible link.
  container.addEventListener("focusin", event => {
    const paragraph = event.target.closest("p");
    if (paragraph) finish(paragraph);
  });
  motion.addEventListener("change", () => { if (motion.matches) complete(); });
  window.addEventListener("beforeprint", complete);
  window.addEventListener("pagehide", complete);
  window.addEventListener("pageshow", event => {
    if (event.persisted) refresh(); // Also restart after a back/forward cache restore.
  });
  return refresh;
}
