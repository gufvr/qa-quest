class QAHeader extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    const variant = this.getAttribute("variant") || "site";
    const templates = {
      site: this.siteTemplate(),
      mission: this.missionTemplate(),
      simulator: this.simulatorTemplate(),
      planner: this.plannerTemplate()
    };

    this.innerHTML = templates[variant] || templates.site;
  }

  siteTemplate() {
    return `
      <header class="site-header">
        <nav class="nav container" aria-label="Navegação principal">
          <qa-brand href="#inicio"></qa-brand>
          <div class="nav__links">
            <a href="#jornada">Jornada</a>
            <a href="#como-funciona">Como funciona</a>
          </div>
          <div class="nav__actions">
            <qa-theme-toggle></qa-theme-toggle>
            <button class="button button--small button--ghost" data-start type="button">Começar</button>
          </div>
        </nav>
      </header>
    `;
  }

  missionTemplate() {
    return `
      <header class="mission-header">
        <nav class="nav container" aria-label="Navegação da missão">
          <qa-brand href="index.html"></qa-brand>
          <div class="nav__actions">
            <span class="mission-header__xp"><strong id="header-xp">0</strong> XP</span>
            <qa-theme-toggle></qa-theme-toggle>
            <a class="mission-header__exit" href="index.html">Sair</a>
          </div>
        </nav>
      </header>
    `;
  }

  simulatorTemplate() {
    return `
      <header class="simulator-header">
        <nav class="nav simulator-container" aria-label="Navegação do simulador">
          <qa-brand href="index.html"></qa-brand>
          <div class="simulator-header__status">
            <span class="environment-badge"><i aria-hidden="true"></i> HOMOLOGAÇÃO</span>
            <span class="simulator-xp"><strong id="header-xp">0</strong> XP</span>
            <qa-theme-toggle></qa-theme-toggle>
            <a class="simulator-exit" href="index.html">Encerrar turno</a>
          </div>
        </nav>
      </header>
    `;
  }

  plannerTemplate() {
    return `
      <header class="planning-header">
        <nav class="nav planning-container" aria-label="Navegação do simulador de planejamento">
          <qa-brand href="index.html"></qa-brand>
          <div class="planning-header__status">
            <span class="planning-badge"><i aria-hidden="true"></i> PLANEJAMENTO</span>
            <span class="planning-xp"><strong id="header-xp">0</strong> XP</span>
            <qa-theme-toggle></qa-theme-toggle>
            <a class="planning-exit" href="index.html">Encerrar missão</a>
          </div>
        </nav>
      </header>
    `;
  }
}

if (!customElements.get("qa-header")) {
  customElements.define("qa-header", QAHeader);
}
