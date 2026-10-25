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

  const current = new URL(window.location.href);
  return destination.pathname !== current.pathname || destination.search !== current.search;
}

function initializeNavigationFallback() {
  if ("startViewTransition" in document) return;

  document.documentElement.classList.add("qa-page-fallback-enter");
  window.setTimeout(() => {
    document.documentElement.classList.remove("qa-page-fallback-enter");
  }, 420);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !isEligibleNavigation(event, link)) return;

    event.preventDefault();
    document.documentElement.classList.add("qa-page-fallback-leave");
    window.setTimeout(() => window.location.assign(link.href), 170);
  });
}

initializeStepTransitions();
initializeNavigationFallback();
