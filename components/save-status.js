class QASaveStatus extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";
    this.innerHTML = `<p class="progress-save-status" role="status" hidden></p>`;
    this.status = this.querySelector(".progress-save-status");
  }

  show(result) {
    this.status.hidden = false;
    this.status.textContent = result.gainedXp > 0
      ? `Progresso salvo · +${result.gainedXp} XP adicionados ao total (${result.totalXp} XP).`
      : `Progresso salvo · Seu melhor resultado permanece em ${result.bestXp} XP.`;
  }

  reset() {
    this.status.textContent = "";
    this.status.hidden = true;
  }
}

if (!customElements.get("qa-save-status")) {
  customElements.define("qa-save-status", QASaveStatus);
}
