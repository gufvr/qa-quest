class QAFooter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    this.innerHTML = `
      <footer class="footer">
        <div class="container footer__content">
          <div class="footer__top">
            <qa-brand href="#inicio"></qa-brand>
            <p>Aprenda. Teste. Evolua.</p>
            <span>Projeto de aprendizado em construção.</span>
          </div>

          <div class="footer__bottom">
            <span>© 2026 QA Quest. Todos os direitos reservados.</span>
            <span>
              Desenvolvido por
              <a
                href="https://github.com/gufvr"
                target="_blank"
                rel="noopener noreferrer"
              >Gustavo Favero</a>
            </span>
          </div>
        </div>
      </footer>
    `;
  }
}

if (!customElements.get("qa-footer")) {
  customElements.define("qa-footer", QAFooter);
}
