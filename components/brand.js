class QABrand extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    const href = this.getAttribute("href") || "index.html";
    const label = this.getAttribute("aria-label") || "QA Quest — início";

    this.innerHTML = `
      <a class="brand" href="${href}" aria-label="${label}">
        <img
          class="brand__mark"
          src="qaquest.png"
          alt=""
          width="44"
          height="44"
          aria-hidden="true"
        >
        <span>QA <strong>Quest</strong></span>
      </a>
    `;
  }
}

if (!customElements.get("qa-brand")) {
  customElements.define("qa-brand", QABrand);
}
