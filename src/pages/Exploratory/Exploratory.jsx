import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  completionXp,
  createInitialLabState,
  discoveries,
  discoveryIds,
  exploratoryReducer,
  getCartTotal,
  getDiscoveryXp,
  getStockMessage,
  isReviewComplete,
} from "../../../core/exploratory-lab.js";
import {
  AccessNotice,
  ExplorerRoot,
  ReadOnlyNotice,
} from "./Exploratory.styles.js";

const progress = window.QAQuestProgress;

function readAccess() {
  return {
    tracksUnlocked: progress.isTracksUnlocked(),
    phase4Available: progress.isPhaseUnlocked(4),
    readOnly: progress.isReadOnly(),
  };
}

function formatMoney(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Exploratory() {
  const [state, dispatch] = useReducer(
    exploratoryReducer,
    undefined,
    createInitialLabState,
  );
  const [access, setAccess] = useState(readAccess);
  const [isComplete, setIsComplete] = useState(false);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const reviewTitleRef = useRef(null);
  const reviewRef = useRef(null);
  const catalogTitleRef = useRef(null);
  const resultTitleRef = useRef(null);
  const saveStatusRef = useRef(null);
  const earnedXp = getDiscoveryXp(state);

  useEffect(() => {
    const headerXp = document.querySelector("#header-xp");
    if (headerXp) headerXp.textContent = String(earnedXp);
  }, [earnedXp]);

  useEffect(() => {
    const refreshAccess = () => setAccess(readAccess());
    const refreshFromStorage = (event) => {
      if (event.key === progress.storageKey || event.key === null)
        refreshAccess();
    };
    const refreshWhenVisible = () => {
      if (!document.hidden) refreshAccess();
    };

    window.addEventListener("qaquest:progress", refreshAccess);
    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener("pageshow", refreshAccess);
    window.addEventListener("focus", refreshAccess);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    refreshAccess();

    return () => {
      window.removeEventListener("qaquest:progress", refreshAccess);
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener("pageshow", refreshAccess);
      window.removeEventListener("focus", refreshAccess);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (state.discovered.length !== discoveryIds.length) return;
    reviewTitleRef.current?.focus();
    reviewRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
    });
  }, [state.discovered.length]);

  useEffect(() => {
    if (attemptNumber > 0) catalogTitleRef.current?.focus();
  }, [attemptNumber]);

  useEffect(() => {
    if (!isComplete) return;

    resultTitleRef.current?.focus();
    if (!savedProgress) {
      saveStatusRef.current?.reset();
      return;
    }

    if (!saveStatusRef.current)
      throw new Error("Componente de status de salvamento não encontrado.");
    saveStatusRef.current.show(savedProgress);
  }, [isComplete, savedProgress]);

  function finishInvestigation(event) {
    event.preventDefault();
    if (!isReviewComplete(state.selectedEvidence)) {
      dispatch({ type: "review-incomplete" });
      return;
    }

    setIsComplete(true);
    setSaveBlocked(false);
    setSavedProgress(null);
    saveStatusRef.current?.reset();

    if (progress.isReadOnly()) {
      setAccess(readAccess());
      setSaveBlocked(true);
      return;
    }

    let result;
    try {
      result = progress.saveMissionResult("exploratory", completionXp);
    } catch (error) {
      if (!progress.isReadOnly()) throw error;
      setAccess(readAccess());
      setSaveBlocked(true);
      return;
    }

    setSavedProgress(result);
  }

  function restartExploration() {
    dispatch({ type: "restart" });
    setIsComplete(false);
    setSaveBlocked(false);
    setSavedProgress(null);
    setAccess(readAccess());
    setAttemptNumber((current) => current + 1);
    saveStatusRef.current?.reset();
  }

  if (!access.tracksUnlocked) {
    return (
      <ExplorerRoot>
        <AccessNotice aria-labelledby="exploration-access-title">
          <span className="label label--cyan">TRILHA BLOQUEADA</span>
          <h2 id="exploration-access-title">
            Conclua a Fase 4 para continuar.
          </h2>
          <p>
            O Teste Exploratório fica disponível depois que você finalizar o
            plano de testes.
          </p>
          <a
            className="button button--primary"
            href={access.phase4Available ? "phase4.html" : "jornada.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à Jornada"}
          </a>
        </AccessNotice>
      </ExplorerRoot>
    );
  }

  return (
    <ExplorerRoot>
      <section
        className="exploratory-workspace"
        id="exploratory-workspace"
        hidden={isComplete}
      >
        <aside
          className="exploration-briefing"
          aria-labelledby="briefing-title"
        >
          <div className="exploration-heading">
            <span aria-hidden="true">⌕</span>
            <div>
              <small>MISSÃO ABERTA</small>
              <strong id="briefing-title">Carrinho Fikily</strong>
            </div>
          </div>
          <section>
            <span>OBJETIVO</span>
            <p>
              Explorar o fluxo de compra e encontrar comportamentos que coloquem
              pedido, desconto ou dados de entrega em risco.
            </p>
          </section>
          <section>
            <span>HEURÍSTICAS PARA COMEÇAR</span>
            <ul>
              <li>Varie quantidade, ritmo e ordem das ações.</li>
              <li>Teste o que acontece ao desfazer uma ação.</li>
              <li>Use dados incomuns nos campos.</li>
              <li>Observe mensagens, totais e persistência.</li>
            </ul>
          </section>
          <div className="exploration-tip">
            <strong>Sem roteiro fixo</strong>
            <p>
              Você decide por onde explorar. A missão registra os sinais
              relevantes conforme eles aparecem.
            </p>
          </div>
        </aside>

        <section className="shop-panel" aria-label="Loja Fikily simulada">
          <div className="shop-browser">
            <div className="shop-browser__bar" aria-hidden="true">
              <span className="browser-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="shop-address">
                fikily.test/{state.view === "catalog" ? "catalog" : state.view}
              </span>
              <span>↻</span>
            </div>
            <div className="shop-app">
              <header className="shop-nav">
                <strong>
                  <b>F</b> Fikily
                </strong>
                <nav aria-label="Navegação da loja">
                  <button
                    type="button"
                    data-view="catalog"
                    aria-pressed={state.view === "catalog"}
                    onClick={() =>
                      dispatch({ type: "set-view", view: "catalog" })
                    }
                  >
                    Produtos
                  </button>
                  <button
                    type="button"
                    data-view="cart"
                    aria-pressed={state.view === "cart"}
                    onClick={() => dispatch({ type: "set-view", view: "cart" })}
                  >
                    Carrinho <span>{state.quantity}</span>
                  </button>
                  <button
                    type="button"
                    data-view="checkout"
                    aria-pressed={state.view === "checkout"}
                    onClick={() =>
                      dispatch({ type: "set-view", view: "checkout" })
                    }
                  >
                    Checkout
                  </button>
                </nav>
              </header>

              <section
                className="shop-view"
                data-shop-view="catalog"
                hidden={state.view !== "catalog"}
              >
                <span className="shop-kicker">COLEÇÃO DE FIM DE SEMANA</span>
                <h2 ref={catalogTitleRef} tabIndex={-1}>
                  Itens para testar o carrinho.
                </h2>
                <article className="product-card">
                  <div className="product-visual" aria-hidden="true">
                    ◒
                  </div>
                  <div>
                    <span>MOCHILA URBANA</span>
                    <strong>R$ 189,90</strong>
                    <p>Estoque informado: 5 unidades.</p>
                    <button
                      className="shop-button"
                      id="add-product"
                      type="button"
                      onClick={() => dispatch({ type: "add-product" })}
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                </article>
              </section>

              <section
                className="shop-view"
                data-shop-view="cart"
                hidden={state.view !== "cart"}
              >
                <span className="shop-kicker">SEU CARRINHO</span>
                <h2>Revise seu pedido.</h2>
                <div className="cart-item">
                  <div>
                    <strong>Mochila Urbana</strong>
                    <small>R$ 189,90 por unidade</small>
                  </div>
                  <div className="quantity-control">
                    <button
                      id="decrease-quantity"
                      type="button"
                      aria-label="Diminuir quantidade"
                      onClick={() => dispatch({ type: "decrease-quantity" })}
                    >
                      −
                    </button>
                    <strong>{state.quantity}</strong>
                    <button
                      id="increase-quantity"
                      type="button"
                      aria-label="Aumentar quantidade"
                      onClick={() => dispatch({ type: "increase-quantity" })}
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="stock-message" id="stock-message">
                  {getStockMessage(state.quantity)}
                </p>
                <div className="coupon-box">
                  <label htmlFor="coupon-input">Cupom</label>
                  <div>
                    <input
                      id="coupon-input"
                      type="text"
                      placeholder="Ex.: FVR10"
                      value={state.couponInput}
                      onChange={(event) =>
                        dispatch({
                          type: "set-coupon-input",
                          value: event.target.value,
                        })
                      }
                    />
                    <button
                      id="apply-coupon"
                      type="button"
                      onClick={() => dispatch({ type: "apply-coupon" })}
                    >
                      Aplicar
                    </button>
                  </div>
                  <small id="coupon-message" role="status" aria-live="polite">
                    {state.couponMessage}
                  </small>
                  {state.removeCouponVisible && (
                    <button
                      className="text-button"
                      id="remove-coupon"
                      type="button"
                      onClick={() => dispatch({ type: "remove-coupon" })}
                    >
                      Remover cupom
                    </button>
                  )}
                </div>
                <div className="cart-total">
                  <span>Total</span>
                  <strong>{formatMoney(getCartTotal(state))}</strong>
                </div>
                <button
                  className="shop-button"
                  data-view="checkout"
                  type="button"
                  onClick={() =>
                    dispatch({ type: "set-view", view: "checkout" })
                  }
                >
                  Ir para checkout →
                </button>
              </section>

              <section
                className="shop-view"
                data-shop-view="checkout"
                hidden={state.view !== "checkout"}
              >
                <span className="shop-kicker">ENTREGA E PAGAMENTO</span>
                <h2>Finalize seu pedido.</h2>
                <label className="checkout-field" htmlFor="address-input">
                  Endereço de entrega
                  <input
                    id="address-input"
                    type="text"
                    placeholder="Rua, número e complemento"
                    value={state.address}
                    onChange={(event) =>
                      dispatch({
                        type: "set-address",
                        value: event.target.value,
                      })
                    }
                    onBlur={() => dispatch({ type: "inspect-address" })}
                  />
                </label>
                <label className="checkout-field" htmlFor="cep-input">
                  CEP
                  <input
                    id="cep-input"
                    type="text"
                    placeholder="00000-000"
                    value={state.cep}
                    onChange={(event) =>
                      dispatch({ type: "set-cep", value: event.target.value })
                    }
                  />
                </label>
                <small
                  className="checkout-message"
                  id="checkout-message"
                  role="status"
                  aria-live="polite"
                >
                  {state.checkoutMessage}
                </small>
                <button
                  className="shop-button"
                  id="finish-order"
                  type="button"
                  onClick={() => dispatch({ type: "finish-order" })}
                >
                  Finalizar compra
                </button>
              </section>
            </div>
          </div>
          <button
            className="simulated-refresh"
            id="simulate-refresh"
            type="button"
            onClick={() => dispatch({ type: "simulated-refresh" })}
          >
            ↻ Simular atualização da página
          </button>
        </section>

        <aside className="evidence-panel" aria-labelledby="evidence-title">
          <div className="evidence-progress">
            <div>
              <span>EVIDÊNCIAS ENCONTRADAS</span>
              <strong>
                {state.discovered.length} / {discoveryIds.length}
              </strong>
            </div>
            <div
              role="progressbar"
              aria-label="Evidências encontradas"
              aria-valuemin="0"
              aria-valuemax={discoveryIds.length}
              aria-valuenow={state.discovered.length}
            >
              <i
                style={{
                  width: `${(state.discovered.length / discoveryIds.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <section className="exploration-task">
            <span>SEU FOCO</span>
            <h2 id="evidence-title">Explore antes de concluir.</h2>
            <p>
              Teste diferentes caminhos da loja. Quando achar um comportamento
              suspeito, ele aparecerá no quadro de evidências.
            </p>
          </section>
          <section
            className="evidence-list"
            aria-live="polite"
            aria-label="Evidências encontradas"
            id="evidence-list"
          >
            {state.discovered.length === 0 ? (
              <p className="evidence-list__empty">
                Nenhuma evidência registrada ainda.
              </p>
            ) : (
              state.discovered.map((id) => (
                <article className="evidence-item" data-evidence={id} key={id}>
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>{discoveries[id].title}</strong>
                    <p>{discoveries[id].detail}</p>
                  </div>
                </article>
              ))
            )}
          </section>
          {state.discovered.length === discoveryIds.length && (
            <form
              className="evidence-review"
              id="evidence-review"
              ref={reviewRef}
              onSubmit={finishInvestigation}
            >
              <div>
                <span>REVISÃO FINAL</span>
                <strong ref={reviewTitleRef} tabIndex={-1}>
                  Quais evidências merecem reporte?
                </strong>
              </div>
              <p>
                Selecione os comportamentos que representam defeitos reais antes
                de fechar a investigação.
              </p>
              <div role="group" aria-label="Evidências para reportar">
                {discoveryIds.map((id) => (
                  <label className="review-option" key={id}>
                    <input
                      type="checkbox"
                      name="evidence"
                      value={id}
                      checked={state.selectedEvidence.includes(id)}
                      onChange={() => dispatch({ type: "toggle-evidence", id })}
                    />
                    <span>{discoveries[id].title}</span>
                  </label>
                ))}
              </div>
              {state.reviewError && (
                <p id="review-error" role="alert">
                  {state.reviewError}
                </p>
              )}
              <button className="button button--primary" type="submit">
                Concluir investigação
              </button>
            </form>
          )}
        </aside>
      </section>

      {access.readOnly && !isComplete && (
        <ReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </ReadOnlyNotice>
      )}

      <section
        className="exploratory-result"
        id="exploratory-result"
        hidden={!isComplete}
        aria-labelledby="result-title"
      >
        <div className="exploratory-result__icon" aria-hidden="true">
          ✓
        </div>
        <span className="label label--cyan">EXPLORAÇÃO CONCLUÍDA</span>
        <h2 id="result-title" ref={resultTitleRef} tabIndex={-1}>
          Você transformou curiosidade em evidência.
        </h2>
        <p>
          Você variou ações, encontrou falhas de estoque, desconto, endereço e
          checkout, e transformou os sinais em evidências reportáveis.
        </p>
        <qa-save-status ref={saveStatusRef}></qa-save-status>
        {saveBlocked && (
          <ReadOnlyNotice role="status" aria-live="polite">
            Resultado calculado, mas não salvo. Atualize o QA Quest antes de
            salvar o progresso.
          </ReadOnlyNotice>
        )}
        <div className="exploratory-result__stats">
          <div>
            <span>EVIDÊNCIAS</span>
            <strong>
              {state.discovered.length} / {discoveryIds.length}
            </strong>
          </div>
          <div>
            <span>DECISÃO</span>
            <strong>
              {state.selectedEvidence.length} / {discoveryIds.length}
            </strong>
          </div>
          <div>
            <span>EXPERIÊNCIA</span>
            <strong>
              <span>{completionXp}</span> XP
            </strong>
          </div>
        </div>
        <div className="exploratory-result__actions">
          <button
            className="button button--primary"
            id="restart-exploration"
            type="button"
            onClick={restartExploration}
          >
            Explorar novamente
          </button>
          <a className="button button--ghost" href="tracks.html">
            Voltar às trilhas
          </a>
        </div>
      </section>
    </ExplorerRoot>
  );
}

export function mountExploratory(element) {
  createRoot(element).render(<Exploratory />);
}
