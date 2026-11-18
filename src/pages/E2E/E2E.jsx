import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  E2E_ORDER_ID,
  E2E_STEP_IDS,
  createInitialE2EState,
  e2eJourneyReducer,
  e2eInstructions,
  formatE2EMoney,
  getE2ECartTotals,
  getE2EFinding,
  getE2EScore,
  getE2EViewPath,
  getE2EReviewOptions,
  validateE2EDelivery,
} from "../../../core/e2e-journey.js";
import { E2EReadOnlyNotice, E2ERoot } from "./E2E.styles.js";

const progress = window.QAQuestProgress;
const stepLabels = {
  catalog: ["Produto", "Escolha a mochila indicada."],
  cart: ["Carrinho", "Aplique o cupom FVR10."],
  delivery: ["Entrega", "Informe endereço e CEP."],
  payment: ["Pagamento", "Simule uma compra aprovada."],
  order: ["Pedido", "Compare aprovação e status."],
  post: ["Pós-compra", "Revise a confirmação recebida."],
};

function readAccess() {
  return {
    tracksUnlocked: progress.isTracksUnlocked(),
    phase4Available: progress.isPhaseUnlocked(4),
    readOnly: progress.isReadOnly(),
  };
}

function OrderDetails({ quantity, delivery, methodLabel }) {
  return (
    <dl className="order-details">
      <div>
        <dt>Produto</dt>
        <dd>Mochila Urbana × {quantity}</dd>
      </div>
      <div>
        <dt>Cupom</dt>
        <dd>FVR10 · 10%</dd>
      </div>
      <div>
        <dt>Entrega</dt>
        <dd>{delivery.address}</dd>
      </div>
      <div>
        <dt>CEP</dt>
        <dd>{delivery.cep}</dd>
      </div>
      {methodLabel && (
        <div>
          <dt>Pagamento</dt>
          <dd>{methodLabel}</dd>
        </div>
      )}
    </dl>
  );
}

function FindingCard({ id, state }) {
  const finding = getE2EFinding(id, state);

  return (
    <article className="finding-item" data-finding={id}>
      <span aria-hidden="true">!</span>
      <div>
        <strong>{finding.title}</strong>
        <p>
          <b>Esperado: </b>
          {finding.expected}
        </p>
        <p>
          <b>Obtido: </b>
          {finding.observed}
        </p>
        <p>
          <b>Impacto: </b>
          {finding.impact}
        </p>
      </div>
    </article>
  );
}

function CatalogView({ dispatch }) {
  return (
    <section className="e2e-view" data-e2e-view="catalog">
      <span className="store-kicker">CATÁLOGO</span>
      <h2 tabIndex={-1}>Escolha o item da jornada.</h2>
      <article className="e2e-product">
        <div aria-hidden="true">◒</div>
        <section>
          <span>MOCHILA URBANA</span>
          <strong>R$ 189,90</strong>
          <p>Entrega em até 3 dias úteis.</p>
          <button
            className="store-button"
            id="add-e2e-product"
            type="button"
            onClick={() => dispatch({ type: "add-product" })}
          >
            Adicionar ao carrinho
          </button>
        </section>
      </article>
    </section>
  );
}

function CartView({ state, dispatch }) {
  const { subtotal, total } = getE2ECartTotals(
    state.quantity,
    state.couponApplied,
  );

  return (
    <section className="e2e-view" data-e2e-view="cart">
      <span className="store-kicker">CARRINHO</span>
      <h2 tabIndex={-1}>Confirme os dados antes de avançar.</h2>
      <div className="summary-row">
        <span>
          Mochila Urbana
          <small>R$ 189,90 por unidade</small>
        </span>
        <strong id="cart-subtotal">{formatE2EMoney(subtotal)}</strong>
      </div>
      <label className="store-field quantity-field" htmlFor="e2e-quantity">
        Quantidade
        <select
          id="e2e-quantity"
          value={state.quantity}
          onChange={(event) =>
            dispatch({ type: "set-quantity", value: event.target.value })
          }
        >
          <option value="1">1 unidade</option>
          <option value="2">2 unidades</option>
          <option value="3">3 unidades</option>
        </select>
      </label>
      <div className="coupon-control">
        <label htmlFor="e2e-coupon">Cupom de desconto</label>
        <div>
          <input
            id="e2e-coupon"
            type="text"
            placeholder="Digite FVR10"
            value={state.coupon}
            onChange={(event) =>
              dispatch({ type: "set-coupon", value: event.target.value })
            }
          />
          <button
            type="button"
            onClick={() => dispatch({ type: "apply-coupon" })}
          >
            Aplicar
          </button>
        </div>
        <small id="coupon-feedback" role="status">
          {state.couponFeedback}
        </small>
      </div>
      <div className="store-total">
        <span>Total do carrinho</span>
        <strong id="cart-summary-total">{formatE2EMoney(total)}</strong>
      </div>
      <button
        className="store-button"
        id="to-delivery"
        type="button"
        onClick={() => dispatch({ type: "continue-to-delivery" })}
      >
        Continuar para entrega →
      </button>
    </section>
  );
}

