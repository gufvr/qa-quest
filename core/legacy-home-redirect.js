const legacySections = Object.freeze({
  "#jornada": "jornada.html",
  "#biblioteca": "biblioteca.html",
  "#como-funciona": "como-funciona.html"
});

export function getLegacyHomeDestination(href) {
  const current = new URL(href);
  if (!/\/(?:index\.html)?$/.test(current.pathname)) return null;
  const route = Object.hasOwn(legacySections, current.hash) ? legacySections[current.hash] : null;
  if (!route) return null;
  const destination = new URL(route, current);
  destination.search = current.search;
  return destination.href;
}

export function initializeLegacyHomeRedirect() {
  const redirect = () => {
    const destination = getLegacyHomeDestination(window.location.href);
    if (!destination) return false;
    window.location.replace(destination);
    return true;
  };
  window.addEventListener("hashchange", redirect);
  window.addEventListener("pageshow", redirect);
  return redirect();
}
