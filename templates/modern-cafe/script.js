const header = document.getElementById("siteHeader");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 30);
});

const navToggle = document.getElementById("navToggle");
navToggle.addEventListener("click", () => header.classList.toggle("open"));
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => header.classList.remove("open"));
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    document.querySelectorAll(".menu-panel").forEach((p) => p.classList.remove("active"));
    chip.classList.add("active");
    document.getElementById(chip.dataset.tab).classList.add("active");
  });
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
if (reduceMotion) {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
} else {
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}
