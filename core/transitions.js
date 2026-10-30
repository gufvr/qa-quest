const ACTION_PATTERN = /pr[oó]xim|continuar|avan[cç]|seguir|iniciar|finalizar|concluir|emitir|revisar|repetir|reiniciar|executar|simular|confirmar|registrar|aplicar|salvar|testar|validar|comparar|abrir/i;
const ACTIVE_ANIMATIONS = new WeakMap();

let activeInteraction = null;
let interactionId = 0;

function replayAnimation(element, className, duration = 520) {
  if (!(element instanceof HTMLElement)) return;

  const previousTimer = ACTIVE_ANIMATIONS.get(element);
  if (previousTimer) window.clearTimeout(previousTimer);

  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);

  const timer = window.setTimeout(() => {
    element.classList.remove(className);
    ACTIVE_ANIMATIONS.delete(element);
  }, duration);

  ACTIVE_ANIMATIONS.set(element, timer);
}

function getTopLevelElements(elements) {
  return elements.filter((element, index, list) => (
    !list.some((candidate, candidateIndex) => (
      candidateIndex !== index && candidate.contains(element)
    ))
  ));
}

function getInteractionScope(control) {
  return control.closest([
    ".quiz-card",
    ".planning-workspace",
    ".simulator-workspace",
    "[class$='-workspace']",
    "[class*='-workspace ']",
    "[class$='-lab']",
    "[class*='-lab ']",
    "[class$='-panel']",
    "[class*='-panel ']"
  ].join(", ")) || document.querySelector("main");
}

function isStepAction(control) {
  if (control.matches(":disabled, [aria-disabled='true']")) return false;

  if (control instanceof HTMLAnchorElement) {
    const href = control.getAttribute("href");
    if (href && href !== "#" && !href.startsWith("javascript:")) return false;
  }

  const label = [
    control.id,
    control.getAttribute("aria-label"),
    control.textContent
  ].filter(Boolean).join(" ");

  return control.matches("button[type='submit']") || ACTION_PATTERN.test(label);
}

function observeStepChanges() {
  const main = document.querySelector("main");
  if (!main) return;

  const observer = new MutationObserver((mutations) => {
    const revealedElements = [...new Set(mutations
      .filter(({ type, attributeName, target }) => (
        type === "attributes"
        && attributeName === "hidden"
        && target instanceof HTMLElement
        && !target.hidden
        && main.contains(target)
      ))
      .map(({ target }) => target))];

    if (!revealedElements.length) return;

    if (activeInteraction) activeInteraction.revealedContent = true;
    getTopLevelElements(revealedElements).forEach((element) => {
      replayAnimation(element, "qa-step-enter");
    });
  });

  observer.observe(main, {
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden"]
  });
}

function initializeStepTransitions() {
  window.requestAnimationFrame(observeStepChanges);

  document.addEventListener("click", (event) => {
    const control = event.target.closest("main button, main a");
    if (!control || !isStepAction(control)) return;

    const interaction = {
      id: ++interactionId,
      revealedContent: false,
      scope: getInteractionScope(control)
    };

    activeInteraction = interaction;
    window.setTimeout(() => {
      if (activeInteraction === interaction) activeInteraction = null;
      if (
        !interaction.revealedContent
        && interaction.scope?.isConnected
        && !interaction.scope.hidden
      ) {
        replayAnimation(interaction.scope, "qa-content-refresh", 420);
      }
    }, 0);
  }, true);
}

function isEligibleNavigation(event, link) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || link.hasAttribute("download")
    || (link.target && link.target !== "_self")
  ) return false;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin) return false;
  // Animate application pages, not documents or other downloadable resources.
  if (!/\.html?$/i.test(destination.pathname) && !destination.pathname.endsWith("/")) return false;

  const current = new URL(window.location.href);
  return destination.pathname !== current.pathname || destination.search !== current.search;
}

function initializePageTransitions() {
  const root = document.documentElement;
  let entryTimer;
  let leaveTimer;
  let navigating = false;

  function clearNavigation() {
    window.clearTimeout(entryTimer);
    window.clearTimeout(leaveTimer);
    navigating = false;
    root.classList.remove("qa-page-enter", "qa-page-leave");
  }

  function enterPage() {
    clearNavigation();
    root.classList.add("qa-page-enter");
    entryTimer = window.setTimeout(() => root.classList.remove("qa-page-enter"), 700);
  }

  // Use one CSS-driven path in every browser; the same-document API alone
  // doesn't guarantee that cross-document View Transitions will run.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enterPage, { once: true });
  } else {
    enterPage();
  }
  window.addEventListener("pagehide", clearNavigation);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) enterPage();
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !isEligibleNavigation(event, link)) return;

    event.preventDefault();
    if (navigating) return;
    navigating = true;
    const destination = link.href;
    window.clearTimeout(entryTimer);
    root.classList.remove("qa-page-enter");
    root.classList.add("qa-page-leave");
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 90 : 260;
    leaveTimer = window.setTimeout(() => {
      try { window.location.assign(destination); }
      catch { enterPage(); }
    }, duration);
  });
}

initializeStepTransitions();
initializePageTransitions();
