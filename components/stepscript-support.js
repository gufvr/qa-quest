import "../styles/stepscript-support.css";

class QAStepScriptSupport extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";
    const framework =
      this.getAttribute("framework") === "playwright"
        ? "Playwright"
        : "Cypress";
    this.innerHTML = `
      <aside class="stepscript-support" aria-labelledby="stepscript-support-title">
        <div>
          <span class="label">PRÁTICA COMPLEMENTAR · OPCIONAL · SEM XP EXTRA</span>
          <h2 id="stepscript-support-title">Do fluxo gravado ao código revisado.</h2>
          <p>O StepScript é um projeto complementar de Gustavo Favero, criador do QA Quest. Ele registra interações e gera código para Cypress e Playwright; não executa os testes pelo painel.</p>
          <details>
            <summary>Como experimentar com segurança</summary>
            <ol>
              <li>Se quiser, instale a extensão pela loja oficial e leia suas permissões.</li>
              <li>Grave somente os controles do catálogo local desta página: categoria, busca e Aplicar. Não é necessário gravar sua navegação ou seu progresso no QA Quest.</li>
              <li>Use apenas dados fictícios em ambientes em que você tenha autorização. A proteção automática de dados sensíveis não é uma garantia; revise o conteúdo antes de compartilhar.</li>
              <li>Exporte para ${framework} e revise seletores, estado inicial, esperas e assertions. Interações gravadas não comprovam o resultado do filtro.</li>
              <li>A execução real exige um projeto ${framework} e uma aplicação de teste configurados fora do QA Quest. Adapte rotas e seletores ao ambiente autorizado; o spec de exemplo não é plug-and-play.</li>
            </ol>
            <p>O QA Quest não detecta a instalação, não controla gravações e não recebe seus arquivos. Você conclui a mesma missão e recebe o mesmo XP sem usar a extensão.</p>
          </details>
        </div>
        <a class="button button--ghost" href="https://chromewebstore.google.com/detail/stepscript/kjapjhhghfigfilijhbdlchgpiojidhd" target="_blank" rel="noopener noreferrer" aria-label="Conhecer StepScript na Chrome Web Store (abre em nova aba)">Conhecer StepScript ↗</a>
      </aside>`;
  }
}
if (!customElements.get("qa-stepscript-support"))
  customElements.define("qa-stepscript-support", QAStepScriptSupport);
