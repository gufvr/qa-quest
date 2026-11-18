export const simulatorCredentials = {
  email: "qa@fikily.test",
  password: "QA@2026",
};

export const simulatorTasks = [
  {
    type: "VALIDAÇÃO DE CAMPOS",
    title: "Teste os campos obrigatórios",
    instruction:
      "Sem preencher e-mail ou senha, tente entrar na aplicação e observe as validações apresentadas.",
    expectedEvents: ["empty_submit"],
    points: 10,
    feedback:
      "Os dois campos foram sinalizados sem enviar a autenticação. Essa ação cobriu o comportamento obrigatório do formulário.",
  },
  {
    type: "PARTIÇÃO INVÁLIDA",
    title: "Valide o formato do e-mail",
    instruction:
      "Informe um endereço incompleto, como “qa@”, preencha qualquer senha e tente entrar.",
    expectedEvents: ["invalid_email"],
    points: 10,
    feedback:
      "A aplicação impediu o envio e informou que o formato do endereço não é válido.",
  },
  {
    type: "CREDENCIAL INVÁLIDA",
    title: "Teste uma senha incorreta",
    instruction:
      "Use o e-mail válido do briefing, informe uma senha diferente de QA@2026 e tente entrar.",
    expectedEvents: ["wrong_password"],
    points: 10,
    feedback:
      "O acesso foi negado, mas a mensagem específica confirma que o e-mail existe. Guarde essa observação para comparar com o próximo teste.",
  },
  {
    type: "TESTE NEGATIVO",
    title: "Investigue a mensagem de autenticação",
    instruction:
      "Tente entrar com inexistente@fikily.test e qualquer senha. Compare a resposta com a tarefa anterior.",
    expectedEvents: ["unknown_user"],
    points: 10,
    feedback:
      "Defeito observado: mensagens diferentes revelam se uma conta está cadastrada. O comportamento esperado seria uma resposta genérica.",
  },
  {
    type: "CAMINHO FELIZ",
    title: "Execute o login com sucesso",
    instruction:
      "Use qa@fikily.test e QA@2026 para confirmar o fluxo principal de autenticação.",
    expectedEvents: ["login_success", "login_success_with_remember"],
    points: 10,
    feedback:
      "O caminho principal levou à área autenticada e apresentou uma confirmação clara ao usuário.",
  },
  {
    type: "PERSISTÊNCIA DE SESSÃO",
    title: "Teste a opção “Lembrar acesso”",
    instruction:
      "Marque “Lembrar acesso”, entre com as credenciais válidas e clique em “Simular nova visita”.",
    expectedEvents: ["remember_bug"],
    points: 20,
    feedback:
      "Defeito reproduzido: mesmo com a preferência marcada, a nova visita exige autenticação novamente.",
  },
  {
    type: "RELATO DE DEFEITO",
    title: "Registre o problema encontrado",
    instruction:
      "Documente o defeito da opção “Lembrar acesso” com título, severidade, passos e resultados esperado e obtido.",
    expectedEvents: ["valid_bug_report"],
    points: 30,
    feedback:
      "Relatório completo. A evidência contém informações suficientes para reprodução, análise e priorização pelo time.",
  },
];

export const actionLabels = {
  empty_submit: "Login enviado com campos vazios",
  invalid_email: "Formato de e-mail inválido testado",
  wrong_password: "Senha incorreta enviada para conta existente",
  unknown_user: "Conta inexistente testada",
  login_success: "Login válido executado",
  login_success_with_remember: "Login válido com preferência de sessão",
  remember_bug: "Nova visita simulada; sessão não foi mantida",
  valid_bug_report: "Relatório de defeito enviado",
};

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isBugReportComplete(report) {
  return Boolean(
    report.title.trim().length >= 8 &&
    report.severity &&
    report.steps.trim().length >= 15 &&
    report.expected.trim().length >= 10 &&
    report.actual.trim().length >= 10
  );
}
