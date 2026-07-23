const startButtons = document.querySelectorAll("[data-start]");
const themeToggle = document.querySelector(".theme-toggle");

function updateThemeButton(theme) {
  const isLight = theme === "light";
  themeToggle.setAttribute("aria-pressed", String(isLight));
  themeToggle.setAttribute("aria-label", isLight ? "Ativar tema escuro" : "Ativar tema claro");
  themeToggle.title = isLight ? "Usar tema escuro" : "Usar tema claro";
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("qa-quest-theme", nextTheme);
  updateThemeButton(nextTheme);
}

updateThemeButton(document.documentElement.dataset.theme);
themeToggle.addEventListener("click", toggleTheme);

startButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.location.href = "missao.html";
  });
});
