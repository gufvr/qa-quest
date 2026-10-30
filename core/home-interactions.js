// Home-only navigation: leave mission routes and their shared transitions intact.
export function initializeHomeNavigation() {
  let cancelScroll = () => {};
  let animatedTarget;
  let animationTimer;

  function arrive(target) {
    const heading = target.querySelector("h1, h2") || target;
    if (!heading.hasAttribute("tabindex")) {
      heading.setAttribute("tabindex", "-1");
      heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
    }
    heading.focus({ preventScroll: true });

    window.clearTimeout(animationTimer);
    animatedTarget?.classList.remove("qa-step-enter");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animatedTarget = target;
    void target.offsetWidth;
    target.classList.add("qa-step-enter");
    animationTimer = window.setTimeout(() => target.classList.remove("qa-step-enter"), 520);
  }

  function navigate(event) {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey
      || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute("download")
      || (link.target && link.target !== "_self")) return;

    const destination = new URL(link.href, window.location.href);
    const current = new URL(window.location.href);
    if (destination.origin !== current.origin || destination.pathname !== current.pathname
      || destination.search !== current.search || !destination.hash) return;

    let target;
    try { target = document.getElementById(decodeURIComponent(destination.hash.slice(1))); }
    catch { return; }
    if (!target) return;

    event.preventDefault();
    cancelScroll();
    const offset = (document.querySelector(".site-header")?.offsetHeight || 0) + 18;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const top = Math.min(maxScroll, Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset));
    if (current.hash !== destination.hash) window.history.pushState(null, "", destination.hash);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reducedMotion ? "instant" : "smooth" });
    if (reducedMotion) { arrive(target); return; }

    const controller = new AbortController();
    let frame;
    const startedAt = performance.now();
    cancelScroll = () => {
      window.cancelAnimationFrame(frame);
      controller.abort();
    };
    // Don't move focus after the user interrupts the scroll or starts another action.
    for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) {
      window.addEventListener(type, cancelScroll, { passive: true, signal: controller.signal });
    }
    function waitForArrival() {
      if (Math.abs(window.scrollY - top) < 3) {
        cancelScroll();
        arrive(target);
      } else if (performance.now() - startedAt > 2000) {
        cancelScroll();
      } else {
        frame = window.requestAnimationFrame(waitForArrival);
      }
    }
    frame = window.requestAnimationFrame(waitForArrival);
  }

  document.addEventListener("click", navigate);
  return () => {
    document.removeEventListener("click", navigate);
    cancelScroll();
    window.clearTimeout(animationTimer);
    animatedTarget?.classList.remove("qa-step-enter");
  };
}

export function initializeHomeHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return () => {};

  const controller = new AbortController();
  const options = { passive: true, signal: controller.signal };
  let referenceY = window.scrollY;
  let frame;
  let hideTimer;
  let revealTimer;
  let hovered = false;
  // Keep keyboard navigation visible without pinning the header after a mouse/touch click.
  const hasFocus = () => header.contains(document.activeElement)
    && document.activeElement.matches(":focus-visible");
  function show() {
    window.clearTimeout(hideTimer);
    window.clearTimeout(revealTimer);
    revealTimer = null;
    header.classList.remove("is-retracted");
  }
  function hideWhenIdle() {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (window.scrollY > header.offsetHeight && !hovered && !hasFocus()) {
        header.classList.add("is-retracted");
      }
    }, 600);
  }
  function update() {
    frame = null;
    const y = Math.max(0, window.scrollY);
    if (y <= 24 || hovered || hasFocus()) {
      show();
      referenceY = y;
    } else if (y - referenceY > 8) {
      header.classList.add("is-retracted");
      referenceY = y;
    } else if (referenceY - y > 8) {
      show();
      referenceY = y;
    }
  }
  window.addEventListener("scroll", () => {
    if (frame == null) frame = window.requestAnimationFrame(update);
  }, options);
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    if (event.clientY > 18) {
      window.clearTimeout(revealTimer);
      revealTimer = null;
    } else if (header.classList.contains("is-retracted") && revealTimer == null) {
      // A short dwell prevents the header flashing during an incidental pointer pass.
      revealTimer = window.setTimeout(show, 140);
    }
  }, options);
  header.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hovered = true;
    show();
  }, options);
  header.addEventListener("pointerleave", () => { hovered = false; hideWhenIdle(); }, options);
  header.addEventListener("focusin", show, options);
  header.addEventListener("focusout", hideWhenIdle, options);
  window.addEventListener("pageshow", () => { referenceY = window.scrollY; update(); }, options);
  update();

  return () => {
    controller.abort();
    window.clearTimeout(hideTimer);
    window.clearTimeout(revealTimer);
    window.cancelAnimationFrame(frame);
    header.classList.remove("is-retracted");
  };
}
