import {
  PLAYWRIGHT_ACTIONS,
  PLAYWRIGHT_MISSION_ID,
  PLAYWRIGHT_PROFILES,
  PLAYWRIGHT_STEPS,
  advancePlaywrightStep,
  answerPlaywrightStep,
  buildFragilePlaywrightCode,
  buildPlaywrightCode,
  createPlaywrightSession,
  isPlaywrightComplete,
  playwrightScore,
  recordPlaywrightRun,
  runPlaywrightCounterexample,
} from "../../../core/playwright-lab.js";
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
        ["native", 'import { test, expect } from "@playwright/test";'],
        ["vitest", 'import { test, expect } from "vitest";'],
      ],
    },
    {
      name: "setup",
      kind: "select",
      label: "Preparação",
      options: [
        ["previous", "Outro teste visita primeiro"],
        ["beforeEach", "test.beforeEach prepara cada caso"],
      ],
    },
    {
      name: "async",
      kind: "select",
      label: "Operações",
      options: [
        ["await", "Usar async e await"],
        ["sync", "Omitir await"],
      ],
    },
  ],
  locators: [
    {
      name: "category",
      kind: "select",
      label: "Categoria",
      options: [
        ["style", 'page.locator(".select-purple")'],
        ["label", 'page.getByLabel("Categoria")'],
      ],
    },
    {
      name: "search",
      kind: "select",
      label: "Busca",
      options: [
        ["role", 'page.getByRole("searchbox")'],
        ["wrong", 'page.getByRole("button")'],
      ],
    },
    {
      name: "apply",
      kind: "select",
      label: "Aplicar",
      options: [
        ["position", "page.locator('button').first()"],
        ["button", 'page.getByRole("button", { name: "Aplicar" })'],
      ],
    },
  ],
  assertions: [
    {
      name: "count",
      kind: "select",
      label: "Quantidade",
      options: [
        ["two", "toHaveCount(2)"],
        ["empty", "Aceitar zero cards"],
      ],
    },
    {
      name: "text",
      kind: "select",
      label: "Nomes",
      options: [
        ["names", "Conferir Mochila Aurora e Estojo Aurora"],
        ["visible", "Conferir apenas que a página está visível"],
      ],
    },
    {
      name: "category",
      kind: "select",
      label: "Categoria",
      options: [
        ["first", "Conferir apenas o primeiro card"],
        ["every", "Conferir todos os cards"],
      ],
    },
  ],
  sync: [
    {
      name: "answer",
      kind: "radio",
      options: [
        ["ready", 'Aguardar data-state="ready"'],
        ["sleep", "Aguardar 300 ms"],
        ["network", "Usar networkidle"],
      ],
    },
  ],
  diagnosis: [],
  review: [
    {
      name: "isolation",
      kind: "select",
      label: "Isolamento",
      options: [
        ["state", "storageState garante independência"],
        ["context", "Contexto isolado por teste"],
      ],
    },
    {
      name: "trace",
      kind: "select",
      label: "Trace",
      options: [
        ["retry", "on-first-retry com retries"],
        ["always", "Sempre sem retries"],
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

const Playwright = createAutomationFramework({
  prefix: "pw",
  missionId: PLAYWRIGHT_MISSION_ID,
  trackLabel: "TRILHA 05 · MÓDULO 03",
  title: "Do locator à evidência.",
  description:
    "Construa locators e assertions Playwright em uma simulação local.",
  candidateLabel: "FIKILY · CANDIDATA FF-PW-2026.01",
  briefingTitle: "O clique terminou. E a atualização?",
  briefingText:
    "Lista pronta deve mostrar Mochila Aurora e Estojo Aurora, sem o eletrônico.",
  lockedText:
    "Nenhuma outra missão, extensão ou ferramenta instalada é obrigatória.",
  steps: PLAYWRIGHT_STEPS,
  fields,
  actions: PLAYWRIGHT_ACTIONS,
  initialOrder: ["apply", "search", "filter"],
  profiles: PLAYWRIGHT_PROFILES,
  diagnosisOptions: [
    ["pass", "Caso atende ao contrato"],
    ["product", "Defeito do produto"],
    ["test", "Falha de sincronização do teste"],
  ],
  createSession: createPlaywrightSession,
  answerStep: answerPlaywrightStep,
  advance: advancePlaywrightStep,
  score: playwrightScore,
  isComplete: isPlaywrightComplete,
  buildCode: buildPlaywrightCode,
  recordRun: recordPlaywrightRun,
  counterexample: runPlaywrightCounterexample,
});

export function mountPlaywright(element) {
  mountFramework(element, Playwright);
}
