class QAToast extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    this.innerHTML = `
      <div class="toast" role="status" aria-live="polite" aria-hidden="true">
        <span aria-hidden="true">◆</span>
        <div><strong></strong><small></small></div>
      </div>
    `;

    this.toast = this.querySelector(".toast");
    this.timer = null;
  }

  show(title, message, duration = 3800) {
    window.clearTimeout(this.timer);
    this.toast.querySelector("strong").textContent = title;
    this.toast.querySelector("small").textContent = message;
    this.toast.classList.add("is-visible");
    this.toast.setAttribute("aria-hidden", "false");

    this.timer = window.setTimeout(() => {
      this.toast.classList.remove("is-visible");
      this.toast.setAttribute("aria-hidden", "true");
    }, duration);
  }
}

if (!customElements.get("qa-toast")) {
  customElements.define("qa-toast", QAToast);
}
