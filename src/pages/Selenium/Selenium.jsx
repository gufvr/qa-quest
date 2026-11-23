import {
  SELENIUM_ACTIONS,
  SELENIUM_MISSION_ID,
  SELENIUM_PROFILES,
  SELENIUM_STEPS,
  advanceSeleniumStep,
  answerSeleniumStep,
  buildFragileSeleniumCode,
  buildSeleniumCode,
  createSeleniumSession,
  isSeleniumComplete,
  recordSeleniumRun,
  runSeleniumCounterexample,
  seleniumScore,
} from "../../../core/selenium-lab.js";
import {
  createAutomationFramework,
  mountFramework,
} from "../Automation/AutomationFramework.jsx";

const fields = {
  structure: [
    {
      name: "imports",
      kind: "select",
      label: "Importação",
      options: [
        ["webdriver", "selenium-webdriver e assert"],
        ["playwright", "@playwright/test"],
      ],
    },
    {
      name: "session",
      kind: "select",
      label: "Estado inicial",
      options: [
        ["shared", "Reutilizar sessão anterior"],
        ["fresh", "Criar sessão própria"],
      ],
    },
    {
      name: "cleanup",
      kind: "select",
      label: "Encerramento",
      options: [
        ["finally", "Usar try/finally"],
        ["skip", "Encerrar apenas no sucesso"],
      ],
    },
  ],
  locators: [
    {
      name: "field",
      kind: "select",
      label: "Campo de cupom",
      options: [
        ["id", 'By.id("coupon-code")'],
        ["style", 'By.css(".campo-roxo")'],
      ],
    },
    {
      name: "button",
      kind: "select",
      label: "Botão",
      options: [
        ["position", 'By.css("button:first-child")'],
        ["testid", 'By.css("[data-testid=apply-coupon]")'],
      ],
    },
    {
      name: "result",
      kind: "select",
      label: "Resultado",
      options: [
        ["testid", 'By.css("[data-testid=coupon-result]")'],
        ["message", 'By.id("coupon-code")'],
      ],
    },
  ],
  wait: [
    {
      name: "answer",
      kind: "radio",
      options: [
        ["ready", "Aguardar data-state=ready"],
        ["sleep", "Pausar 300 ms"],
        ["located", "Apenas encontrar a região"],
      ],
    },
  ],
  checks: [
    {
      name: "message",
      kind: "select",
      label: "Mensagem",
      options: [
        ["text", 'assert.equal(message, "Cupom aplicado")'],
        ["skip", "Não conferir mensagem"],
      ],
    },
    {
      name: "discount",
      kind: "select",
      label: "Desconto",
      options: [
        ["amount", 'assert.equal(discount, "R$ 20,00")'],
        ["skip", "Confiar só na mensagem"],
      ],
    },
    {
      name: "total",
      kind: "select",
      label: "Total",
      options: [
        ["amount", 'assert.equal(total, "R$ 180,00")'],
        ["skip", "Não conferir total"],
      ],
    },
  ],
  diagnosis: [],
  review: [
    {
      name: "isolation",
      kind: "select",
      label: "Independência",
      options: [
        ["shared", "Reutilizar sessão anterior"],
        ["fresh", "Preparar estado conhecido"],
      ],
    },
    {
      name: "cleanup",
      kind: "select",
      label: "Encerramento",
      options: [
        ["skip", "Não encerrar em falha"],
        ["finally", "Encerrar em finally"],
      ],
    },
    {
      name: "verdict",
      kind: "select",
      label: "Parecer",
      options: [
        ["return", "Devolver a candidata"],
        ["production", "Aprovar produção"],
      ],
    },
  ],
};

const Selenium = createAutomationFramework({
  prefix: "sel",
  missionId: SELENIUM_MISSION_ID,
  trackLabel: "TRILHA 05 · MÓDULO 04",
  title: "Da sessão ao parecer.",
  description:
    "Construa um teste Selenium didático e compare três perfis de cupom.",
  candidateLabel: "FIKILY · CANDIDATA FF-SE-2026.01",
  briefingTitle: "“Cupom aplicado” basta?",
  briefingText:
    "O cupom FVR10 deve reduzir R$ 20,00 e deixar o total em R$ 180,00.",
  lockedText: "Nenhum módulo anterior ou ferramenta instalada é obrigatório.",
  steps: SELENIUM_STEPS,
  fields,
  actions: SELENIUM_ACTIONS,
  initialOrder: ["assert", "click", "find", "wait", "fill"],
  profiles: SELENIUM_PROFILES,
  diagnosisOptions: [
    ["pass", "Caso atende ao contrato"],
    ["product", "Defeito do produto"],
    ["test", "Falha de sincronização do teste"],
  ],
  createSession: createSeleniumSession,
  answerStep: answerSeleniumStep,
  advance: advanceSeleniumStep,
  score: seleniumScore,
  isComplete: isSeleniumComplete,
  buildCode: buildSeleniumCode,
  recordRun: recordSeleniumRun,
  counterexample: runSeleniumCounterexample,
});

export function mountSelenium(element) {
  mountFramework(element, Selenium);
}
