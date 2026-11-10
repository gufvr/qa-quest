import { getRecommendedMission, learningTracks } from "./content-catalog.js";

const reviewedAt = "2026-11-01";
const microsoft = Object.freeze({
  author: "Microsoft Learn",
  title: "Architecture strategies for testing",
  url: "https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/testing",
  reviewedAt,
});
const fowler = Object.freeze({
  author: "Martin Fowler",
  title: "Software Testing Guide",
  url: "https://martinfowler.com/testing/",
  reviewedAt,
});

function group(context, fact, guidance, humor) {
  return [
    {
      id: `${context}-fact`,
      context,
      type: "fact",
      text: fact.text,
      author: fact.source.author,
      editorialForm: "paraphrase",
      source: Object.freeze({ ...fact.source, section: fact.section }),
    },
    {
      id: `${context}-guidance`,
      context,
      type: "guidance",
      text: guidance,
      author: "QA Quest",
      editorialForm: "original",
      source: null,
    },
    {
      id: `${context}-humor`,
      context,
      type: "humor",
      text: humor,
      author: "QA Quest",
      editorialForm: "original",
      source: null,
    },
  ].map(Object.freeze);
}

export const homeInsights = Object.freeze([
  ...group(
    "phase1",
    {
      text: "Testar desde o início ajuda a esclarecer requisitos e perceber limitações ainda no desenho da solução.",
      source: microsoft,
      section: "Test early, test often, test what matters",
    },
    "Nesta fase, compare conceitos e pense em qual pergunta cada tipo de teste ajuda você a responder.",
    "O bug não leu os requisitos. Ainda bem que você vai ler.",
  ),
  ...group(
    "phase2",
    {
      text: "Exemplos ligados a uma história podem orientar critérios de aceitação e depois integrar uma suíte de regressão.",
      source: fowler,
      section: "Story Test",
    },
    "Ao revisar um requisito, procure uma exceção e escreva a pergunta que você faria para esclarecer a regra.",
    "Requisito “óbvio” adora chegar acompanhado de interpretações diferentes.",
  ),
  ...group(
    "phase3",
    {
      text: "Uma interface pode precisar de verificações de layout e interação, além de testes em outras camadas.",
      source: microsoft,
      section: "Incorporate different types of testing — UI Testing",
    },
    "No login fictício, observe campos, mensagens e sessão. Compare o resultado de cada ação com o comportamento esperado.",
    "O botão Entrar parece tranquilo. O campo vazio prefere não comentar.",
  ),
  ...group(
    "phase4",
    {
      text: "Um plano de testes organiza escopo, casos, recursos e critérios de entrada e saída para uma release.",
      source: microsoft,
      section: "Create your plan",
    },
    "Para montar seu plano, comece pelo risco e pelo objetivo. Depois escolha os cenários que ajudam a tomar uma decisão.",
    "Planejar testes: porque “testa tudo rapidinho” ainda não virou uma estratégia.",
  ),
  ...group(
    "track:flows",
    {
      text: "No teste exploratório, aprender, desenhar testes e executá-los acontece em ciclos rápidos de investigação.",
      source: fowler,
      section: "Exploratory Testing",
    },
    "Ao investigar um fluxo, acompanhe os dados entre telas e registre o caminho que levou ao comportamento observado.",
    "Carrinho cheio de produtos, caderno cheio de hipóteses.",
  ),
  ...group(
    "track:release",
    {
      text: "A suíte de testes precisa ser revisada e ampliada conforme surgem funcionalidades e defeitos em produção.",
      source: microsoft,
      section: "Test early, test often, test what matters",
    },
    "Antes de emitir um parecer, diga o que você verificou nesta candidata e quais evidências sustentam sua decisão.",
    "A candidata pediu aprovação. Você pediu evidências.",
  ),
  ...group(
    "track:specialized",
    {
      text: "Carga avalia o volume esperado; estresse investiga limites, pontos de falha e recuperação do sistema.",
      source: microsoft,
      section:
        "Incorporate different types of testing — Load & Performance Testing; Stress Testing",
    },
    "Defina a pergunta antes da simulação e limite seu parecer ao que as métricas e evidências realmente demonstram.",
    "Nem toda lentidão é drama: primeiro, vamos olhar as métricas.",
  ),
  ...group(
    "track:professional",
    {
      text: "Ao simular um serviço, é importante conferir se o dublê continua representando o contrato real.",
      source: fowler,
      section: "Contract Test",
    },
    "Escreva o esperado e o observado de forma que outra pessoa consiga reproduzir e entender seu achado.",
    "Um bom relato poupa o time de brincar de adivinhar o bug.",
  ),
  ...group(
    "general",
    {
      text: "Testes automatizados e exploração se complementam; a automação não cobre sozinha toda a atividade de QA.",
      source: fowler,
      section: "Automated testing is not enough",
    },
    "Escolha uma missão para praticar e explique sua conclusão com evidências. Você pode revisitar o conteúdo no seu ritmo.",
    "Passou de primeira? Ótimo. Agora capricha naquela evidência.",
  ),
]);

export function getHomeInsightContext(
  state,
  recommendation = getRecommendedMission(state),
) {
  if (recommendation?.type === "phase") return recommendation.progressId;
  if (
    state.missions.phase4?.completed &&
    learningTracks.some((track) => track.id === state.selectedTrack)
  ) {
    return `track:${state.selectedTrack}`;
  }
  return "general";
}

export function localCalendarDay(date) {
  if (!Number.isFinite(date.getTime()))
    throw new RangeError("Data inválida para a mensagem do dia.");

  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  );
}

export function selectHomeInsight(
  state,
  { date = new Date(), recommendation, messages = homeInsights } = {},
) {
  const context = getHomeInsightContext(state, recommendation);
  const contextual = messages.filter((entry) => entry.context === context);
  const eligible = contextual.length
    ? contextual
    : messages.filter((entry) => entry.context === "general");

  if (!eligible.length)
    return homeInsights.find((entry) => entry.id === "general-guidance");
  const index =
    ((localCalendarDay(date) % eligible.length) + eligible.length) %
    eligible.length;
  return eligible[index];
}
