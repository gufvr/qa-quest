import "../components/support-material.js";
import { initializeSitePage } from "../core/site-page.js";
import { getLibraryGroups } from "../core/library-catalog.js";

const groups = getLibraryGroups();
const count = groups.reduce((total, group) => total + group.entries.reduce((sum, entry) => sum + entry.materialCount, 0), 0);
document.getElementById("library-count").textContent = `${count} ${count === 1 ? "aula em PDF cadastrada" : "aulas em PDF cadastradas"} · acesso livre, sem pré-requisitos.`;
document.getElementById("library-empty").hidden = count > 0;
document.getElementById("library-groups").replaceChildren(...groups.map((group) => {
  const section = document.createElement("section");
  section.className = "library-group";
  section.setAttribute("aria-labelledby", `library-group-${group.id}`);
  const heading = document.createElement("h3");
  heading.id = `library-group-${group.id}`;
  heading.textContent = group.id === "base" ? "Base comum" : `Trilha ${String(group.index).padStart(2, "0")} — ${group.title}`;
  const description = document.createElement("p");
  description.className = "library-group__description";
  description.textContent = group.description;
  const list = document.createElement("ul");
  list.className = "home-library__list";
  list.replaceChildren(...group.entries.map(({ mission }) => {
    const item = document.createElement("li");
    const context = document.createElement("p");
    context.className = "library-group__context";
    context.textContent = mission.type === "phase" ? `FASE ${String(mission.phase).padStart(2, "0")} · ${mission.title}` : `MÓDULO ${String(mission.order).padStart(2, "0")} · ${mission.title}`;
    const material = document.createElement("qa-support-material");
    material.setAttribute("mission-id", mission.progressId);
    item.append(context, material);
    return item;
  }));
  section.append(heading, description, list);
  return section;
}));
initializeSitePage();
