import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { learningTracks } from "../../../core/content-catalog.js";
import {
  TrackCard,
  TrackCardDescription,
  TrackCardEyebrow,
  TrackCardFooter,
  TrackCardSequence,
  TrackDetails,
  TrackDetailsFacts,
  TrackDetailsHeader,
  TrackDetailsProgress,
  TrackGrid,
  TrackModule,
  TrackModules,
  TrackProgressBar,
  TrackProgressFill,
  TracksContent,
  TracksIntro,
  TracksLocked,
  TracksSectionHeading,
  TracksSummary,
} from "./Tracks.styles.js";

const progress = window.QAQuestProgress;
const scrollKeys = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Tab",
  "Escape",
]);

function TrackCardButton({ track, selectedTrackId, readOnly, onSelect }) {
  const trackProgress = progress.getTrackProgress(track.id);
  const trackTitle = track.hub.title || track.title;
  const selected = selectedTrackId === track.id;
  const count = `${trackProgress.completed} / ${trackProgress.total}`;

  return (
    <TrackCard
      type="button"
      data-track={track.id}
      aria-controls="track-details"
      aria-pressed={selected}
      disabled={readOnly}
      onClick={() => onSelect(track.id)}
    >
      <TrackCardEyebrow>{track.hub.label}</TrackCardEyebrow>
      <strong>{trackTitle}</strong>
      <TrackCardDescription>{track.hub.cardDescription}</TrackCardDescription>
      <TrackCardSequence>{track.hub.sequence}</TrackCardSequence>
      <TrackCardFooter>
        <span>{count} temas</span>
        <span>Ver trilha →</span>
      </TrackCardFooter>
      <TrackProgressBar
        role="progressbar"
        aria-label={`${trackTitle}: ${trackProgress.completed} de ${trackProgress.total} temas concluídos`}
        aria-valuemin="0"
        aria-valuemax={trackProgress.total}
        aria-valuenow={trackProgress.completed}
      >
        <TrackProgressFill
          style={{ width: `${trackProgress.percentage}%` }}
        />
      </TrackProgressBar>
    </TrackCard>
  );
}

function TrackModuleItem({ module, index, completedModules }) {
  const completed = completedModules.includes(module.id);
  const linkLabel = completed
    ? module.hubCompletedLinkLabel || module.hubLinkLabel
    : module.hubLinkLabel;

  return (
    <TrackModule className={completed ? "track-module--done" : undefined}>
      <span className="track-module__number">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="track-module__copy">
        <strong>{module.title}</strong>
        <p>{module.hubDetail}</p>
        <qa-support-material
          mission-id={module.id}
          compact=""
        ></qa-support-material>
      </div>
      <div className="track-module__actions">
        <span className="track-module__status">
          {completed ? "Concluído" : module.hubAvailableLabel}
        </span>
        <a href={module.route}>{linkLabel}</a>
      </div>
    </TrackModule>
  );
}

