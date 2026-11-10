const labels = Object.freeze({
  fact: "FATO COM FONTE",
  guidance: "DICA DE ESTUDO",
  humor: "PAUSA QA QUEST",
});

export function renderHomeInsight(root, insight) {
  if (root.dataset.insightId === insight.id) return;
  const previousId = root.dataset.insightId;
  root.dataset.insightId = insight.id;
  root.dataset.insightType = insight.type;
  root.dataset.insightContext = insight.context;
  root.querySelector("[data-insight-label]").textContent = labels[insight.type];
  root.querySelector("[data-insight-text]").textContent = insight.text;
  root.querySelector("[data-insight-author]").textContent =
    insight.type === "fact"
      ? `Paráfrase · ${insight.author}`
      : `QA Quest · ${insight.type === "humor" ? "humor autoral" : "orientação de estudo"}`;
  const source = root.querySelector("[data-insight-source]");
  source.hidden = !insight.source;
  if (insight.source) {
    source.href = insight.source.url;
    source.title = insight.source.title;
    source.setAttribute(
      "aria-label",
      `Consultar fonte: ${insight.source.title}, ${insight.author} (abre em nova aba)`,
    );
  } else {
    source.removeAttribute("href");
    source.removeAttribute("title");
    source.removeAttribute("aria-label");
  }
  if (previousId) {
    root.classList.remove("is-updating");
    void root.offsetWidth;
    root.classList.add("is-updating");
  }
}
