const questionBank = [
  {
    question: "Qual afirmação descreve melhor o papel de uma pessoa QA?",
    context:
      "Pense na qualidade durante todo o ciclo de desenvolvimento, não apenas na execução de testes.",
    options: [
      "Testar a aplicação somente depois que o desenvolvimento terminar.",
      "Garantir sozinho que nenhum bug chegue ao ambiente de produção.",
      "Colaborar para prevenir problemas, analisar riscos e validar a qualidade do produto.",
      "Aprovar automaticamente toda funcionalidade que passou nos testes automatizados.",
    ],
    correct: 2,
    explanation:
      "QA atua de forma colaborativa e preventiva, analisando requisitos, riscos, evidências e resultados durante todo o ciclo do produto.",
  },
  {
    question:
      "Um requisito de cadastro não explica o que ocorre quando o CPF já existe. Que análise deve apontar essa lacuna?",
    context:
      "Escolha a atividade mais diretamente relacionada à clareza das regras de negócio.",
    options: [
      "Análise de requisitos.",
      "Teste de performance.",
      "Análise de logs.",
      "Teste de compatibilidade.",
    ],
    correct: 0,
    explanation:
      "A análise de requisitos procura ambiguidades, lacunas e regras de negócio incompletas antes que elas se transformem em defeitos.",
  },
  {
    question:
      "O tempo de testes é curto. Qual área deve receber maior prioridade?",
    context:
      "Considere o impacto de uma falha para o negócio e para os usuários.",
    options: [
      "A tela de perguntas frequentes, porque possui mais textos.",
      "O módulo de pagamento, porque uma falha pode impedir vendas.",
      "Todas as áreas igualmente, independentemente do risco.",
      "Somente a funcionalidade desenvolvida por último.",
    ],
    correct: 1,
    explanation:
      "Testes baseados em risco priorizam áreas com maior probabilidade ou impacto de falha. Pagamentos afetam diretamente receita e confiança.",
  },
  {
    question: "Qual é o principal objetivo de um Smoke Test?",
    context:
      "Imagine que uma nova versão acabou de ser publicada no ambiente de testes.",
    options: [
      "Explorar todos os casos extremos da aplicação.",
      "Medir o limite máximo de usuários simultâneos.",
      "Verificar rapidamente se as funções essenciais estão operando.",
      "Validar apenas o estilo visual das telas.",
    ],
    correct: 2,
    explanation:
      "O Smoke Test verifica rapidamente se a versão está estável o suficiente para que testes mais detalhados possam continuar.",
  },
  {
    question:
      "Depois de alterar o login, por que executar testes de regressão?",
    context:
      "A alteração pode afetar cadastro, recuperação de senha, perfil e logout.",
    options: [
      "Para confirmar apenas se a nova cor do botão está correta.",
      "Para verificar se funcionalidades existentes continuam funcionando.",
      "Para substituir todos os testes de integração.",
      "Para descobrir a capacidade máxima do servidor.",
    ],
    correct: 1,
    explanation:
      "A regressão procura efeitos colaterais: comportamentos que funcionavam antes podem ser afetados direta ou indiretamente pela alteração.",
  },
  {
    question: "De quem é a responsabilidade pela qualidade de um produto?",
    context:
      "Considere um time formado por produto, desenvolvimento, design e QA.",
    options: [
      "Somente da pessoa QA, porque ela executa os testes.",
      "De todo o time, com responsabilidades compartilhadas durante o desenvolvimento.",
      "Somente da liderança técnica.",
      "Apenas do cliente durante a homologação.",
    ],
    correct: 1,
    explanation:
      "Qualidade é uma responsabilidade compartilhada. QA ajuda a orientar e ampliar a visão de qualidade, mas todo o time contribui para construí-la.",
  },
  {
    question:
      "Qual informação torna um relato de defeito mais útil para investigação?",
    context:
      "Um bom relato deve permitir que outra pessoa compreenda e reproduza o problema.",
    options: [
      "Apenas a frase 'não funciona'.",
      "Opiniões pessoais sobre quem desenvolveu a funcionalidade.",
      "Passos, resultado obtido, resultado esperado e evidências.",
      "Somente a prioridade desejada para a correção.",
    ],
    correct: 2,
    explanation:
      "Passos claros, contexto, resultados esperado e obtido, ambiente e evidências reduzem dúvidas e aceleram a investigação.",
  },
  {
    question: "O que diferencia severidade de prioridade em um defeito?",
    context:
      "Os dois conceitos ajudam o time a tomar decisões, mas respondem a perguntas diferentes.",
    options: [
      "Severidade mede o impacto; prioridade indica a urgência de correção.",
      "Severidade indica quem criou o bug; prioridade indica quem vai corrigi-lo.",
      "Não existe diferença entre os dois termos.",
      "Severidade é usada apenas em testes automatizados.",
    ],
    correct: 0,
    explanation:
      "Severidade representa o impacto técnico ou de negócio do problema. Prioridade representa quão rapidamente ele precisa ser tratado.",
  },
  {
    question: "Em um caso de teste, para que serve o resultado esperado?",
    context:
      "Ele deve permitir comparar o comportamento observado com a regra definida.",
    options: [
      "Registrar quanto tempo a pessoa QA levou para testar.",
      "Definir o comportamento correto que deve ocorrer após a ação.",
      "Listar somente os dados usados no banco.",
      "Substituir os critérios de aceitação.",
    ],
    correct: 1,
    explanation:
      "O resultado esperado funciona como referência objetiva para decidir se o comportamento observado está correto.",
  },
  {
    question: "O que caracteriza um teste de caixa-preta?",
    context:
      "Nesse tipo de teste, o foco está no comportamento visível do sistema.",
    options: [
      "Analisar condicionais e caminhos internos do código.",
      "Validar entradas e saídas sem depender do conhecimento da implementação.",
      "Testar somente interfaces com fundo escuro.",
      "Executar testes exclusivamente em APIs.",
    ],
    correct: 1,
    explanation:
      "Na caixa-preta, a validação considera entradas, ações e saídas esperadas, sem exigir conhecimento da estrutura interna do código.",
  },
  {
    question: "Qual situação representa um teste negativo?",
    context:
      "Testes negativos verificam como o sistema reage a entradas inválidas ou condições adversas.",
    options: [
      "Cadastrar um usuário com todos os dados válidos.",
      "Acessar a página inicial com uma sessão ativa.",
      "Tentar cadastrar um e-mail em formato inválido.",
      "Confirmar que o botão possui o texto definido.",
    ],
    correct: 2,
    explanation:
      "Usar um e-mail inválido verifica se o sistema impede a operação e apresenta uma resposta adequada para uma condição incorreta.",
  },
  {
    question: "Para que servem evidências de teste?",
    context: "Considere prints, vídeos, registros de rede e respostas de API.",
    options: [
      "Apenas para deixar o relatório mais longo.",
      "Para demonstrar o comportamento observado e apoiar a análise.",
      "Para substituir completamente a descrição do cenário.",
      "Somente para comprovar que a pessoa QA trabalhou.",
    ],
    correct: 1,
    explanation:
      "Evidências registram o contexto e o comportamento observado, facilitando validação, comunicação e investigação.",
  },
  {
    question: "Qual é uma característica do teste exploratório?",
    context:
      "Ele combina aprendizado, criação de ideias e execução durante a própria sessão.",
    options: [
      "Seguir obrigatoriamente um roteiro imutável.",
      "Investigar o produto com objetivos definidos e liberdade para adaptar os testes.",
      "Executar apenas cenários automatizados.",
      "Ignorar riscos e regras de negócio.",
    ],
    correct: 1,
    explanation:
      "O teste exploratório é orientado por objetivos, conhecimento e riscos, permitindo adaptar a investigação conforme novas informações aparecem.",
  },
  {
    question: "Qual exemplo representa um teste não funcional?",
    context:
      "Testes não funcionais avaliam atributos de qualidade além das regras de negócio.",
    options: [
      "Validar se o usuário consegue alterar a senha.",
      "Verificar se uma compra gera um pedido.",
      "Medir o tempo de resposta com 500 usuários simultâneos.",
      "Confirmar se o CPF obrigatório foi preenchido.",
    ],
    correct: 2,
    explanation:
      "Desempenho sob carga é um atributo não funcional. Ele avalia como o sistema se comporta, e não apenas o que ele faz.",
  },
  {
    question: "O que um teste de integração procura validar?",
    context:
      "Pense em um fluxo que atravessa frontend, API, banco de dados e serviço de e-mail.",
    options: [
      "A comunicação correta entre componentes ou sistemas.",
      "Somente a ortografia presente na interface.",
      "A opinião do usuário sobre as cores.",
      "Exclusivamente os métodos internos de uma classe.",
    ],
    correct: 0,
    explanation:
      "Testes de integração verificam se componentes, módulos e serviços trocam dados e trabalham juntos corretamente.",
  },
  {
    question: "Qual é o objetivo de um teste End-to-End?",
    context: "Considere a jornada completa de compra de um cliente.",
    options: [
      "Validar apenas uma função isolada do código.",
      "Verificar o fluxo completo do usuário entre os sistemas envolvidos.",
      "Medir somente o consumo de memória do servidor.",
      "Substituir todos os outros níveis de teste.",
    ],
    correct: 1,
    explanation:
      "O E2E valida uma jornada completa, como cadastro, compra, pagamento e confirmação, atravessando as integrações necessárias.",
  },
  {
    question: "Quando um Sanity Test costuma ser útil?",
    context:
      "Um defeito específico acabou de ser corrigido e uma nova versão foi disponibilizada.",
    options: [
      "Para confirmar rapidamente que a correção e sua área imediata funcionam.",
      "Para executar todos os cenários existentes sem priorização.",
      "Para ultrapassar o limite de carga esperado.",
      "Para revisar a arquitetura completa do sistema.",
    ],
    correct: 0,
    explanation:
      "O Sanity Test é focado: confirma se uma alteração ou correção específica está funcional antes de testes mais amplos.",
  },
  {
    question: "O que é um critério de aceite bem definido?",
    context:
      "Ele deve ajudar o time a entender quando uma funcionalidade atende à necessidade esperada.",
    options: [
      "Uma descrição vaga que permite qualquer interpretação.",
      "Uma condição clara e verificável para aceitar a entrega.",
      "Uma lista de tecnologias usadas no desenvolvimento.",
      "Uma estimativa de quanto tempo o teste levará.",
    ],
    correct: 1,
    explanation:
      "Critérios de aceite claros e verificáveis tornam as expectativas observáveis e servem como base para cenários de teste.",
  },
  {
    question: "Por que testar valores de limite de um campo numérico?",
    context: "Um campo aceita quantidades entre 1 e 100 unidades.",
    options: [
      "Porque erros são comuns nas fronteiras entre valores válidos e inválidos.",
      "Porque somente os valores mínimo e máximo podem ser usados.",
      "Para evitar testar qualquer valor válido intermediário.",
      "Apenas para avaliar o design visual do campo.",
    ],
    correct: 0,
    explanation:
      "Limites como 0, 1, 100 e 101 revelam falhas frequentes em comparações, validações e regras de intervalo.",
  },
  {
    question:
      "O que deve acontecer quando o resultado obtido difere do resultado esperado?",
    context:
      "A diferença foi repetida no mesmo ambiente e com os mesmos dados.",
    options: [
      "Ignorar a diferença se a tela continuar aberta.",
      "Investigar, reunir evidências e registrar o possível defeito com contexto.",
      "Alterar o resultado esperado para o teste passar.",
      "Publicar imediatamente em produção.",
    ],
    correct: 1,
    explanation:
      "Uma divergência reproduzível deve ser analisada e comunicada com evidências suficientes para apoiar a decisão do time.",
  },
  {
    question: "Qual alternativa descreve melhor um teste de aceitação?",
    context:
      "A funcionalidade precisa ser validada sob a perspectiva da necessidade do negócio.",
    options: [
      "Validar se a entrega atende às necessidades e critérios acordados com o negócio.",
      "Analisar apenas a cobertura de linhas do código.",
      "Executar exclusivamente testes de segurança automatizados.",
      "Medir o desempenho máximo do banco de dados.",
    ],
    correct: 0,
    explanation:
      "O teste de aceitação confirma se a solução atende às necessidades do negócio e está adequada para ser aceita pelos envolvidos.",
  },
];

export const QUESTIONS_PER_ATTEMPT = 10;

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

export function randomizeOptions(question, random = Math.random) {
  const options = question.options.map((text, index) => ({
    text,
    isCorrect: index === question.correct,
  }));
  const randomizedOptions = shuffle(options, random);

  return {
    ...question,
    options: randomizedOptions.map((option) => option.text),
    correct: randomizedOptions.findIndex((option) => option.isCorrect),
  };
}

export function createMissionQuestions(random = Math.random) {
  return shuffle(questionBank, random)
    .slice(0, QUESTIONS_PER_ATTEMPT)
    .map((question) => randomizeOptions(question, random));
}
