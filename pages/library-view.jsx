import React from "react";
import { createRoot } from "react-dom/client";
import styled from "styled-components";
import { getLibraryGroups } from "../core/library-catalog.js";

const Group = styled.section`
  min-width: 0;
`;

const groups = getLibraryGroups();
const count = groups.reduce(
  (total, group) =>
    total + group.entries.reduce((sum, entry) => sum + entry.materialCount, 0),
  0,
);

document.getElementById("library-count").textContent =
  `${count} ${count === 1 ? "aula em PDF cadastrada" : "aulas em PDF cadastradas"} · acesso livre, sem pré-requisitos.`;
document.getElementById("library-empty").hidden = count > 0;

function LibraryGroups() {
  return groups.map((group) => (
    <Group
      className="library-group"
      aria-labelledby={`library-group-${group.id}`}
      key={group.id}
    >
      <h3 id={`library-group-${group.id}`}>
        {group.id === "base"
          ? "Base comum"
          : `Trilha ${String(group.index).padStart(2, "0")} — ${group.title}`}
      </h3>
      <p className="library-group__description">{group.description}</p>
      <ul className="home-library__list">
        {group.entries.map(({ mission }) => (
          <li key={mission.progressId}>
            <p className="library-group__context">
              {mission.type === "phase"
                ? `FASE ${String(mission.phase).padStart(2, "0")} · ${mission.title}`
                : `MÓDULO ${String(mission.order).padStart(2, "0")} · ${mission.title}`}
            </p>
            <qa-support-material mission-id={mission.progressId} />
          </li>
        ))}
      </ul>
    </Group>
  ));
}

createRoot(document.getElementById("library-groups")).render(<LibraryGroups />);
