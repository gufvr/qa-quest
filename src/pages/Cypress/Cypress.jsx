import {
  CATALOG_PRODUCTS,
  CYPRESS_ACTIONS,
  CYPRESS_MISSION_ID,
  CYPRESS_PROFILES,
  CYPRESS_STEPS,
  advanceCypressStep,
  answerCypressStep,
  buildCypressCode,
  createCypressSession,
  cypressScore,
  isCypressComplete,
  recordCypressRun,
} from "../../../core/cypress-lab.js";
import {
  createAutomationFramework,
  mountFramework,
} from "../Automation/AutomationFramework.jsx";

const fields = {
  goal: [
    {
      name: "answer",
      kind: "radio",
      options: CYPRESS_STEPS[0].options,
    },
  ],
  structure: [
    {
      name: "suite",
      kind: "select",
      label: "Agrupar casos",
      options: [
        ["describe", 'describe("Catálogo Fikily", () => {})'],
        ["should", 'should("Catálogo", () => {})'],
      ],
    },
    {
      name: "test",
      kind: "select",
      label: "Definir caso",
      options: [
        ["it", 'it("filtra acessórios", () => {})'],
        ["visit", 'cy.visit("filtra acessórios")'],
      ],
    },
    {
      name: "visit",
      kind: "select",
      label: "Abrir catálogo",
      options: [
        ["visit", 'cy.visit("/catalog")'],
        ["get", 'cy.get("/catalog")'],
      ],
    },
  ],
  selector: [
    {
      name: "answer",
      kind: "radio",
      options: CYPRESS_STEPS[2].options,
    },
  ],
  assertions: [
    {
      name: "sync",
      kind: "select",
      label: "Sincronização",
      options: [
        ["fixed", "cy.wait(300)"],
        ["ready", "Aguardar data-state=ready"],
      ],
    },
    {
      name: "count",
      kind: "select",
      label: "Quantidade",
      options: [
        ["nonempty", "Lista não vazia"],
        ["empty", "Aceitar lista vazia"],
      ],
    },
    {
      name: "category",
      kind: "select",
      label: "Categoria",
      options: [
        ["some", "Primeiro card"],
        ["every", "Todos os cards são acessórios"],
      ],
    },
  ],
  diagnosis: [],
  review: [
    {
      name: "sync",
      kind: "select",
      label: "Sincronização",
      options: [
        ["remove", "Remover assertion"],
        ["condition", "Aguardar condição e manter assertion"],
      ],
    },
    {
      name: "isolation",
      kind: "select",
      label: "Estado inicial",
      options: [
        ["previous", "Depender de outro it"],
        ["own", "Cada it prepara seu estado"],
      ],
    },
    {
      name: "verdict",
      kind: "select",
      label: "Parecer",
      options: [
        ["release", "Aprovar produção"],
        ["return", "Devolver a candidata"],
      ],
    },
  ],
};

const Cypress = createAutomationFramework({
  prefix: "cy",
  missionId: CYPRESS_MISSION_ID,
  trackLabel: "TRILHA 05 · MÓDULO 02",
  title: "Do cenário ao spec.",
  description:
    "Construa um spec Cypress didático e interprete três perfis locais.",
  candidateLabel: "FIKILY · CANDIDATA FF-CY-2026.01",
  briefingTitle: "Um filtro, três diagnósticos.",
  briefingText:
    "Simulação local: nenhum Cypress é instalado ou executado. Ao selecionar Acessórios e buscar Aurora, a lista pronta deve conter somente acessórios.",
  lockedText: "Não é obrigatório concluir Fundamentos ou outra trilha.",
  steps: CYPRESS_STEPS,
  fields,
  actions: CYPRESS_ACTIONS,
  initialOrder: ["apply", "search", "filter"],
  profiles: CYPRESS_PROFILES,
  diagnosisOptions: [
    ["pass", "Caso atende à regra"],
    ["product", "Defeito do produto"],
    ["test", "Falha de sincronização do teste"],
  ],
  createSession: createCypressSession,
  answerStep: answerCypressStep,
  advance: advanceCypressStep,
  score: cypressScore,
  isComplete: isCypressComplete,
  buildCode: buildCypressCode,
  recordRun: recordCypressRun,
  counterexample: null,
});

export function mountCypress(element) {
  mountFramework(element, Cypress);
}