function DeliveryView({
  state,
  dispatch,
  addressRef,
  cepRef,
  comparisonButtonRef,
}) {
  function continueToPayment() {
    const { addressValid, cepValid } = validateE2EDelivery(
      state.deliveryAddress,
      state.deliveryCep,
    );
    dispatch({ type: "continue-to-payment" });
    if (!addressValid) addressRef.current?.focus();
    else if (!cepValid) cepRef.current?.focus();
    else if (!state.findings.includes("discount"))
      comparisonButtonRef.current?.focus();
  }

  return (
    <section className="e2e-view" data-e2e-view="delivery">
      <span className="store-kicker">ENTREGA</span>
      <h2 tabIndex={-1}>Onde este pedido será entregue?</h2>
      <div className="reference-total">
        <span>Total confirmado no carrinho</span>
        <strong id="cart-reference-total">
          {formatE2EMoney(state.cartSnapshot.total)}
        </strong>
      </div>
      <p className="store-note">
        Frete grátis. O cupom deve continuar válido em todas as etapas.
      </p>
      <label className="store-field" htmlFor="delivery-address">
        Endereço fictício
        <input
          ref={addressRef}
          id="delivery-address"
          type="text"
          autoComplete="off"
          placeholder="Rua Fikily, 101"
          maxLength={160}
          value={state.deliveryAddress}
          aria-invalid={state.addressInvalid}
          onChange={(event) =>
            dispatch({
              type: "set-delivery-address",
              value: event.target.value,
            })
          }
        />
      </label>
      <label className="store-field" htmlFor="delivery-cep">
        CEP fictício
        <input
          ref={cepRef}
          id="delivery-cep"
          type="text"
          autoComplete="off"
          inputMode="numeric"
          placeholder="01001-000"
          maxLength={9}
          value={state.deliveryCep}
          aria-invalid={state.cepInvalid}
          onChange={(event) =>
            dispatch({ type: "set-delivery-cep", value: event.target.value })
          }
        />
      </label>
      <div className="store-total store-total--checkout">
        <span>Total no checkout</span>
        <strong id="checkout-summary-total">
          {formatE2EMoney(state.checkoutTotal)}
        </strong>
      </div>
      <small id="delivery-message" className="store-message" role="status">
        {state.deliveryMessage}
      </small>
      <button
        className="store-button"
        id="to-payment"
        type="button"
        onClick={continueToPayment}
      >
        Escolher pagamento →
      </button>
    </section>
  );
}

