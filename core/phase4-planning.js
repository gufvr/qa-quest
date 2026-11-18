export const planningSteps = [
  {
    id: "objective",
    kicker: "OBJETIVO E ESCOPO",
    shortTitle: "Objetivo",
    title: "Qual é o objetivo central deste plano?",
    instruction:
      "Escolha a formulação que orienta melhor o esforço de teste do Checkout 3.0 da Fikily.",
    type: "single",
    min: 1,
    max: 1,
    points: 14,
    metrics: ["coverage", "feasibility"],
    tip: "O objetivo deve declarar o que será validado e qual risco de negócio será protegido.",
    feedback:
      "Um objetivo específico conecta a funcionalidade ao resultado que o negócio precisa proteger.",
    options: [
      {
        id: "objective-core",
        label: "Validar a conclusão segura da compra",
        detail: "Cobrir cartão, Pix, cupons e criação correta do pedido.",
        quality: 1,
      },
      {
        id: "objective-all",
        label: "Testar todo o e-commerce",
        detail: "Revisar qualquer tela disponível antes da publicação.",
        quality: 0.35,
      },
      {
        id: "objective-visual",
        label: "Conferir somente o visual do checkout",
        detail: "Verificar textos, cores e alinhamentos da nova página.",
        quality: 0.15,
      },
      {
        id: "objective-gateway",
        label: "Validar apenas o gateway de pagamento",
        detail: "Ignorar carrinho, cupons e criação do pedido.",
        quality: 0.45,
      },
    ],
  },
  {
    id: "scope",
    kicker: "LIMITES DO PLANO",
    shortTitle: "Fora do escopo",
    title: "O que deve ficar fora desta execução?",
    instruction:
      "O Product Owner confirmou que dois recursos não pertencem à release. Identifique-os para evitar dispersão.",
    type: "multi",
    min: 2,
    max: 2,
    points: 14,
    metrics: ["coverage", "feasibility"],
    tip: "Declarar o que não será testado protege o prazo e torna as expectativas explícitas.",
    feedback:
      "Limites claros impedem que o plano prometa uma cobertura incompatível com a release.",
    options: [
      {
        id: "scope-marketplace",
        label: "Pedidos com múltiplos vendedores",
        detail: "O marketplace continua usando o checkout anterior.",
        recommended: true,
      },
      {
        id: "scope-saved-card",
        label: "Cartões salvos na conta",
        detail: "O armazenamento de cartões será entregue em outra versão.",
        recommended: true,
      },
      {
        id: "scope-coupon",
        label: "Cupons percentuais e fixos",
        detail: "Ambos fazem parte do escopo confirmado.",
        recommended: false,
      },
      {
        id: "scope-pix",
        label: "Pagamento por Pix",
        detail: "O Pix é um dos meios de pagamento da release.",
        recommended: false,
      },
    ],
  },
  {
    id: "risks",
    kicker: "ANÁLISE DE RISCOS",
    shortTitle: "Riscos prioritários",
    title: "Quais riscos exigem prioridade máxima?",
    instruction:
      "Selecione os dois problemas com maior impacto financeiro e operacional.",
    type: "multi",
    min: 2,
    max: 2,
    points: 14,
    metrics: ["risk", "feasibility"],
    tip: "Probabilidade importa, mas impacto financeiro e perda de confiança mudam a prioridade.",
    feedback:
      "Cobrança e cálculo incorretos podem gerar prejuízo, retrabalho e perda de confiança do cliente.",
    options: [
      {
        id: "risk-duplicate",
        label: "Cobrança duplicada ao tentar novamente",
        detail: "Uma repetição pode criar duas transações para o mesmo pedido.",
        recommended: true,
      },
      {
        id: "risk-discount",
        label: "Desconto calculado incorretamente",
        detail: "O total pago pode divergir das regras comerciais.",
        recommended: true,
      },
      {
        id: "risk-icon",
        label: "Ícone do Pix desalinhado",
        detail: "O problema afeta acabamento visual, sem impedir a compra.",
        recommended: false,
      },
      {
        id: "risk-copy",
        label: "Texto do botão pouco persuasivo",
        detail: "A redação pode ser melhorada, mas não altera a transação.",
        recommended: false,
      },
    ],
  },
  {
    id: "test-types",
    kicker: "ABORDAGEM DE TESTE",
    shortTitle: "Tipos de teste",
    title: "Quais abordagens formam a estratégia essencial?",
    instruction:
      "Escolha três abordagens adequadas ao risco e ao prazo inicial de cinco dias.",
    type: "multi",
    min: 3,
    max: 3,
    points: 14,
    metrics: ["coverage", "risk"],
    tip: "Combine validação funcional, integrações críticas e proteção contra regressões.",
    feedback:
      "A combinação equilibra o comportamento visível, a comunicação entre serviços e os fluxos que já existiam.",
    options: [
      {
        id: "type-functional",
        label: "Testes funcionais",
        detail: "Validar regras, campos, totais e respostas da interface.",
        recommended: true,
      },
      {
        id: "type-integration",
        label: "Testes de integração",
        detail:
          "Confirmar checkout, gateway, pedidos e estoque trabalhando juntos.",
        recommended: true,
      },
      {
        id: "type-regression",
        label: "Regressão direcionada",
        detail: "Proteger carrinho, login, endereço e histórico de pedidos.",
        recommended: true,
      },
      {
        id: "type-stress",
        label: "Estresse com 50 mil usuários",
        detail: "Exige infraestrutura e objetivo de performance não previstos.",
        recommended: false,
      },
      {
        id: "type-pentest",
        label: "Pentest completo da plataforma",
        detail: "É valioso, mas não cabe como atividade integral desta janela.",
        recommended: false,
      },
      {
        id: "type-catalog",
        label: "Revisão visual de todo o catálogo",
        detail: "Consome o prazo sem atacar os riscos do checkout.",
        recommended: false,
      },
    ],
  },
  {
    id: "environment",
    kicker: "AMBIENTE E DADOS",
    shortTitle: "Ambiente e dados",
    title: "Qual preparação torna a execução confiável?",
    instruction:
      "Selecione os três recursos mínimos para reproduzir cenários positivos, negativos e de compatibilidade.",
    type: "multi",
    min: 3,
    max: 3,
    points: 14,
    metrics: ["coverage", "feasibility"],
    tip: "Dados de teste fazem parte do plano: sem variações controladas, a cobertura fica apenas no papel.",
    feedback:
      "Sandbox, matriz enxuta de compatibilidade e massas variadas tornam os resultados repetíveis e seguros.",
    options: [
      {
        id: "env-sandbox",
        label: "Homologação com gateway sandbox",
        detail:
          "Usar credenciais isoladas e respostas controladas de pagamento.",
        recommended: true,
      },
      {
        id: "env-matrix",
        label: "Chrome, Firefox e viewport mobile",
        detail: "Cobrir os ambientes prioritários informados pelo produto.",
        recommended: true,
      },
      {
        id: "env-data",
        label: "Massas aprovadas, recusadas e cupons-limite",
        detail: "Preparar cartões, Pix e descontos com resultados conhecidos.",
        recommended: true,
      },
      {
        id: "env-production",
        label: "Cartões reais diretamente em produção",
        detail: "Executar cobranças reais para acelerar a validação.",
        recommended: false,
      },
      {
        id: "env-random",
        label: "Dados aleatórios sem resultado conhecido",
        detail: "Improvisar valores durante cada execução manual.",
        recommended: false,
      },
      {
        id: "env-all-browsers",
        label: "Todos os navegadores já lançados",
        detail: "Ampliar a matriz sem considerar uso ou prazo.",
        recommended: false,
      },
    ],
  },
  {
    id: "priorities",
    kicker: "REPLANEJAMENTO",
    shortTitle: "Cenários prioritários",
    title: "Com apenas dois dias, o que entra na execução prioritária?",
    instruction:
      "A release foi antecipada. Selecione os três cenários que melhor protegem receita e consistência dos pedidos.",
    type: "multi",
    min: 3,
    max: 3,
    points: 14,
    metrics: ["coverage", "risk", "feasibility"],
    tip: "Reduzir prazo não significa testar ao acaso: mantenha os fluxos de maior risco e registre o que foi adiado.",
    feedback:
      "O recorte preserva o caminho feliz, as falhas de pagamento e a idempotência das transações.",
    options: [
      {
        id: "priority-happy",
        label: "Compra aprovada cria um único pedido",
        detail: "Validar cartão e Pix até a confirmação final.",
        recommended: true,
      },
      {
        id: "priority-declined",
        label: "Pagamento recusado não cria pedido pago",
        detail: "Confirmar mensagem, estado e possibilidade de nova tentativa.",
        recommended: true,
      },
      {
        id: "priority-retry",
        label: "Nova tentativa não duplica cobrança",
        detail: "Cobrir timeout, duplo clique e reenvio da requisição.",
        recommended: true,
      },
      {
        id: "priority-animation",
        label: "Animação de carregamento em todos os celulares",
        detail: "Revisar detalhes visuais em uma matriz extensa.",
        recommended: false,
      },
      {
        id: "priority-copy",
        label: "Variações de texto promocional",
        detail: "Comparar todas as mensagens possíveis dos banners.",
        recommended: false,
      },
      {
        id: "priority-history",
        label: "Histórico completo dos últimos cinco anos",
        detail: "Executar regressão ampla fora da área alterada.",
        recommended: false,
      },
    ],
  },
  {
    id: "criteria",
    kicker: "ENTRADA E SAÍDA",
    shortTitle: "Critérios de conclusão",
    title: "Quando o plano pode recomendar a liberação?",
    instruction:
      "Escolha o conjunto de critérios que produz uma decisão objetiva e rastreável.",
    type: "single",
    min: 1,
    max: 1,
    points: 16,
    metrics: ["coverage", "risk", "feasibility"],
    tip: "Critérios de saída não prometem ausência de bugs; eles tornam o risco residual visível para a decisão.",
    feedback:
      "A decisão combina estabilidade, cobertura dos riscos críticos, defeitos conhecidos e evidências revisáveis.",
    options: [
      {
        id: "criteria-balanced",
        label: "Build estável, críticos aprovados e nenhum bloqueador",
        detail:
          "Registrar evidências, riscos residuais e aceite dos responsáveis.",
        quality: 1,
      },
      {
        id: "criteria-no-bugs",
        label: "Liberar somente quando não existir nenhum bug",
        detail:
          "Exigir ausência total de defeitos, independentemente do risco.",
        quality: 0.35,
      },
      {
        id: "criteria-deadline",
        label: "Liberar quando o prazo terminar",
        detail: "Usar apenas a data como critério de conclusão.",
        quality: 0.05,
      },
      {
        id: "criteria-happy",
        label: "Liberar quando uma compra funcionar",
        detail: "Considerar somente um caminho feliz executado com sucesso.",
        quality: 0.2,
      },
    ],
  },
];

