export const SELENIUM_MISSION_ID = "selenium";

export const SELENIUM_CASE = Object.freeze({
  coupon: "FVR10",
  subtotal: "R$ 200,00",
  message: "Cupom aplicado",
  discount: "R$ 20,00",
  total: "R$ 180,00",
});

export const SELENIUM_ACTIONS = Object.freeze([
  Object.freeze({ id: "find", label: "Localizar o campo de cupom" }),
  Object.freeze({ id: "fill", label: "Preencher FVR10 com sendKeys" }),
  Object.freeze({ id: "click", label: "Acionar Aplicar cupom" }),
  Object.freeze({ id: "wait", label: "Aguardar o estado pronto" }),
  Object.freeze({ id: "assert", label: "Conferir mensagem, desconto e total" }),
]);

export const SELENIUM_PROFILES = Object.freeze([
  Object.freeze({ id: "reference", label: "Referência · teste confiável" }),
  Object.freeze({ id: "candidate", label: "Candidata · teste confiável" }),
  Object.freeze({ id: "fragile", label: "Referência · leitura prematura" }),
]);

export const SELENIUM_STEPS = Object.freeze([
  Object.freeze({
    id: "structure",
    title: "Sessão e estrutura",
    points: 10,
    kind: "structure",
    instruction:
      "Monte a base de um teste Node.js externo. WebDriver controla o navegador; a comparação vem de node:assert/strict. A URL depende de um laboratório autorizado configurado, não de um serviço do QA Quest.",
    feedback:
      "Importe Builder, By e until de selenium-webdriver; crie uma sessão própria e use async/await. Encerre-a em finally se tiver sido criada. O código exibido não é executado aqui.",
  }),
  Object.freeze({
    id: "locators",
    title: "Localizadores pelo contrato",
    points: 15,
    kind: "locators",
    instruction:
      "Inspecione a interface fictícia. Associe campo, botão e região de resultado a localizadores compatíveis com os atributos exibidos.",
    feedback:
      "By.id identifica o campo; By.css pode usar data-testid dos outros controles. CSS e XPath não são inerentemente errados: evite posições ou classes visuais sem relação com a regra.",
  }),
  Object.freeze({
    id: "actions",
    title: "Ordene as interações",
    points: 15,
    kind: "order",
    instruction:
      "Use as setas para ordenar localização, preenchimento, clique, espera e verificação. Experimente o cupom na interface ao lado; a experiência livre não altera as evidências fixas.",
    feedback:
      "Localize, preencha, clique, aguarde e só então confira. Completar o clique não comprova o desconto: observe o estado e os valores resultantes.",
  }),
  Object.freeze({
    id: "wait",
    title: "Espere a condição certa",
    points: 15,
    kind: "choice",
    instruction:
      "A região de resultado pode existir antes de estar pronta. Qual estratégia distingue presença de prontidão e usa um limite de tempo?",
    options: Object.freeze([
      Object.freeze([
        "ready",
        "Aguardar o elemento e depois data-state=ready com driver.wait e timeout",
      ]),
      Object.freeze([
        "sleep",
        "Pausar sempre 300 ms e ler o total imediatamente",
      ]),
      Object.freeze([
        "located",
        "Apenas encontrar a região de resultado já prova o desconto",
      ]),
    ]),
    feedback:
      "until.elementLocated pode aguardar presença; driver.wait com uma condição do estado ready aguarda o resultado de negócio. Presença e visibilidade não são sinônimos de prontidão. Evite misturar esperas implícitas e explícitas sem critério.",
  }),
  Object.freeze({
    id: "checks",
    title: "Verifique além da mensagem",
    points: 15,
    kind: "checks",
    instruction:
      "Componha as verificações. Antes de responder, rode a contraprova: a mensagem pode dizer Cupom aplicado enquanto o total continua R$ 200,00.",
    feedback:
      "O WebDriver lê os valores; node:assert/strict faz as comparações no exemplo externo. Confira mensagem, desconto e total. Uma mensagem positiva não aprova uma cobrança incorreta.",
  }),
  Object.freeze({
    id: "diagnosis",
    title: "Compare três evidências",
    points: 20,
    kind: "diagnosis",
    instruction:
      "Simule todos os perfis. A sequência temporal é uma fixture local, não um log, relatório ou execução real do Selenium.",
    feedback:
      "A referência pronta atende ao caso. A candidata pronta mostra desconto zero e total R$ 200,00: defeito do produto. A referência lida cedo falha no teste, mas fica correta após a atualização.",
  }),
  Object.freeze({
    id: "review",
    title: "Revisão e parecer",
    points: 10,
    kind: "review",
    instruction:
      "Escolha o estado inicial, o encerramento e o parecer sobre a candidata FF-SE-2026.01. Concluir esta missão não significa aprovar a aplicação para produção.",
    feedback:
      "Prepare um estado conhecido, não dependa de outro teste e encerre a sessão em finally. Devolva a candidata por divergência no valor e revise a espera do teste frágil; depois, reavalie. Nenhum teste real ou decisão de produção ocorreu.",
  }),
]);

