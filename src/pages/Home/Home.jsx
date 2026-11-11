import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../components/activity-streak.js";
import { initializeSitePage } from "../../../core/site-page.js";
import {
  getCompletedUniqueMissions,
  getRecommendedMission,
  journeyGroups,
  learningTracks,
  uniqueMissions,
} from "../../../core/content-catalog.js";
import { createHomeInsightController } from "../../../core/home-insight-controller.js";
import { Metrics } from "./Home.styles.js";

const insightLabels = {
  fact: "FATO COM FONTE",
  guidance: "DICA DE ESTUDO",
  humor: "PAUSA QA QUEST",
};

function HomeInsight({ state, recommendation }) {
  const rootRef = useRef(null);
  const controllerRef = useRef(null);
  const [display, setDisplay] = useState({ insight: null, updated: false });

  useEffect(() => {
    const controller = createHomeInsightController({
      getState: () => window.QAQuestProgress.getState(),
      render: (message) =>
        setDisplay((previous) => ({
          insight: message,
          updated: Boolean(previous.insight),
        })),
      canRender: () => !rootRef.current?.contains(document.activeElement),
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.update(state, recommendation);
  }, [state, recommendation]);

  const { insight, updated } = display;
  const source = insight?.source;
  const author = insight
    ? insight.type === "fact"
      ? `Paráfrase · ${insight.author}`
      : `QA Quest · ${insight.type === "humor" ? "humor autoral" : "orientação de estudo"}`
    : "QA Quest · orientação de estudo";

  return (
    <div
      ref={rootRef}
      className={`home-hero__description home-insight${updated ? " is-updating" : ""}`}
      id="home-insight"
      aria-live="off"
      data-insight-id={insight?.id}
      data-insight-type={insight?.type}
      data-insight-context={insight?.context}
      onBlur={() => queueMicrotask(() => controllerRef.current?.refresh())}
    >
      <span className="home-insight__label" data-insight-label>
        {insight ? insightLabels[insight.type] : "DICA DE ESTUDO"}
      </span>
      <p
        key={insight?.id || "initial"}
        className="home-insight__text"
        data-insight-text
      >
        {insight?.text ||
          "Avance por uma base guiada e escolha trilhas com simuladores de rotina, feedback imediato e progresso salvo no navegador."}
      </p>
      <div className="home-insight__meta">
        <span data-insight-author>{author}</span>
        <a
          data-insight-source
          hidden={!source}
          href={source?.url}
          title={source?.title}
          aria-label={
            source
              ? `Consultar fonte: ${source.title}, ${insight.author} (abre em nova aba)`
              : undefined
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Consultar fonte <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}

function MissionPanel({ state, recommendation }) {
  const level = Math.floor(state.totalXp / 500) + 1;
  const levelXp = state.totalXp % 500;
  const group =
    recommendation &&
    journeyGroups.find((entry) => entry.id === recommendation.groupId);
  const context = !recommendation
    ? "JORNADA ATUAL CONCLUÍDA"
    : recommendation.type === "phase"
      ? `FASE ${String(recommendation.phase).padStart(2, "0")} · BASE COMUM`
      : `TRILHA ${String(group.index).padStart(2, "0")} · ${group.title.toUpperCase()}`;
  const status = !recommendation
    ? "Continue praticando no seu ritmo"
    : recommendation.type === "phase"
      ? "Avance pela sequência guiada"
      : state.selectedTrack === recommendation.groupId
        ? "Prioridade da trilha escolhida"
        : "Próxima prática recomendada";

  return (
    <aside className="mission-panel" aria-labelledby="current-mission-title">
      <div className="mission-panel__top">
        <div>
          <span className="label" id="current-mission-context">
            {context}
          </span>
          <h2 id="current-mission-title">
            {recommendation?.title ||
              "Todo o conteúdo disponível foi explorado"}
          </h2>
        </div>
        <div
          className="level-badge"
          id="level-badge"
          aria-label={`Nível ${level}`}
        >
          NV. {String(level).padStart(2, "0")}
        </div>
      </div>
      <p
        className="mission-panel__description"
        id="current-mission-description"
      >
        {recommendation?.description ||
          "Você pode escolher uma trilha no hub ou revisitar uma missão concluída."}
      </p>
      <div className="xp-card">
        <div className="xp-card__row">
          <span>Progresso do nível</span>
          <strong id="total-xp-label">{levelXp} / 500 XP</strong>
        </div>
        <div
          className={`progress${levelXp === 0 ? " progress--empty" : ""}`}
          id="total-xp-progress"
          role="progressbar"
          aria-label={`Progresso do nível: ${levelXp} de 500 XP`}
          aria-valuemin="0"
          aria-valuemax="500"
          aria-valuenow={levelXp}
        >
          <span
            id="total-xp-progress-bar"
            style={{ width: `${(levelXp / 500) * 100}%` }}
          ></span>
        </div>
      </div>
      <div className="mission-panel__next">
        <div>
          <small>RECOMENDAÇÃO</small>
          <strong id="current-mission-status">{status}</strong>
        </div>
        <a
          className="button button--primary"
          id="current-mission-link"
          href={recommendation?.route || "tracks.html"}
        >
          {recommendation ? "Continuar" : "Abrir hub"}{" "}
          <span aria-hidden="true">→</span>
        </a>
      </div>
      <qa-activity-streak></qa-activity-streak>
    </aside>
  );
}

function Home() {
  const [snapshot, setSnapshot] = useState(() => {
    const state = window.QAQuestProgress.getState();
    return { state, recommendation: getRecommendedMission(state) };
  });
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncement = useRef("");

  useEffect(
    () =>
      initializeSitePage((state, { announce, recommendation }) => {
        setSnapshot({ state, recommendation });
        const message = recommendation
          ? `Próxima missão recomendada: ${recommendation.title}.`
          : "Todo o conteúdo disponível foi concluído.";
        if (announce && message !== lastAnnouncement.current)
          setAnnouncement(message);
        lastAnnouncement.current = message;
      }),
    [],
  );

  const { state, recommendation } = snapshot;
  const route = recommendation?.route || "tracks.html";

  return (
    <>
      <p
        className="sr-only"
        id="home-live-status"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </p>
      <section className="home-hero" id="inicio">
        <div
          className="home-hero__glow home-hero__glow--one"
          aria-hidden="true"
        ></div>
        <div
          className="home-hero__glow home-hero__glow--two"
          aria-hidden="true"
        ></div>
        <div className="container home-hero__grid">
          <div className="home-hero__content">
            <div className="eyebrow">
              <span className="eyebrow__dot" aria-hidden="true"></span>
              Sua evolução em QA começa aqui
            </div>
            <h1>
              Pratique decisões reais.
              <br />
              <span>Evolua como QA.</span>
            </h1>
            <HomeInsight state={state} recommendation={recommendation} />
            <div className="home-hero__actions">
              <a className="button button--primary" href={route}>
                Continuar jornada <span aria-hidden="true">→</span>
              </a>
              <a className="button button--text" href="jornada.html">
                Explorar o mapa
              </a>
              <a className="button button--text" href="biblioteca.html">
                Aulas em PDF
              </a>
            </div>
            <Metrics className="home-metrics" aria-label="Resumo da jornada">
              <div>
                <dt id="catalog-mission-count">{uniqueMissions.length}</dt>
                <dd>missões reais</dd>
              </div>
              <div>
                <dt id="catalog-track-count">{learningTracks.length}</dt>
                <dd>trilhas práticas</dd>
              </div>
              <div>
                <dt id="catalog-completed-count">
                  {getCompletedUniqueMissions(state).length}
                </dt>
                <dd>concluídas</dd>
              </div>
            </Metrics>
          </div>
          <MissionPanel state={state} recommendation={recommendation} />
        </div>
      </section>
      <section
        className="home-destinations"
        aria-labelledby="destinations-title"
      >
        <div className="container">
          <h2 id="destinations-title">Escolha seu próximo passo</h2>
          <p className="home-destinations__intro">
            Um lugar para praticar, outro para estudar. Tudo conectado ao seu
            aprendizado.
          </p>
          <div className="destination-grid">
            <a className="destination-card" href="jornada.html">
              <h3>Jornada</h3>
              <span aria-hidden="true">↗</span>
              <p>
                Veja o mapa, acompanhe suas missões e revisite o que já
                concluiu.
              </p>
            </a>
            <a className="destination-card" href="biblioteca.html">
              <h3>Biblioteca</h3>
              <span aria-hidden="true">↗</span>
              <p>
                Consulte e baixe as aulas em PDF, organizadas por fase e trilha.
              </p>
            </a>
            <a className="destination-card" href="como-funciona.html">
              <h3>Como funciona</h3>
              <span aria-hidden="true">↗</span>
              <p>
                Entenda a base, as trilhas, o XP e como seu progresso é salvo.
              </p>
            </a>
          </div>
          <div className="cta">
            <div>
              <span className="label">PRONTO PARA CONTINUAR?</span>
              <h2 id="bottom-cta-title">
                {recommendation
                  ? `${recommendation.title} está esperando por você.`
                  : "Revisite uma missão ou escolha sua próxima prática."}
              </h2>
            </div>
            <a className="button button--light" href={route}>
              Continuar jornada <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function mountHome(element) {
  createRoot(element).render(<Home />);
}
