import {
  ACTIONS,
  AUTOMATION_MISSION_ID,
  AUTOMATION_STEPS,
  advanceCheckpoint,
  answerCheckpoint,
  buildLabCode,
  createLabSession,
  isLabComplete,
  labScore,
  runLabFixture,
  simulateCatalog,
} from "../../../core/automation-lab.js";
import {
  createAutomationFramework,
  mountFramework,
} from "../Automation/AutomationFramework.jsx";

const fields = {
  scenario: [
    {
      name: "answer",
      kind: "radio",
      options: [
        ["filter", "Aplicar Acessórios e conferir todos os resultados."],
        ["taste", "Decidir se a identidade visual é bonita."],
        ["everything", "Automatizar tudo sem considerar risco."],
      ],
    },
  ],
  selector: [
    {
      name: "answer",
      kind: "radio",
      options: [
        ["style", ".filter--purple"],
        ["stable", '[data-testid="category-filter"]'],
        ["position", "select:first-of-type"],
      ],
    },
  ],
  wait: [
    {
      name: "answer",
      kind: "radio",
      options: [
        ["fixed", "Sempre pausar 300 ms."],
        ["ready", "Aguardar a lista ficar pronta com limite."],
        ["instant", "Conferir imediatamente."],
      ],
    },
  ],
  diagnosis: [
    {
      name: "answer",
      kind: "radio",
      options: [
        ["behavior", "O filtro da candidata falhou neste caso."],
        ["production", "A referência passou, então aprovar produção."],
        ["remove", "Remover a assertion."],
      ],
    },
  ],
  assertion: [
    {
      name: "subject",
      kind: "select",
      label: "O que verificar?",
      options: [
        ["visible", "A página está visível"],
        ["categories", "Categoria dos produtos"],
      ],
    },
    {
      name: "operator",
      kind: "select",
      label: "Qual condição?",
      options: [
        ["some", "Pelo menos um resultado"],
        ["every", "Todos os resultados"],
      ],
    },
    {
      name: "value",
      kind: "select",
      label: "Valor esperado?",
      options: [
        ["accessories", "Acessórios"],
        ["electronics", "Eletrônicos"],
      ],
    },
  ],
  maintenance: [
    {
      name: "selector",
      kind: "select",
      label: "Substituir o seletor por",
      options: [
        ["style", ".filter--compact"],
        ["stable", '[data-testid="category-filter"]'],
        ["any", "Qualquer select"],
      ],
    },
    {
      name: "assertion",
      kind: "select",
      label: "Assertion da categoria",
      options: [
        ["remove", "Remover"],
        ["keep", "Manter todos os produtos"],
      ],
    },
  ],
};

const AutomationFundamentals = createAutomationFramework({
  prefix: "lab",
  missionId: AUTOMATION_MISSION_ID,
  trackLabel: "TRILHA 05 · MÓDULO 01",
  title: "Do comportamento ao teste.",
  description:
    "Automatize uma verificação repetível e interprete a evidência de uma fixture.",
  candidateLabel: "FIKILY · LABORATÓRIO DE CATÁLOGO",
  briefingTitle: "O filtro continua fazendo o que promete?",
  briefingText:
    "Ao selecionar Acessórios, todos os produtos exibidos devem pertencer à categoria.",
  lockedText:
    "A missão não exige outras trilhas, ferramentas instaladas ou extensões.",
  steps: AUTOMATION_STEPS,
  fields,
  actions: ACTIONS.map((action) => ({ ...action, code: action.label })),
  initialOrder: ["wait", "filter", "open"],
  profiles: null,
  runProfiles: [
    { id: "reference", label: "referência" },
    { id: "candidate", label: "candidata" },
  ],
  diagnosisOptions: [],
  createSession: createLabSession,
  answerStep: answerCheckpoint,
  advance: advanceCheckpoint,
  score: labScore,
  isComplete: isLabComplete,
  buildCode: buildLabCode,
  recordRun: runLabFixture,
  counterexample: null,
});

export function mountAutomationFundamentals(element) {
  mountFramework(element, AutomationFundamentals);
}
