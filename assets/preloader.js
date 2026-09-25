/* ============================================================
   Preloader: tracks the things the home page really waits on
   (fonts, hero photo, WebGL scene, window load) and shows honest
   progress. A hard timeout guarantees it always clears.
   ============================================================ */
(function () {
  const root = document.getElementById("preloader");
  if (!root) return;
  const bar = root.querySelector(".preloader-bar-fill");
  const num = root.querySelector(".preloader-num");
  const html = document.documentElement;
  html.classList.add("is-loading");

  const tasks = { fonts: 0, photo: 0, scene: 0, window: 0 };
  let shown = 0;
  let done = false;

  const target = () =>
    Math.round((Object.values(tasks).reduce((a, b) => a + b, 0) / Object.keys(tasks).length) * 100);

  function finish(task) {
    tasks[task] = 1;
  }

  // fonts
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => finish("fonts"));

  // hero photo
  const photo = document.querySelector(".hero-avatar");
  if (!photo || photo.complete) finish("photo");
  else {
    photo.addEventListener("load", () => finish("photo"), { once: true });
    photo.addEventListener("error", () => finish("photo"), { once: true });
  }

  // 3D scene: first frame rendered, or no WebGL at all
  if (!document.getElementById("forge")) finish("scene");
  addEventListener("forge:ready", () => finish("scene"), { once: true });

  // everything else
  if (document.readyState === "complete") finish("window");
  else addEventListener("load", () => finish("window"), { once: true });

  // never trap the visitor
  const started = performance.now();
  const HARD_LIMIT = 4000;

  function tick() {
    if (done) return;
    let goal = target();
    if (performance.now() - started > HARD_LIMIT) goal = 100;
    // ease toward the goal, never backwards, never fake-complete early
    shown += (goal - shown) * 0.12;
    if (goal === 100 && shown > 99.2) shown = 100;
    const pct = Math.floor(shown);
    bar.style.transform = `scaleX(${shown / 100})`;
    num.textContent = pct;
    if (shown >= 100) return hide();
    requestAnimationFrame(tick);
  }

  function hide() {
    done = true;
    root.classList.add("is-done");
    html.classList.remove("is-loading");
    html.classList.add("is-loaded");
    dispatchEvent(new Event("app:loaded"));
    root.addEventListener("transitionend", () => root.remove(), { once: true });
    setTimeout(() => root.isConnected && root.remove(), 1200);
  }

  requestAnimationFrame(tick);
})();
