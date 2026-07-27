class QAFooter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    this.innerHTML = `
      <footer class="footer">
        <div class="container footer__content">
          <qa-brand href="#inicio"></qa-brand>
          <p>Aprenda. Teste. Evolua.</p>
          <span>Projeto de aprendizado em construção.</span>
        </div>
      </footer>
    `;
  }
}

if (!customElements.get("qa-footer")) {
  customElements.define("qa-footer", QAFooter);
}
