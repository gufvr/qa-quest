import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  isAvailable,
  isCompleted,
  journeyGroups,
} from "../../../core/content-catalog.js";
import { Group } from "./Journey.styles.js";

function Mission({ item, group, state, recommendation, index }) {
  const status = isCompleted(item, state)
    ? "done"
    : !isAvailable(item, state)
      ? "locked"
      : recommendation?.progressId === item.progressId
        ? "current"
        : "available";
  const label =
    status === "done"
      ? `${state.missions[item.progressId]?.bestXp || 0} XP`
      : status === "current"
        ? "PRÓXIMA"
        : status === "available"
          ? "DISPONÍVEL"
          : "BLOQUEADA";
  const action =
    status === "done"
      ? "Revisitar"
      : status === "locked"
        ? "Bloqueada"
        : "Abrir";
  const props = {
    className: "journey-mission__control",
    id: `mission-${group.id}-${item.id}`,
    "aria-label": `${action}: ${item.title}, ${group.title}`,
  };
  const content = (
    <>
      <span className="journey-mission__icon" aria-hidden="true">
        {status === "done" ? "✓" : status === "current" ? "◆" : "◇"}
      </span>
      <span className="journey-mission__copy">
        <small>
          {item.type === "phase"
            ? `FASE ${String(item.phase).padStart(2, "0")}`
            : `MÓDULO ${String(index + 1).padStart(2, "0")}`}
        </small>
        <strong>{item.title}</strong>
        <span>{item.description}</span>
      </span>
      <span className="journey-mission__status">{label}</span>
    </>
  );
  return (
    <li className={`journey-mission journey-mission--${status}`}>
      {status === "locked" ? (
        <button
          {...props}
          type="button"
          data-locked-mission={item.id}
          aria-disabled="true"
        >
          {content}
        </button>
      ) : (
        <a {...props} href={item.route}>
          {content}
        </a>
      )}
    </li>
  );
}

function JourneyGroups({ state, recommendation }) {
  return journeyGroups.map((group) => {
    const completed = group.items.filter((item) =>
      isCompleted(item, state),
    ).length;
    const unlocked =
      group.id === "base" || Boolean(state.missions.phase4?.completed);
    return (
      <Group
        key={group.id}
        className={`journey-group${unlocked ? "" : " journey-group--locked"}`}
        data-group={group.id}
      >
        <header className="journey-group__header">
          <div>
            <span className="journey-group__eyebrow">
              {group.id === "base"
                ? "COMECE AQUI"
                : `TRILHA ${String(group.index).padStart(2, "0")}`}
            </span>
            <h3>{group.title}</h3>
            <p>{group.description}</p>
          </div>
          <span
            className="journey-group__counter"
            aria-label={`${completed} de ${group.items.length} concluídas`}
          >
            {completed} / {group.items.length}
          </span>
        </header>
        <div className="journey-group__progress" aria-hidden="true">
          <span
            style={{ width: `${(completed / group.items.length) * 100}%` }}
          />
        </div>
        <ol className="journey-group__missions">
          {group.items.map((item, index) => (
            <Mission
              key={item.id}
              item={item}
              group={group}
              state={state}
              recommendation={recommendation}
              index={index}
            />
          ))}
        </ol>
      </Group>
    );
  });
}

const root = createRoot(document.getElementById("journey-groups"));

export function renderJourneyGroups(state, recommendation) {
  flushSync(() =>
    root.render(
      <JourneyGroups state={state} recommendation={recommendation} />,
    ),
  );
}
