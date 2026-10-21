import "../core/progress.js";

class QAActivityStreak extends HTMLElement {
  connectedCallback() {
    if (this.connected) return;
    this.connected = true;
    if (!this.titleLabel) {
      this.innerHTML = `
        <section class="streak" aria-label="Sequência de aprendizado">
          <span class="streak__icon" aria-hidden="true">✦</span>
          <div class="streak__copy" role="status" aria-live="polite" aria-atomic="true">
            <strong data-streak-title></strong><small data-streak-description></small>
          </div>
          <ol class="streak__days" aria-label="Atividade desta semana, de segunda a domingo"></ol>
          <small class="streak__legend">✓ missão concluída · contorno: hoje</small>
        </section>
      `;
      this.titleLabel = this.querySelector("[data-streak-title]");
      this.description = this.querySelector("[data-streak-description]");
      this.days = this.querySelector(".streak__days");
    }
    this.refresh = () => this.render();
    this.onStorage = event => {
      if (event.key === window.QAQuestProgress.storageKey || event.key === null) this.render();
    };
    this.onVisibility = () => { if (!document.hidden) this.render(); };
    window.addEventListener("qaquest:progress", this.refresh);
    window.addEventListener("storage", this.onStorage);
    window.addEventListener("pageshow", this.refresh);
    window.addEventListener("focus", this.refresh);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.render();
  }

  disconnectedCallback() {
    this.connected = false;
    clearTimeout(this.midnightTimer);
    window.removeEventListener("qaquest:progress", this.refresh);
    window.removeEventListener("storage", this.onStorage);
    window.removeEventListener("pageshow", this.refresh);
    window.removeEventListener("focus", this.refresh);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  render() {
    const activity = window.QAQuestProgress.getActivitySummary();
    this.titleLabel.textContent = activity.currentStreak + (activity.currentStreak === 1 ? " dia" : " dias") + " de sequência";
    this.description.textContent = activity.completedToday ? "Atividade de hoje registrada. Continue explorando!" :
      activity.currentStreak ? "Conclua uma missão hoje para manter a sequência." : "Conclua uma missão para começar.";
    this.days.replaceChildren(...activity.week.map(day => {
      const item = document.createElement("li"), label = document.createElement("span"), status = document.createElement("span");
      label.textContent = day.label;
      status.className = "streak__day-status";
      status.textContent = day.completed ? "✓" : "·";
      label.setAttribute("aria-hidden", "true");
      status.setAttribute("aria-hidden", "true");
      item.classList.toggle("is-done", day.completed);
      item.classList.toggle("is-today", day.isToday);
      if (day.isToday) item.setAttribute("aria-current", "date");
      const [year, month, date] = day.date.split("-");
      const description = day.weekday + ", " + date + "/" + month + "/" + year +
        (day.isToday ? " · hoje" : "") + ": " + (day.completed ? "missão concluída" : "sem missão concluída");
      item.title = description;
      item.setAttribute("aria-label", description);
      item.dataset.date = day.date;
      item.append(label, status);
      return item;
    }));
    clearTimeout(this.midnightTimer);
    const now = new Date(), nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 0);
    this.midnightTimer = setTimeout(() => this.render(), Math.max(1000, nextDay.getTime() - now.getTime() + 50));
  }
}

if (!customElements.get("qa-activity-streak")) {
  customElements.define("qa-activity-streak", QAActivityStreak);
}
