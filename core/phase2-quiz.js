const categories = ["Fluxos", "Critérios", "Revisão e riscos"];

const requirementQuestions = [
  {
    category: "Fluxos",
    kind: "TÉCNICA DE ANÁLISE",
    question:
      "Qual é o melhor primeiro passo para iniciar a análise deste requisito?",
    context:
      "Antes de escrever casos de teste, precisamos transformar a solicitação em partes observáveis.",
    options: [
      "Testar diretamente em produção para descobrir como o fluxo funciona.",
      "Identificar ator, objetivo, pré-condições, dados, ações e resultados esperados.",
      "Criar somente um teste automatizado para o botão Confirmar.",
      "Assumir que o fluxo é igual ao cadastro e dispensar o refinamento.",
    ],
    correct: 1,
    explanation:
      "Decompor o requisito revela o que já está definido e evidencia lacunas antes da criação dos cenários.",
  },
  {
    category: "Fluxos",
    kind: "FLUXO PRINCIPAL",
    question:
      "Qual sequência representa melhor um fluxo principal seguro e verificável?",
    context:
      "O objetivo é alterar o endereço apenas depois de validar a solicitação do cliente.",
    options: [
      "Informar o e-mail → atualizar imediatamente → verificar o formato depois.",
      "Acessar o perfil → informar novo e-mail → validar dados e identidade → confirmar o endereço → concluir a alteração.",
      "Enviar uma mensagem → apagar o e-mail antigo → pedir autenticação.",
      "Alterar o banco manualmente → avisar o cliente se houver tempo.",
    ],
    correct: 1,
    explanation:
      "Um fluxo principal deve ordenar ações do usuário e respostas do sistema, incluindo validações necessárias antes da atualização definitiva.",
  },
  {
    category: "Fluxos",
    kind: "FLUXO DE EXCEÇÃO",
    question: "Qual exceção crítica não foi definida na descrição recebida?",
    context: "O novo endereço pode já pertencer a outra conta da plataforma.",
    options: [
      "O usuário escolhe um avatar diferente.",
      "O novo e-mail já está cadastrado para outro cliente.",
      "O perfil possui uma foto em formato PNG.",
      "A página foi aberta durante a tarde.",
    ],
    correct: 1,
    explanation:
      "A duplicidade afeta integridade, autenticação e privacidade. O requisito precisa definir bloqueio, mensagem e comportamento esperado.",
  },
  {
    category: "Fluxos",
    kind: "FLUXOS ALTERNATIVOS",
    question: "Que conjunto amplia melhor o mapeamento de exceções do fluxo?",
    context: "Considere validação, confirmação e falhas externas.",
    options: [
      "E-mail inválido, token expirado, mensagem não recebida e indisponibilidade do serviço de envio.",
      "Cor do cabeçalho, tamanho do logo e ordem do menu.",
      "Somente sucesso no Chrome e no Firefox.",
      "Apenas alteração realizada pelo caminho principal.",
    ],
    correct: 0,
    explanation:
      "Essas condições representam pontos reais de interrupção e exigem respostas claras, recuperação e mensagens apropriadas.",
  },
  {
    category: "Critérios",
    kind: "CRITÉRIO DE ACEITAÇÃO",
    question: "Qual critério de aceitação é mais claro e testável?",
    context: "Procure pré-condição, ação e resultado observável.",
    options: [
      "A alteração deve funcionar bem e rapidamente.",
      "O sistema deve ser fácil para qualquer pessoa.",
      "Dado um cliente autenticado e um e-mail válido não utilizado, quando ele confirmar um token válido, então o novo endereço deve substituir o anterior.",
      "O desenvolvedor deve criar uma boa tela de alteração.",
    ],
    correct: 2,
    explanation:
      "O critério descreve contexto, condição e resultado verificável, reduzindo interpretações diferentes entre produto, desenvolvimento e QA.",
  },
  {
    category: "Critérios",
    kind: "AMBIGUIDADE",
    question: "Por que a palavra “rapidamente” precisa ser refinada?",
    context:
      "Termos subjetivos não indicam quando o comportamento pode ser aceito.",
    options: [
      "Porque palavras longas não podem aparecer em requisitos.",
      "Porque é necessário definir um limite mensurável, como tempo de resposta ou prazo de envio.",
      "Porque todo sistema deve responder instantaneamente.",
      "Porque desempenho nunca deve ser discutido no refinamento.",
    ],
    correct: 1,
    explanation:
      "Substituir 'rapidamente' por uma medida acordada torna a expectativa objetiva e permite validá-la.",
  },
  {
    category: "Critérios",
    kind: "CLAREZA DO REQUISITO",
    question: "O que precisa ser esclarecido na expressão “usuários válidos”?",
    context:
      "A expressão pode representar estados de conta e permissões muito diferentes.",
    options: [
      "Quais navegadores possuem uma cor válida.",
      "Quais estados de conta podem alterar o e-mail, como ativa, bloqueada, pendente ou autenticada recentemente.",
      "Qual pessoa do time escreveu a expressão.",
      "A quantidade de letras no nome do usuário.",
    ],
    correct: 1,
    explanation:
      "Definir os estados elegíveis evita decisões implícitas sobre acesso e torna possível criar cenários positivos e negativos.",
  },
  {
    category: "Revisão e riscos",
    kind: "RISCO E SEGURANÇA",
    question: "Qual proteção deveria ser discutida durante o refinamento?",
    context: "O e-mail pode ser usado para login e recuperação de acesso.",
    options: [
      "Remover todas as validações para reduzir etapas.",
      "Exigir reautenticação, confirmar o novo endereço e notificar o endereço anterior.",
      "Exibir publicamente o novo endereço antes da confirmação.",
      "Permitir alterações ilimitadas sem registro.",
    ],
    correct: 1,
    explanation:
      "Alterar um identificador de acesso é uma operação sensível. Reautenticação, confirmação e notificações reduzem risco de tomada de conta.",
  },
  {
    category: "Revisão e riscos",
    kind: "REVISÃO DO REQUISITO",
    question: "Qual conjunto de perguntas produz o refinamento mais útil?",
    context:
      "O objetivo é resolver regras, exceções e dependências antes do desenvolvimento.",
    options: [
      "Quem escolheu a fonte e por que o botão é roxo?",
      "O e-mail precisa ser único? Quando a alteração se torna efetiva? O token expira? Como desfazer uma solicitação indevida?",
      "Podemos começar sem entender o fluxo e decidir tudo depois?",
      "Quantas linhas de código serão escritas?",
    ],
    correct: 1,
    explanation:
      "As perguntas atacam decisões de negócio, segurança e recuperação que estão ausentes e afetam diretamente a implementação e os testes.",
  },
  {
    category: "Revisão e riscos",
    kind: "DECISÃO DE PRONTIDÃO",
    question:
      "Com base na análise, qual é a melhor decisão sobre o requisito atual?",
    context:
      "Ainda existem ambiguidades, exceções não tratadas e critérios ausentes.",
    options: [
      "Considerá-lo pronto porque possui uma frase de história de usuário.",
      "Iniciar o desenvolvimento e pedir ao QA para decidir as regras sozinho.",
      "Registrar as lacunas, refinar com os envolvidos e acordar critérios antes de considerá-lo pronto.",
      "Descartar a funcionalidade sem conversar com produto.",
    ],
    correct: 2,
    explanation:
      "QA torna riscos e dúvidas visíveis. As decisões de negócio devem ser refinadas com os envolvidos antes que o requisito seja tratado como pronto.",
  },
];

function shuffle(items, random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function createMissionQuestions(random = Math.random) {
  return requirementQuestions.map((question) => {
    const options = shuffle(
      question.options.map((text, index) => ({
        text,
        isCorrect: index === question.correct,
      })),
      random,
    );

    return {
      ...question,
      options: options.map((option) => option.text),
      correct: options.findIndex((option) => option.isCorrect),
    };
  });
}

export function summarizeCompetencies(questions, answerResults) {
  const scores = new Map(
    categories.map((category) => [
      category,
      { category, correct: 0, total: 0 },
    ]),
  );

  questions.forEach((question, index) => {
    const score = scores.get(question.category);
    if (!score)
      throw new Error(`Competência desconhecida: ${question.category}`);

    score.total += 1;
    if (answerResults[index] === true) score.correct += 1;
  });

  return categories.map((category) => {
    const score = scores.get(category);
    return {
      ...score,
      percentage: score.total ? (score.correct / score.total) * 100 : 0,
    };
  });
}