function PaymentView({ state, dispatch }) {
  return (
    <section className="e2e-view" data-e2e-view="payment">
      <span className="store-kicker">PAGAMENTO</span>
      <h2 tabIndex={-1}>Selecione uma forma de pagamento.</h2>
      <div id="payment-details">
        <OrderDetails
          quantity={state.cartSnapshot.quantity}
          delivery={state.delivery}
        />
      </div>
      <fieldset className="payment-options">
        <legend>Forma de pagamento simulada</legend>
        <label className="payment-option">
          <input
            name="payment"
            type="radio"
            value="pix"
            checked={state.paymentMethod === "pix"}
            onChange={(event) =>
              dispatch({
                type: "set-payment-method",
                value: event.target.value,
              })
            }
          />
          <span>
            <strong>Pix simulado</strong>
            <small>Aprovação imediata</small>
          </span>
        </label>
        <label className="payment-option">
          <input
            name="payment"
            type="radio"
            value="card"
            checked={state.paymentMethod === "card"}
            onChange={(event) =>
              dispatch({
                type: "set-payment-method",
                value: event.target.value,
              })
            }
          />
          <span>
            <strong>Cartão de teste</strong>
            <small>Final 4242 · sem dados reais</small>
          </span>
        </label>
      </fieldset>
      <div className="store-total">
        <span>Valor para pagamento</span>
        <strong id="payment-summary-total">
          {formatE2EMoney(state.checkoutTotal)}
        </strong>
      </div>
      <button
        className="store-button"
        id="approve-payment"
        type="button"
        onClick={() => dispatch({ type: "approve-payment" })}
      >
        Pagar e concluir pedido
      </button>
    </section>
  );
}

function OrderView({ state, dispatch, comparisonButtonRef }) {
  function continueToPost() {
    dispatch({ type: "continue-to-post" });
    if (!state.findings.includes("payment"))
      comparisonButtonRef.current?.focus();
  }

  return (
    <section className="e2e-view" data-e2e-view="order">
      <span className="store-kicker">PEDIDO CRIADO</span>
      <h2 tabIndex={-1}>Pedido #{E2E_ORDER_ID} criado.</h2>
      <div className="order-status">
        <span id="payment-status">{state.order.status}</span>
        <p id="payment-result">
          {state.order.methodLabel} · pagamento{" "}
          {state.order.paymentStatus.toLowerCase()}.
        </p>
      </div>
      <div id="order-details">
        <OrderDetails
          quantity={state.order.quantity}
          delivery={state.order.delivery}
          methodLabel={state.order.methodLabel}
        />
      </div>
      <div className="summary-row">
        <span>Total do pedido</span>
        <strong id="order-summary-total">
          {formatE2EMoney(state.order.total)}
        </strong>
      </div>
      <button
        className="store-button"
        id="to-post-purchase"
        type="button"
        onClick={continueToPost}
      >
        Ver confirmação pós-compra →
      </button>
    </section>
  );
}

function PostPurchaseView({ state, dispatch, comparisonButtonRef }) {
  function openReview() {
    dispatch({ type: "open-review" });
    if (!state.findings.includes("confirmation"))
      comparisonButtonRef.current?.focus();
  }

  return (
    <section className="e2e-view" data-e2e-view="post">
      <span className="store-kicker">CONFIRMAÇÃO ENVIADA</span>
      <h2 tabIndex={-1}>E-mail para cliente@fikily.test</h2>
      <article className="email-preview">
        <strong>Recebemos seu pedido!</strong>
        <p>Pedido #{E2E_ORDER_ID} · Fikily</p>
        <div id="email-details">
          <OrderDetails
            quantity={state.order.quantity}
            delivery={state.order.delivery}
            methodLabel={state.order.methodLabel}
          />
        </div>
        <div>
          <span>Total informado no e-mail</span>
          <strong id="email-summary-total">
            {formatE2EMoney(state.order.total + 1800)}
          </strong>
        </div>
      </article>
      <div className="reference-total">
        <span>Total registrado no pedido</span>
        <strong id="order-reference-total">
          {formatE2EMoney(state.order.total)}
        </strong>
      </div>
      <button
        className="store-button"
        id="open-e2e-review"
        type="button"
        onClick={openReview}
      >
        Revisar evidências →
      </button>
    </section>
  );
}

