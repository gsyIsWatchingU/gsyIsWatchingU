(() => {
  const tree = document.querySelector("[data-capability-tree]");
  if (!tree) return;

  const documentLinks = globalThis.SKILL_DOCUMENT_LINKS || {};
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  tree.querySelectorAll("[data-skill-document]").forEach((link) => {
    const documentUrl = String(documentLinks[link.dataset.skillDocument] || "").trim();
    if (!/^https:\/\//i.test(documentUrl)) return;

    link.href = documentUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.hidden = false;
  });

  if (!finePointer || reduceMotion) return;

  tree.addEventListener("pointermove", (event) => {
    const bounds = tree.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 28;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.18) * 24;
    tree.style.setProperty("--tree-light-x", `${x}px`);
    tree.style.setProperty("--tree-light-y", `${y}px`);
  });

  tree.addEventListener("pointerleave", () => {
    tree.style.setProperty("--tree-light-x", "0px");
    tree.style.setProperty("--tree-light-y", "0px");
  });
})();
