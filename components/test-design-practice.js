import {
  DELIVERY_RULES,
  checkEquivalenceRepresentatives,
  checkBoundarySelection,
  checkDeliveryTable,
  checkTechniqueReview,
} from "../core/test-design-practice.js";

const techniqueOptions = `
  <option value="">Escolha a técnica</option>
  <option value="equivalence">Partição de equivalência</option>
  <option value="boundary">Valores-limite</option>
  <option value="decision">Tabela de decisão</option>
`;

class QATestDesignPractice extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";
    this.innerHTML = `
      <details class="test-design-practice">
        <summary>
          <span><strong>Praticar três técnicas</strong><small>Abra quando quiser · sem nota, XP ou salvamento</small></span>
          <span class="test-design-practice__chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="test-design-practice__body">
          <p class="test-design-practice__intro">Cenários fictícios da FictFvr. Comece pela regra; depois escolha os dados. Você pode conferir e corrigir quantas vezes quiser. Recarregar a página reinicia apenas esta prática temporária.</p>
          <section class="test-design-card test-design-panel" aria-labelledby="td-equivalence-title">
            <span class="label label--cyan">01 · AGRUPAR</span>
            <h3 id="td-equivalence-title">Partição de equivalência</h3>
            <p>Agrupe entradas pelo tratamento esperado e escolha um representante de cada grupo. Isso reduz repetições sem prometer cobertura de todos os valores.</p>
            <p class="test-design-rule"><strong>Regra A:</strong> neste exercício, a quantidade já é um número inteiro. Aceitar de <strong>1 a 5, inclusive</strong>; rejeitar os demais inteiros. Formato, campo vazio e decimais ficam fora deste recorte.</p>
            <form data-technique="equivalence">
              <fieldset>
                <legend>Escolha um representante para cada partição</legend>
                <div class="test-design-fields">
                  <label>Inteiro abaixo de 1<input name="below" type="number" step="any" inputmode="numeric" required /></label>
                  <label>Inteiro de 1 a 5<input name="inside" type="number" step="any" inputmode="numeric" required /></label>
                  <label>Inteiro acima de 5<input name="above" type="number" step="any" inputmode="numeric" required /></label>
                </div>
              </fieldset>
              <button type="submit" class="button button--ghost">Conferir representantes</button>
              <p class="test-design-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></p>
            </form>
          </section>
          <section class="test-design-card test-design-panel" aria-labelledby="td-boundary-title">
            <span class="label label--cyan">02 · INVESTIGAR TRANSIÇÕES</span>
            <h3 id="td-boundary-title">Análise de valores-limite</h3>
            <p>Faixas ordenadas têm pontos em que o resultado muda. Investigue a passagem entre aceitar e rejeitar, não somente um valor no meio.</p>
            <p class="test-design-rule"><strong>Mesma regra A:</strong> inteiros de 1 a 5 são aceitos. Neste recorte de <strong>2 valores</strong>, escolha um par em cada transição: um valor aceito e seu vizinho rejeitado.</p>
            <form data-technique="boundary">
              <fieldset>
                <legend>Selecione os quatro valores para as duas transições</legend>
                <div class="test-design-values">${[0, 1, 2, 3, 4, 5, 6].map((value) => `<label><input type="checkbox" name="boundary" value="${value}" /><span>${value}</span></label>`).join("")}</div>
              </fieldset>
              <button type="submit" class="button button--ghost">Conferir limites</button>
              <p class="test-design-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></p>
            </form>
          </section>
          <section class="test-design-card test-design-panel" aria-labelledby="td-decision-title">
            <span class="label label--cyan">03 · COMBINAR CONDIÇÕES</span>
            <h3 id="td-decision-title">Tabela de decisão</h3>
            <p>Quando uma ação depende de várias condições, organize as combinações antes de criar casos. Aqui, cada linha é uma regra e as quatro combinações são viáveis.</p>
            <p class="test-design-rule"><strong>Regra B:</strong> frete grátis somente para <strong>VIP ativo E subtotal de pelo menos R$ 200,00</strong>. Caso contrário, manter frete padrão. Não há outra condição neste exemplo.</p>
            <form data-technique="decision">
              <fieldset>
                <legend>Complete o resultado esperado de cada combinação</legend>
                <div class="test-design-table-wrap" tabindex="0" role="region" aria-label="Tabela de decisão de frete, com rolagem horizontal quando necessário">
                  <table>
                    <caption>Decisões de frete · Regra B</caption>
                    <thead><tr><th scope="col">Regra</th><th scope="col">VIP ativo?</th><th scope="col">Subtotal</th><th scope="col">Frete esperado</th></tr></thead>
                    <tbody>${DELIVERY_RULES.map((rule, index) => `<tr><th scope="row">R${index + 1}</th><td>${rule.vip ? "Sim" : "Não"}</td><td>R$ ${rule.subtotal},00</td><td><select name="${rule.id}" aria-label="Frete esperado para R${index + 1}: VIP ${rule.vip ? "sim" : "não"}, subtotal ${rule.subtotal} reais" required><option value="">Escolha</option><option value="free">Grátis</option><option value="standard">Padrão</option></select></td></tr>`).join("")}</tbody>
                  </table>
                </div>
                <p class="test-design-table-hint">Em telas estreitas, deslize a tabela para ver todas as colunas. Pelo teclado, foque a região da tabela e use as setas.</p>
              </fieldset>
              <button type="submit" class="button button--ghost">Conferir tabela</button>
              <p class="test-design-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></p>
            </form>
          </section>
          <section class="test-design-card test-design-panel" aria-labelledby="td-review-title">
            <span class="label">REVISÃO SEM PONTUAÇÃO</span>
            <h3 id="td-review-title">Qual pergunta cada técnica responde?</h3>
            <form data-technique="review">
              <fieldset class="test-design-review">
                <legend>Associe intenção e técnica</legend>
                <label>Representar grupos tratados da mesma forma<select name="groups" required>${techniqueOptions}</select></label>
                <label>Investigar a mudança nos extremos da faixa<select name="edges" required>${techniqueOptions}</select></label>
                <label>Examinar as combinações de VIP e subtotal<select name="combinations" required>${techniqueOptions}</select></label>
              </fieldset>
              <button type="submit" class="button button--ghost">Revisar associações</button>
              <p class="test-design-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></p>
            </form>
          </section>
          <p class="test-design-practice__source">Referência conceitual: <a href="https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf#page=39" target="_blank" rel="noopener noreferrer">ISTQB CTFL v4.0.1, seções 4.2.1–4.2.3 (PDF em inglês, nova aba)</a>. Exemplos autorais do QA Quest; não é treinamento credenciado.</p>
        </div>
      </details>
    `;
    this.addEventListener("submit", (event) => {
      const form = event.target.closest("form[data-technique]");
      if (!form || !this.contains(form)) return;
      event.preventDefault();
      event.stopPropagation();
      const data = new FormData(form);
      const checks = {
        equivalence: () =>
          checkEquivalenceRepresentatives(Object.fromEntries(data)),
        boundary: () => checkBoundarySelection(data.getAll("boundary")),
        decision: () => checkDeliveryTable(Object.fromEntries(data)),
        review: () => checkTechniqueReview(Object.fromEntries(data)),
      };
      const result = checks[form.dataset.technique]?.();
      if (!result) return;
      const feedback = form.querySelector(".test-design-feedback");
      feedback.hidden = false;
      feedback.dataset.result = result.correct ? "correct" : "review";
      feedback.textContent = `${result.correct ? "Conferido." : "Vamos revisar."} ${result.feedback}`;
    });
  }
}

if (!customElements.get("qa-test-design-practice")) {
  customElements.define("qa-test-design-practice", QATestDesignPractice);
}