export const metricNames = ["coverage", "risk", "feasibility"];

export function getRecommendedOptions(step) {
  if (step.type === "single")
    return step.options.filter((option) => option.quality === 1);
  return step.options.filter((option) => option.recommended);
}

export function isSelectionValid(step, selectedIds) {
  return selectedIds.length >= step.min && selectedIds.length <= step.max;
}

export function calculateStepPercentage(step, selectedOptions) {
  if (step.type === "single") return selectedOptions[0]?.quality || 0;

  const recommendedIds = new Set(
    getRecommendedOptions(step).map((option) => option.id),
  );
  const correct = selectedOptions.filter((option) =>
    recommendedIds.has(option.id),
  ).length;
  const incorrect = selectedOptions.length - correct;
  return Math.max(
    0,
    Math.min(1, (correct - incorrect * 0.5) / recommendedIds.size),
  );
}

export function calculateStepXp(step, selectedOptions) {
  return Math.round(
    step.points * calculateStepPercentage(step, selectedOptions),
  );
}

export function getMetricScore(records, metricName) {
  const relevantRecords = records.filter((record) =>
    record.metrics.includes(metricName),
  );
  if (!relevantRecords.length) return 0;
  const total = relevantRecords.reduce(
    (sum, record) => sum + record.percentage,
    0,
  );
  return Math.round((total / relevantRecords.length) * 100);
}

export function getResultMessage(earnedXp) {
  if (earnedXp >= 85)
    return "Você criou um plano objetivo, orientado a riscos e viável mesmo após a redução do prazo.";
  if (earnedXp >= 65)
    return "Seu plano cobre os pontos centrais, mas ainda pode tornar prioridades e limites mais explícitos.";
  return "Você estruturou uma primeira versão do plano. Revise as recomendações para equilibrar melhor risco, cobertura e prazo.";
}
