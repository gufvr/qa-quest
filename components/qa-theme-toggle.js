class QAThemeToggle extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    this.innerHTML = `
      <button
        class="theme-toggle"
        type="button"
        aria-label="Ativar tema claro"
        aria-pressed="false"
        title="Alternar tema"
      >
        <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">☼</span>
        <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">☾</span>
      </button>
    `;

    this.button = this.querySelector(".theme-toggle");
    this.updateButton(document.documentElement.dataset.theme || "dark");
    this.button.addEventListener("click", () => this.toggleTheme());
  }

  updateButton(theme) {
    const isLight = theme === "light";
    this.button.setAttribute("aria-pressed", String(isLight));
    this.button.setAttribute("aria-label", isLight ? "Ativar tema escuro" : "Ativar tema claro");
    this.button.title = isLight ? "Usar tema escuro" : "Usar tema claro";
  }

  toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("qa-quest-theme", nextTheme);
    this.updateButton(nextTheme);
  }
}

if (!customElements.get("qa-theme-toggle")) {
  customElements.define("qa-theme-toggle", QAThemeToggle);
}