export function createSeleniumSession() {
  return { step: 0, awards: {}, mistakes: [], runs: {}, counterexample: null };
}

export function inspectSeleniumResult(result) {
  return {
    messagePass: result.message === SELENIUM_CASE.message,
    discountPass: result.discount === SELENIUM_CASE.discount,
    totalPass: result.total === SELENIUM_CASE.total,
  };
}

export function runSeleniumCounterexample(session) {
  if (session.step !== 4 || session.awards.checks !== undefined) return session;
  const result = {
    message: SELENIUM_CASE.message,
    discount: "R$ 0,00",
    total: SELENIUM_CASE.subtotal,
  };
  return {
    ...session,
    counterexample: { result, ...inspectSeleniumResult(result) },
  };
}

export function simulateSelenium(profile) {
  if (!SELENIUM_PROFILES.some((item) => item.id === profile))
    throw Error("Perfil didático desconhecido.");
  const fragile = profile === "fragile";
  const candidate = profile === "candidate";
  const result = {
    message: fragile ? "Aguardando cupom" : SELENIUM_CASE.message,
    discount: fragile || candidate ? "R$ 0,00" : SELENIUM_CASE.discount,
    total: fragile || candidate ? SELENIUM_CASE.subtotal : SELENIUM_CASE.total,
  };
  return {
    profile,
    ready: !fragile,
    observedAt: fragile ? 300 : 800,
    readyAt: 800,
    result,
    eventualResult: fragile
      ? {
          message: SELENIUM_CASE.message,
          discount: SELENIUM_CASE.discount,
          total: SELENIUM_CASE.total,
        }
      : result,
    checks: inspectSeleniumResult(result),
    classification: candidate ? "product" : fragile ? "test" : "pass",
    expected:
      "Resultado pronto: Cupom aplicado, desconto R$ 20,00 e total R$ 180,00.",
    observed: candidate
      ? "Em 800 ms, resultado pronto e mensagem positiva, mas desconto R$ 0,00 e total R$ 200,00."
      : fragile
        ? "Em 300 ms, leitura prematura de R$ 200,00. Em 800 ms, a referência mostra R$ 180,00."
        : "Em 800 ms, resultado pronto, desconto R$ 20,00 e total R$ 180,00.",
    impact: candidate
      ? "A pessoa pode pagar R$ 20,00 a mais apesar da confirmação do cupom."
      : fragile
        ? "Falso alarme por sincronização inadequada; não atribuir a falha ao produto."
        : "O caso preparado atende ao contrato, sem aprovar outros fluxos.",
    timeline: [
      {
        at: 0,
        state: "loading",
        detail:
          "FVR10 preenchido; clique em Aplicar cupom inicia a atualização simulada.",
      },
      {
        at: fragile ? 300 : 800,
        state: fragile ? "loading" : "ready",
        detail: fragile
          ? "Leitura imediata após pausa fixa: total antigo R$ 200,00."
          : candidate
            ? "Resultado pronto: mensagem positiva, valores divergentes."
            : "Resultado pronto: valores correspondem ao contrato.",
      },
      {
        at: fragile ? 800 : 801,
        state: "ready",
        detail: fragile
          ? "A referência termina com R$ 180,00; a leitura anterior não se atualiza sozinha."
          : candidate
            ? "A divergência permanece após a prontidão: defeito da candidata."
            : "Verificação da referência concluída no escopo preparado.",
      },
    ],
  };
}

export function recordSeleniumRun(session, profile) {
  if (session.step !== 5 || session.awards.diagnosis !== undefined)
    return session;
  return {
    ...session,
    runs: { ...session.runs, [profile]: simulateSelenium(profile) },
  };
}

function isCorrect(step, answer) {
  switch (step.id) {
    case "structure":
      return (
        answer?.imports === "webdriver" &&
        answer?.session === "fresh" &&
        answer?.cleanup === "finally"
      );
    case "locators":
      return (
        answer?.field === "id" &&
        answer?.button === "testid" &&
        answer?.result === "testid"
      );
    case "actions":
      return (
        Array.isArray(answer) &&
        answer.join(",") === "find,fill,click,wait,assert"
      );
    case "wait":
      return answer === "ready";
    case "checks":
      return (
        answer?.message === "text" &&
        answer?.discount === "amount" &&
        answer?.total === "amount"
      );
    case "diagnosis":
      return (
        answer?.reference === "pass" &&
        answer?.candidate === "product" &&
        answer?.fragile === "test"
      );
    case "review":
      return (
        answer?.isolation === "fresh" &&
        answer?.cleanup === "finally" &&
        answer?.verdict === "return"
      );
    default:
      return false;
  }
}