function E2E() {
  const [state, dispatch] = useReducer(
    e2eJourneyReducer,
    undefined,
    createInitialE2EState,
  );
  const [access, setAccess] = useState(readAccess);
  const [savedProgress, setSavedProgress] = useState(null);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const rootRef = useRef(null);
  const saveStatusRef = useRef(null);
  const comparisonButtonRef = useRef(null);
  const addressRef = useRef(null);
  const cepRef = useRef(null);
  const reviewErrorRef = useRef(null);
  const previousViewRef = useRef(state.currentView);
  const earnedXp = getE2EScore(state);
  const comparisonId =
    state.currentView === "delivery"
      ? "discount"
      : state.currentView === "order"
        ? "payment"
        : state.currentView === "post"
          ? "confirmation"
          : null;

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

    return () => {
      window.removeEventListener("qaquest:progress", refreshAccess);
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener("pageshow", refreshAccess);
      window.removeEventListener("focus", refreshAccess);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    const viewChanged = previousViewRef.current !== state.currentView;
    previousViewRef.current = state.currentView;
    if (viewChanged || attemptNumber > 0)
      rootRef.current
        ?.querySelector(`[data-e2e-view="${state.currentView}"] h2`)
        ?.focus();
  }, [state.currentView, attemptNumber]);

  useEffect(() => {
    if (state.reviewOpen)
      rootRef.current?.querySelector("#e2e-review-options input")?.focus();
  }, [state.reviewOpen]);

  useEffect(() => {
    if (state.reviewError) reviewErrorRef.current?.focus();
  }, [state.reviewError]);

  useEffect(() => {
    if (!state.finished) return;
    rootRef.current?.querySelector("#e2e-result-title")?.focus();
    if (!savedProgress) {
      saveStatusRef.current?.reset();
      return;
    }
    if (!saveStatusRef.current)
      throw new Error("Componente de status de salvamento não encontrado.");
    saveStatusRef.current.show(savedProgress);
  }, [state.finished, savedProgress]);

  function submitReview(event) {
    event.preventDefault();
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }

    const nextState = e2eJourneyReducer(state, { type: "submit-review" });
    if (nextState.finished && !state.finished) {
      setSaveBlocked(false);
      setSavedProgress(null);
      saveStatusRef.current?.reset();

      if (progress.isReadOnly()) {
        setAccess(readAccess());
        setSaveBlocked(true);
      } else {
        let result;
        try {
          result = progress.saveMissionResult("e2e", getE2EScore(nextState));
        } catch (error) {
          if (!progress.isReadOnly()) throw error;
          setAccess(readAccess());
          setSaveBlocked(true);
        }
        if (result) setSavedProgress(result);
      }
    }

    dispatch({ type: "submit-review" });
  }

  function restartMission() {
    if (!progress.isTracksUnlocked()) {
      setAccess(readAccess());
      return;
    }
    setSavedProgress(null);
    setSaveBlocked(false);
    saveStatusRef.current?.reset();
    setAccess(readAccess());
    setAttemptNumber((current) => current + 1);
    dispatch({ type: "restart" });
  }

  function submitComparison(event) {
    event.preventDefault();
    dispatch({
      type: "submit-comparison",
      value: event.nativeEvent.submitter?.value,
    });
  }

  if (!access.tracksUnlocked)
    return (
      <E2ERoot ref={rootRef}>
        <section className="e2e-locked" aria-labelledby="e2e-locked-title">
          <span className="label label--cyan">BASE COMUM</span>
          <h1 id="e2e-locked-title">
            Conclua a Fase 4 para iniciar esta missão.
          </h1>
          <p>
            O simulador E2E faz parte das trilhas disponíveis após o plano de
            testes.
          </p>
          <a
            className="button button--primary"
            href={access.phase4Available ? "phase4.html" : "index.html"}
          >
            {access.phase4Available ? "Continuar Fase 4" : "Voltar à jornada"}
          </a>
        </section>
        <qa-support-material mission-id="e2e"></qa-support-material>
      </E2ERoot>
    );

  return (
    <E2ERoot ref={rootRef}>
      {access.readOnly && (
        <E2EReadOnlyNotice role="status" aria-live="polite">
          O progresso pertence a uma versão mais recente. Você pode concluir a
          missão, mas o resultado não será salvo.
        </E2EReadOnlyNotice>
      )}
      <qa-support-material mission-id="e2e"></qa-support-material>

      <header className="e2e-intro">
        <div>
          <span className="label label--cyan">
            TRILHA 01 · FLUXOS E INVESTIGAÇÃO
          </span>
          <h1>Jornada End-to-End</h1>
        </div>
        <p>
          Acompanhe a compra da Fikily do catálogo à confirmação pós-compra e
          compare cada estado com o que o cliente deveria receber.
        </p>
      </header>

      <section
        className="e2e-workspace"
        id="e2e-workspace"
        hidden={state.finished}
      >
        <aside className="journey-panel" aria-labelledby="journey-title">
          <div className="journey-panel__heading">
            <span aria-hidden="true">↝</span>
            <div>
              <small>JORNADA DO CLIENTE</small>
              <strong id="journey-title">Compra de uma mochila</strong>
            </div>
          </div>
          <ol className="journey-steps">
            {E2E_STEP_IDS.map((id, index) => (
              <li
                key={id}
                data-step={id}
                className={[
                  state.checkpoints.includes(id) ? "is-complete" : "",
                  state.currentView === id ? "is-current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={state.currentView === id ? "step" : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{stepLabels[id][0]}</strong>
                  <small>{stepLabels[id][1]}</small>
                </div>
              </li>
            ))}
          </ol>
          <div className="journey-panel__tip">
            <strong>O que valida um E2E?</strong>
            <p>
              O mesmo pedido precisa manter dados e estados coerentes em todas
              as etapas. Use apenas dados fictícios nesta simulação.
            </p>
            <p>
              Até 100 XP: 60 pela execução, 30 pelas comparações e 10 pela
              revisão. Novas tentativas de resposta valem metade dos pontos da
              pergunta.
            </p>
          </div>
        </aside>

        <section className="e2e-app-panel" aria-label="Loja Fikily simulada">
          <div className="e2e-browser">
            <div className="e2e-browser__bar" aria-hidden="true">
              <span className="browser-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span id="e2e-address">
                fikily.test/{getE2EViewPath(state.currentView)}
              </span>
              <span>↻</span>
            </div>
            <div className="e2e-store">
              <header className="e2e-store__nav">
                <strong>
                  <b>F</b> Fikily
                </strong>
                <span id="order-chip">
                  {state.order
                    ? `Pedido #${state.order.id}`
                    : "Pedido em andamento"}
                </span>
              </header>
              {state.currentView === "catalog" && (
                <CatalogView dispatch={dispatch} />
              )}
              {state.currentView === "cart" && (
                <CartView state={state} dispatch={dispatch} />
              )}
              {state.currentView === "delivery" && (
                <DeliveryView
                  state={state}
                  dispatch={dispatch}
                  addressRef={addressRef}
                  cepRef={cepRef}
                  comparisonButtonRef={comparisonButtonRef}
                />
              )}
              {state.currentView === "payment" && (
                <PaymentView state={state} dispatch={dispatch} />
              )}
              {state.currentView === "order" && (
                <OrderView
                  state={state}
                  dispatch={dispatch}
                  comparisonButtonRef={comparisonButtonRef}
                />
              )}
              {state.currentView === "post" && (
                <PostPurchaseView
                  state={state}
                  dispatch={dispatch}
                  comparisonButtonRef={comparisonButtonRef}
                />
              )}
            </div>
          </div>
        </section>

        <aside className="checkpoint-panel" aria-labelledby="checkpoint-title">
          <div className="checkpoint-progress">
            <div>
              <span>CHECKPOINTS</span>
              <strong id="checkpoint-count">
                {state.checkpoints.length} / 6
              </strong>
            </div>
            <div
              role="progressbar"
              aria-label="Checkpoints concluídos"
              aria-valuemin="0"
              aria-valuemax="6"
              aria-valuenow={state.checkpoints.length}
              id="checkpoint-progress"
            >
              <i
                id="checkpoint-bar"
                style={{
                  width: `${(state.checkpoints.length / E2E_STEP_IDS.length) * 100}%`,
                }}
              ></i>
            </div>
          </div>
          <section className="checkpoint-task">
            <span>FOCO DA MISSÃO</span>
            <h2 id="checkpoint-title">Siga o mesmo pedido.</h2>
            <p id="checkpoint-instruction">
              {e2eInstructions[state.currentView]}
            </p>
          </section>
          {comparisonId && (
            <form
              className="checkpoint-check"
              id="checkpoint-check"
              onSubmit={submitComparison}
            >
              <fieldset>
                <legend id="comparison-question">
                  {getE2EFinding(comparisonId, state).question}
                </legend>
                <button
                  ref={comparisonButtonRef}
                  type="submit"
                  name="comparison"
                  value="consistent"
                  disabled={state.findings.includes(comparisonId)}
                >
                  Dados consistentes
                </button>
                <button
                  type="submit"
                  name="comparison"
                  value="divergent"
                  disabled={state.findings.includes(comparisonId)}
                >
                  Há uma divergência
                </button>
              </fieldset>
              <p
                id="comparison-feedback"
                role="status"
                aria-live="polite"
                hidden={!state.comparisonFeedback}
              >
                {state.comparisonFeedback}
              </p>
            </form>
          )}
          <section
            className="finding-list"
            id="finding-list"
            aria-live="polite"
          >
            {state.findings.length === 0 ? (
              <p className="finding-list__empty">
                Registre as comparações para formar suas evidências.
              </p>
            ) : (
              state.findings.map((id) => (
                <FindingCard key={id} id={id} state={state} />
              ))
            )}
          </section>
          {state.reviewOpen && (
            <form
              className="e2e-review"
              id="e2e-review"
              onSubmit={submitReview}
            >
              <div>
                <span>REVISÃO FINAL</span>
                <strong>Quais comportamentos quebram a jornada?</strong>
              </div>
              <p>
                Selecione apenas as divergências. A preservação correta dos
                dados não é um defeito.
              </p>
              <div id="e2e-review-options">
                {getE2EReviewOptions(state).map(({ id, title }) => (
                  <label className="e2e-review-option" key={id}>
                    <input
                      type="checkbox"
                      name="finding"
                      value={id}
                      checked={state.reviewSelection.includes(id)}
                      onChange={() =>
                        dispatch({
                          type: "toggle-review-selection",
                          value: id,
                        })
                      }
                    />
                    <span>{title}</span>
                  </label>
                ))}
              </div>
              <p
                id="e2e-review-error"
                ref={reviewErrorRef}
                role="alert"
                tabIndex={-1}
                hidden={!state.reviewError}
              >
                {state.reviewError}
              </p>
              <button className="button button--primary" type="submit">
                Concluir jornada E2E
              </button>
            </form>
          )}
        </aside>
      </section>

      {state.finished && (
        <section
          className="e2e-result"
          id="e2e-result"
          aria-labelledby="e2e-result-title"
        >
          <div className="e2e-result__icon" aria-hidden="true">
            ✓
          </div>
          <span className="label label--cyan">JORNADA E2E CONCLUÍDA</span>
          <h2 id="e2e-result-title" tabIndex={-1}>
            Você acompanhou o pedido até o fim.
          </h2>
          <p id="e2e-result-summary">
            Você verificou o mesmo pedido entre catálogo, carrinho, entrega,
            pagamento e confirmação. O E2E revela falhas na passagem de dados
            entre etapas, complementando a validação funcional do login e a
            exploração livre.
          </p>
          <qa-save-status ref={saveStatusRef}></qa-save-status>
          {saveBlocked && (
            <E2EReadOnlyNotice role="status" aria-live="polite">
              Resultado calculado, mas não salvo. Atualize o QA Quest antes de
              salvar o progresso.
            </E2EReadOnlyNotice>
          )}
          <div className="e2e-result__stats">
            <div>
              <span>CHECKPOINTS</span>
              <strong id="e2e-result-checkpoints">
                {state.checkpoints.length} / 6
              </strong>
            </div>
            <div>
              <span>EVIDÊNCIAS</span>
              <strong id="e2e-result-findings">
                {state.findings.length} / 3
              </strong>
            </div>
            <div>
              <span>EXPERIÊNCIA</span>
              <strong>
                <span id="e2e-result-xp">{earnedXp}</span> XP
              </strong>
            </div>
          </div>
          <div className="e2e-result__actions">
            <button
              className="button button--primary"
              id="restart-e2e"
              type="button"
              onClick={restartMission}
            >
              Executar novamente
            </button>
            <a className="button button--ghost" href="tracks.html">
              Voltar às trilhas
            </a>
          </div>
        </section>
      )}
    </E2ERoot>
  );
}

export function mountE2E(element) {
  if (!element)
    throw new Error("Elemento de montagem da missão E2E não encontrado.");
  createRoot(element).render(<E2E />);
}
