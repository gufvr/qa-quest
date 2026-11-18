import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createMissionQuestions,
  summarizeCompetencies,
} from "../../../core/phase2-quiz.js";
import { QuizContent, ReadOnlyNotice } from "./Phase2.styles.js";

const progress = window.QAQuestProgress;

function getResultMessage(correctAnswers, totalQuestions) {
  if (correctAnswers === totalQuestions) {
    return "Excelente investigação. Você transformou um texto vago em fluxos, critérios e perguntas capazes de orientar o time.";
  }
  if (correctAnswers >= 7) {
    return "Boa análise. Você encontrou as principais lacunas; o resumo abaixo mostra onde aprofundar sua revisão.";
  }
  return "O requisito ainda esconde riscos importantes. Revise o diagnóstico por competência e faça uma nova análise.";
}

function Phase2() {
  const [questions, setQuestions] = useState(() => createMissionQuestions());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [answerResults, setAnswerResults] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [xp, setXp] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [readOnly, setReadOnly] = useState(() => progress.isReadOnly());
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const questionTitleRef = useRef(null);
  const resultTitleRef = useRef(null);
  const nextButtonRef = useRef(null);
  const saveStatusRef = useRef(null);
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage =
    ((currentQuestionIndex + 1) / questions.length) * 100;
  const competencyScores = summarizeCompetencies(questions, answerResults);
  const feedbackClassName = answerFeedback
    ? `answer-feedback ${answerFeedback.isCorrect ? "is-correct" : "is-wrong"}`
    : "answer-feedback";

  useEffect(() => {
    const headerXp = document.querySelector("#header-xp");
    if (headerXp) headerXp.textContent = String(xp);
  }, [xp]);

  useEffect(() => {
    const refreshReadOnly = () => setReadOnly(progress.isReadOnly());
    const refreshFromStorage = (event) => {
      if (event.key === progress.storageKey || event.key === null)
        refreshReadOnly();
    };
    const refreshWhenVisible = () => {
      if (!document.hidden) refreshReadOnly();
    };

    window.addEventListener("qaquest:progress", refreshReadOnly);
    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener("pageshow", refreshReadOnly);
    window.addEventListener("focus", refreshReadOnly);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("qaquest:progress", refreshReadOnly);
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener("pageshow", refreshReadOnly);
      window.removeEventListener("focus", refreshReadOnly);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (currentQuestionIndex > 0 || attemptNumber > 0)
      questionTitleRef.current?.focus();
  }, [currentQuestionIndex, attemptNumber]);

  useEffect(() => {
    if (answerFeedback) nextButtonRef.current?.focus();
  }, [answerFeedback]);

  useEffect(() => {
    if (isComplete) resultTitleRef.current?.focus();
  }, [isComplete]);

  function confirmAnswer() {
    if (selectedAnswer === null || answerFeedback) return;

    const isCorrect = selectedAnswer === currentQuestion.correct;
    setAnswerFeedback({
      isCorrect,
      explanation: currentQuestion.explanation,
    });
    setAnswerResults((current) => [...current, isCorrect]);

    if (isCorrect) {
      setCorrectAnswers((current) => current + 1);
      setXp((current) => current + 10);
    }
  }

  function finishMission() {
    setIsComplete(true);
    setSaveBlocked(false);
    saveStatusRef.current?.reset();

    if (progress.isReadOnly()) {
      setReadOnly(true);
      setSaveBlocked(true);
      return;
    }

    let savedProgress;
    try {
      savedProgress = progress.saveMissionResult("phase2", xp);
    } catch (error) {
      if (!progress.isReadOnly()) throw error;
      setReadOnly(true);
      setSaveBlocked(true);
      return;
    }

    if (!saveStatusRef.current)
      throw new Error("Componente de status de salvamento não encontrado.");
    saveStatusRef.current.show(savedProgress);
  }

  function goToNextQuestion() {
    if (!answerFeedback) return;

    if (currentQuestionIndex === questions.length - 1) {
      finishMission();
      return;
    }

    setCurrentQuestionIndex((current) => current + 1);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
  }

  function restartMission() {
    setQuestions(createMissionQuestions());
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setAnswerResults([]);
    setCorrectAnswers(0);
    setXp(0);
    setIsComplete(false);
    setReadOnly(progress.isReadOnly());
    setSaveBlocked(false);
    setAttemptNumber((current) => current + 1);
    saveStatusRef.current?.reset();
  }

  return (
    <QuizContent>
      <div id="quiz-screen" hidden={isComplete}>
        <header className="quiz-card__header">
          <div>
            <span className="label">PROGRESSO DA ANÁLISE</span>
            <strong>
              Questão {currentQuestionIndex + 1} de {questions.length}
            </strong>
          </div>
          <span className="quiz-card__reward">+10 XP</span>
        </header>

        <div className="mission-progress" aria-hidden="true">
          <span style={{ width: `${progressPercentage}%` }} />
        </div>

        {readOnly && (
          <ReadOnlyNotice role="status" aria-live="polite">
            O progresso pertence a uma versão mais recente. Você pode concluir
            a missão, mas o resultado não será salvo.
          </ReadOnlyNotice>
        )}

        <div className="question-area">
          <span className="question-kind">{currentQuestion.kind}</span>
          <h2 id="question-title" ref={questionTitleRef} tabIndex={-1}>
            {currentQuestion.question}
          </h2>
          <p id="question-context">{currentQuestion.context}</p>
          <div
            className="answers"
            role="group"
            aria-labelledby="question-title"
            aria-describedby="question-context"
          >
            {currentQuestion.options.map((optionText, index) => {
              const isSelected =
                answerFeedback === null && selectedAnswer === index;
              const isCorrect =
                answerFeedback !== null && index === currentQuestion.correct;
              const isWrong =
                answerFeedback !== null &&
                index === selectedAnswer &&
                !answerFeedback.isCorrect;
              const className = [
                "answer-option",
                isSelected && "is-selected",
                isCorrect && "is-correct",
                isWrong && "is-wrong",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={`${index}-${optionText}`}
                  className={className}
                  type="button"
                  aria-pressed={selectedAnswer === index}
                  disabled={answerFeedback !== null}
                  onClick={() => setSelectedAnswer(index)}
                >
                  <span className="answer-option__letter" aria-hidden="true">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="answer-option__text">{optionText}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={feedbackClassName}
          role="status"
          aria-live="polite"
          hidden={!answerFeedback}
        >
          <span className="answer-feedback__icon" aria-hidden="true">
            {answerFeedback?.isCorrect ? "✓" : "!"}
          </span>
          <div>
            <strong>
              {answerFeedback?.isCorrect
                ? "+10 XP · Boa análise!"
                : "Existe uma análise mais forte"}
            </strong>
            <p>{answerFeedback?.explanation}</p>
          </div>
        </div>

        <footer className="quiz-card__footer">
          <span>
            {answerFeedback
              ? answerFeedback.isCorrect
                ? "Você reduziu uma incerteza do requisito."
                : "Use o feedback para revisar sua linha de raciocínio."
              : selectedAnswer === null
                ? "Selecione a melhor análise para continuar."
                : "Análise selecionada. Confirme quando estiver pronto."}
          </span>
          {answerFeedback ? (
            <button
              className="button button--primary"
              type="button"
              ref={nextButtonRef}
              onClick={goToNextQuestion}
            >
              {currentQuestionIndex === questions.length - 1
                ? "Ver diagnóstico"
                : "Próxima análise"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              className="button button--primary"
              type="button"
              disabled={selectedAnswer === null}
              onClick={confirmAnswer}
            >
              Confirmar análise
            </button>
          )}
        </footer>
      </div>

      <div
        className="result-screen phase-result"
        id="result-screen"
        aria-labelledby="result-title"
        hidden={!isComplete}
      >
        <div className="result-screen__symbol" aria-hidden="true">
          ◈
        </div>
        <span className="label label--cyan">ANÁLISE CONCLUÍDA</span>
        <h2 id="result-title" ref={resultTitleRef} tabIndex={-1}>
          Requisito investigado!
        </h2>
        <p>{getResultMessage(correctAnswers, questions.length)}</p>
        <qa-save-status ref={saveStatusRef}></qa-save-status>
        {saveBlocked && (
          <ReadOnlyNotice role="status" aria-live="polite">
            Resultado calculado, mas não salvo. Atualize o QA Quest antes de
            salvar o progresso.
          </ReadOnlyNotice>
        )}

        <div className="result-score">
          <div>
            <span>ACERTOS</span>
            <strong>
              {correctAnswers} / {questions.length}
            </strong>
          </div>
          <div>
            <span>EXPERIÊNCIA</span>
            <strong>
              <span>{xp}</span> XP
            </strong>
          </div>
        </div>

        <section
          className="competency-summary"
          aria-labelledby="competency-title"
        >
          <h3 id="competency-title">Resumo por competência</h3>
          <div>
            {competencyScores.map((score) => (
              <div className="competency-row" key={score.category}>
                <span>{score.category}</span>
                <div
                  className="competency-row__track"
                  role="progressbar"
                  aria-label={`Acertos em ${score.category}`}
                  aria-valuenow={score.correct}
                  aria-valuemin={0}
                  aria-valuemax={score.total}
                >
                  <i style={{ width: `${score.percentage}%` }} />
                </div>
                <strong>
                  {score.correct}/{score.total}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <div className="result-actions">
          <a className="button button--primary" href="phase3.html">
            Entrar no Simulador
          </a>
          <button
            className="button button--ghost"
            type="button"
            onClick={restartMission}
          >
            Analisar novamente
          </button>
          <a className="button button--text" href="index.html">
            Voltar à jornada
          </a>
        </div>
      </div>
    </QuizContent>
  );
}

export function mountPhase2(element) {
  createRoot(element).render(<Phase2 />);
}
