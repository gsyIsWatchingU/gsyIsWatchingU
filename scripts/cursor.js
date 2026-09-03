(() => {
  const visual = document.querySelector(".hero__visual");
  const ring = document.querySelector(".cursor-ring");
  const dot = document.querySelector(".cursor-dot");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!finePointer || reduceMotion || !ring || !dot) return;

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;

  const renderCursor = () => {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
    requestAnimationFrame(renderCursor);
  };

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    ring.style.opacity = "1";
    dot.style.opacity = "1";

    const visualX = (event.clientX / window.innerWidth - 0.5) * 18;
    const visualY = (event.clientY / window.innerHeight - 0.5) * 18;
    visual?.style.setProperty("--visual-x", `${visualX}px`);
    visual?.style.setProperty("--visual-y", `${visualY}px`);
  });

  document.documentElement.addEventListener("mouseleave", () => {
    ring.style.opacity = "0";
    dot.style.opacity = "0";
  });

  document.querySelectorAll("a, button, [tabindex]").forEach((element) => {
    element.addEventListener("mouseenter", () => {
      ring.classList.add("is-active");
      dot.classList.add("is-active");
    });
    element.addEventListener("mouseleave", () => {
      ring.classList.remove("is-active");
      dot.classList.remove("is-active");
    });
  });

  renderCursor();
})();
