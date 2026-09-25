/* ============================================================
   Depth helpers: scroll reveals with perspective, pointer tilt.
   Pure DOM; works with or without the WebGL layer.
   ============================================================ */
(function () {
  // On the home page, wait for the preloader so the hero reveal is seen
  if (document.getElementById("preloader") && !document.documentElement.classList.contains("is-loaded")) {
    addEventListener("app:loaded", init, { once: true });
  } else {
    init();
  }
})();

function init() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  // ---- reveals -----------------------------------------------------------
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.setAttribute("data-reveal", "");
      child.style.setProperty("--i", i);
    });
  });

  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  const pending = new Set(targets);
  const show = (el) => {
    el.classList.add("is-in");
    pending.delete(el);
  };
  // Anything at or above the reveal line counts as seen, so a jump past an
  // element (anchor link, restored scroll position) never leaves it hidden.
  const inView = (el) => el.getBoundingClientRect().top < innerHeight * 0.92;

  if (reduced) {
    targets.forEach(show);
  } else {
    // Anything already on screen shows immediately, without waiting on an observer
    targets.forEach((el) => inView(el) && show(el));

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target);
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      pending.forEach((el) => io.observe(el));
    }

    // Scroll fallback for environments where observers are throttled
    let ticking = false;
    const sweep = () => {
      ticking = false;
      pending.forEach((el) => inView(el) && show(el));
    };
    addEventListener("scroll", () => {
      if (!ticking && pending.size) {
        ticking = true;
        requestAnimationFrame(sweep);
      }
    }, { passive: true });
  }

  // ---- pointer tilt -------------------------------------------------------
  if (reduced || coarse) return;

  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const max = parseFloat(el.getAttribute("data-tilt")) || 8;
    let raf = 0;
    let rx = 0, ry = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--rx", rx.toFixed(2) + "deg");
      el.style.setProperty("--ry", ry.toFixed(2) + "deg");
    };

    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry = px * max * 2;
      rx = -py * max * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    el.addEventListener("pointerleave", () => {
      rx = 0;
      ry = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  });
}
