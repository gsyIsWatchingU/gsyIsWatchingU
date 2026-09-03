(() => {
const header = document.querySelector(".site-header");

if (!header) return;

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
})();