function Tracks({ state, setState }) {
  const detailsRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const unlocked = progress.isTracksUnlocked();
  const readOnly = progress.isReadOnly();
  const selectedTrack =
    learningTracks.find((track) => track.id === state.selectedTrack) ||
    learningTracks[0];
  const selectedTrackTitle = selectedTrack.hub.title || selectedTrack.title;
  const trackProgress = progress.getTrackProgress(selectedTrack.id);

  function cancelTrackScroll() {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }

  function scrollToTrackDetails() {
    cancelTrackScroll();
    const details = detailsRef.current;
    if (!details) return;

    const start = window.scrollY;
    const margin =
      parseFloat(window.getComputedStyle(details).scrollMarginTop) || 0;
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const target = Math.min(
      maxScroll,
      Math.max(0, start + details.getBoundingClientRect().top - margin),
    );
    const distance = target - start;

    if (Math.abs(distance) < 1) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: target, behavior: "instant" });
      return;
    }

    const duration = Math.min(600, 260 + Math.abs(distance) * 0.12);
    const startedAt = performance.now();

    function animateScroll(now) {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = (1 - Math.cos(Math.PI * elapsed)) / 2;
      window.scrollTo({
        top: start + distance * eased,
        behavior: "instant",
      });
      if (elapsed < 1)
        scrollFrameRef.current = window.requestAnimationFrame(animateScroll);
      else scrollFrameRef.current = null;
    }

    scrollFrameRef.current = window.requestAnimationFrame(animateScroll);
  }

  useEffect(() => {
    const cancelOnKeydown = (event) => {
      if (scrollKeys.has(event.key)) cancelTrackScroll();
    };
    const cancelOnInput = () => cancelTrackScroll();
    const cancelOnPageHide = () => cancelTrackScroll();

    window.addEventListener("wheel", cancelOnInput, { passive: true });
    window.addEventListener("touchstart", cancelOnInput, { passive: true });
    window.addEventListener("pointerdown", cancelOnInput, { passive: true });
    window.addEventListener("keydown", cancelOnKeydown);
    window.addEventListener("pagehide", cancelOnPageHide);

    return () => {
      cancelTrackScroll();
      window.removeEventListener("wheel", cancelOnInput);
      window.removeEventListener("touchstart", cancelOnInput);
      window.removeEventListener("pointerdown", cancelOnInput);
      window.removeEventListener("keydown", cancelOnKeydown);
      window.removeEventListener("pagehide", cancelOnPageHide);
    };
  }, []);

  function selectTrack(trackId) {
    if (readOnly || state.selectedTrack === trackId) return;
    progress.selectTrack(trackId);
    setState(progress.getState());
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      scrollToTrackDetails();
    });
  }

  if (!unlocked) {
    const phaseFourAvailable = progress.isPhaseUnlocked(4);
    return (
      <TracksLocked id="tracks-locked" aria-labelledby="tracks-locked-title">
        <span className="label label--cyan">PRÓXIMA ETAPA</span>
        <h1 id="tracks-locked-title">As trilhas começam após a Fase 4.</h1>
        <p>
          Conclua o plano de testes para escolher o próximo tema. Seu progresso
          nas fases continua salvo.
        </p>
        <a
          className="button button--primary"
          href={phaseFourAvailable ? "phase4.html" : "index.html"}
        >
          {phaseFourAvailable ? "Continuar Fase 4" : "Voltar à jornada"}
        </a>
      </TracksLocked>
    );
  }

  return (
    <TracksContent id="tracks-content">
      <TracksIntro>
        <div>
          <span className="label label--cyan">DEPOIS DA BASE COMUM</span>
          <h1>Escolha sua próxima trilha.</h1>
          <p>
            As Fases 1–4 deram a base. Agora você pode explorar as áreas de QA
            no seu ritmo, sem precisar terminar uma trilha para abrir outra.
          </p>
        </div>
        <TracksSummary aria-label="Progresso geral">
          <strong>{state.totalXp} XP</strong>
          <span>XP compartilhado entre as fases e as trilhas</span>
        </TracksSummary>
      </TracksIntro>

      <section aria-labelledby="tracks-choose-title">
        <TracksSectionHeading>
          <div>
            <span className="label">TRILHAS DISPONÍVEIS PARA EXPLORAR</span>
            <h2 id="tracks-choose-title">Por onde você quer seguir?</h2>
          </div>
          <p>
            A escolha só muda a trilha em destaque. Você pode alternar quando
            quiser.
          </p>
        </TracksSectionHeading>

        <TrackGrid>
          {learningTracks.map((track) => (
            <TrackCardButton
              key={track.id}
              track={track}
              selectedTrackId={selectedTrack.id}
              readOnly={readOnly}
              onSelect={selectTrack}
            />
          ))}
        </TrackGrid>
      </section>

      <TrackDetails
        ref={detailsRef}
        id="track-details"
        aria-labelledby="track-details-title"
        aria-live="polite"
      >
        <TrackDetailsHeader>
          <div>
            <span className="label label--cyan">{selectedTrack.hub.label}</span>
            <h2 id="track-details-title">{selectedTrackTitle}</h2>
            <p>{selectedTrack.hub.objective}</p>
          </div>
          <TrackDetailsProgress>
            <strong>
              {trackProgress.completed} / {trackProgress.total}
            </strong>
            <span>temas explorados</span>
          </TrackDetailsProgress>
        </TrackDetailsHeader>
        <TrackDetailsFacts>
          <p>
            <strong>Pré-requisito</strong>
            <span>{selectedTrack.hub.prerequisite}</span>
          </p>
          <p>
            <strong>Ordem sugerida</strong>
            <span>{selectedTrack.hub.order}</span>
          </p>
        </TrackDetailsFacts>
        <TrackModules>
          {selectedTrack.modules.map((module, index) => (
            <TrackModuleItem
              key={module.id}
              module={module}
              index={index}
              completedModules={trackProgress.completedModules}
            />
          ))}
        </TrackModules>
        <p className="track-details__note">
          {readOnly
            ? "Este progresso pertence a uma versão mais recente. Atualize o QA Quest antes de selecionar uma trilha ou salvar resultados."
            : selectedTrack.hub.note}
        </p>
      </TrackDetails>
    </TracksContent>
  );
}

function TracksPage() {
  const [state, setState] = useState(() => progress.getState());

  useEffect(() => {
    const refresh = () => setState(progress.getState());
    const refreshFromStorage = (event) => {
      if (event.key === progress.storageKey || event.key === null) refresh();
    };
    const refreshWhenVisible = () => {
      if (!document.hidden) refresh();
    };

    window.addEventListener("qaquest:progress", refresh);
    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("qaquest:progress", refresh);
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return <Tracks state={state} setState={setState} />;
}

export function mountTracks(element) {
  createRoot(element).render(<TracksPage />);
}