export function answerSeleniumStep(session, answer) {
  const step = SELENIUM_STEPS[session.step];
  if (!step || session.awards[step.id] !== undefined)
    return {
      session,
      correct: false,
      feedback: "Etapa já registrada; não soma pontos novamente.",
    };
  if (
    (step.id === "checks" && !session.counterexample) ||
    (step.id === "diagnosis" &&
      !SELENIUM_PROFILES.every((profile) => session.runs[profile.id]))
  )
    return {
      session,
      correct: false,
      feedback:
        "Observe as evidências solicitadas antes de classificar. Evidência incompleta não reduz seus pontos.",
    };
  if (!isCorrect(step, answer))
    return {
      session: {
        ...session,
        mistakes: [...new Set([...session.mistakes, step.id])],
      },
      correct: false,
      feedback: `${step.feedback} Corrija para receber ${(step.points / 2).toLocaleString("pt-BR")} XP nesta etapa.`,
    };
  const points = session.mistakes.includes(step.id)
    ? step.points / 2
    : step.points;
  return {
    session: { ...session, awards: { ...session.awards, [step.id]: points } },
    correct: true,
    points,
    feedback: step.feedback,
  };
}

export function advanceSeleniumStep(session) {
  const step = SELENIUM_STEPS[session.step];
  return step &&
    session.awards[step.id] !== undefined &&
    session.step < SELENIUM_STEPS.length - 1
    ? { ...session, step: session.step + 1 }
    : session;
}

export function seleniumScore(session) {
  return Object.values(session.awards).reduce(
    (total, points) => total + points,
    0,
  );
}

export function isSeleniumComplete(session) {
  return SELENIUM_STEPS.every((step) => session.awards[step.id] !== undefined);
}

export function buildSeleniumCode(session) {
  const done = (id) => session.awards[id] !== undefined;
  if (!done("structure")) return "Escolha a estrutura para começar o exemplo.";
  return [
    'const { Builder, By, until } = require("selenium-webdriver");',
    'const assert = require("node:assert/strict");',
    "async function testCoupon() {",
    "  let driver;",
    "  try {",
    "    if (!process.env.FIKILY_LAB_URL)",
    '      throw new Error("Configure uma URL de laboratório autorizada.");',
    '    driver = await new Builder().forBrowser("chrome").build();',
    "    await driver.get(process.env.FIKILY_LAB_URL);",
    ...(done("locators")
      ? [
          '    const coupon = await driver.findElement(By.id("coupon-code"));',
          "    const apply = await driver.findElement(By.css('[data-testid=\"apply-coupon\"]'));",
        ]
      : []),
    ...(done("actions")
      ? ['    await coupon.sendKeys("FVR10");', "    await apply.click();"]
      : []),
    ...(done("wait")
      ? [
          "    await driver.wait(",
          "      until.elementLocated(By.css('[data-testid=\"coupon-result\"]')),",
          "      5000,",
          "    );",
          "    await driver.wait(async () => {",
          "      const result = await driver.findElement(By.css('[data-testid=\"coupon-result\"]'));",
          '      return (await result.getAttribute("data-state")) === "ready";',
          "    }, 5000);",
        ]
      : []),
    ...(done("checks")
      ? [
          "    const message = await driver.findElement(By.css('[data-testid=\"coupon-message\"]')).getText();",
          "    const discount = await driver.findElement(By.css('[data-testid=\"coupon-discount\"]')).getText();",
          "    const total = await driver.findElement(By.css('[data-testid=\"coupon-total\"]')).getText();",
          '    assert.equal(message, "Cupom aplicado");',
          '    assert.equal(discount, "R$ 20,00");',
          '    assert.equal(total, "R$ 180,00");',
        ]
      : []),
    "  } finally {",
    "    if (driver) await driver.quit();",
    "  }",
    "}",
    "testCoupon().catch((error) => {",
    "  console.error(error);",
    "  process.exitCode = 1;",
    "});",
  ].join("\n");
}

export function buildFragileSeleniumCode() {
  return [
    "await new Promise((resolve) => setTimeout(resolve, 300));",
    "const oldTotal = await driver.findElement(By.css('[data-testid=\"coupon-total\"]')).getText();",
    'assert.equal(oldTotal, "R$ 180,00");',
  ].join("\n");
}
