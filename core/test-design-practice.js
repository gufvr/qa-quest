export const QUANTITY_RULE = Object.freeze({ minimum: 1, maximum: 5 });

export const DELIVERY_RULES = Object.freeze([
  Object.freeze({ id: "r1", vip: true, subtotal: 250, delivery: "free" }),
  Object.freeze({ id: "r2", vip: true, subtotal: 150, delivery: "standard" }),
  Object.freeze({ id: "r3", vip: false, subtotal: 250, delivery: "standard" }),
  Object.freeze({ id: "r4", vip: false, subtotal: 150, delivery: "standard" }),
]);

function integer(value) {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function checkEquivalenceRepresentatives(values) {
  const numbers = [values?.below, values?.inside, values?.above].map(integer);
  if (numbers.some((number) => number === null))
    return {
      correct: false,
      feedback:
        "Neste recorte, use um número inteiro em cada grupo. Campo vazio e valor decimal exigiriam outras regras e não pertencem ao domínio declarado do exercício.",
    };
  const [below, inside, above] = numbers;
  const correct = below < 1 && inside >= 1 && inside <= 5 && above > 5;
  return {
    correct,
    feedback: correct
      ? "Partições representadas: abaixo de 1, de 1 a 5 e acima de 5. Os dois grupos externos devem ser rejeitados; o grupo central, aceito. Outros inteiros desses mesmos grupos também servem como representantes. Isso não prova que todos os valores foram testados."
      : "Separe pelo tratamento esperado: inteiro menor que 1 deve ser rejeitado; de 1 a 5, aceito; maior que 5, rejeitado. Escolha um representante de cada grupo, não três valores da faixa válida.",
  };
}

export function checkBoundarySelection(values) {
  const selected = Array.isArray(values) ? values.map(integer) : [];
  const correct =
    selected.length === 4 &&
    new Set(selected).size === 4 &&
    [0, 1, 5, 6].every((number) => selected.includes(number));
  return {
    correct,
    feedback: correct
      ? "Você cobriu as duas transições escolhidas: 0 deve falhar e 1 passar; 5 deve passar e 6 falhar. Este é um recorte de análise de 2 valores para a faixa inteira de 1 a 5. Valores internos, como 3, ajudam em outros casos, mas não substituem esses limites."
      : "Para este recorte de 2 valores, selecione somente 0, 1, 5 e 6: um par em cada transição entre rejeitar e aceitar. Testar apenas 1 e 5 não verifica os vizinhos fora da faixa.",
  };
}

export function checkDeliveryTable(values) {
  const correct = DELIVERY_RULES.every(
    (rule) => values?.[rule.id] === rule.delivery,
  );
  return {
    correct,
    feedback: correct
      ? "As quatro combinações viáveis foram consideradas. Só VIP ativo E subtotal de pelo menos R$ 200,00 dão frete grátis. As outras três regras mantêm o frete padrão. A tabela ajuda a não trocar E por OU nem esquecer uma combinação."
      : "A regra exige as duas condições juntas: VIP ativo E subtotal de pelo menos R$ 200,00. Apenas a regra R1 oferece frete grátis; R2, R3 e R4 mantêm frete padrão. Todas as quatro combinações deste exemplo são possíveis.",
  };
}

export function checkTechniqueReview(values) {
  const correct =
    values?.groups === "equivalence" &&
    values?.edges === "boundary" &&
    values?.combinations === "decision";
  return {
    correct,
    feedback: correct
      ? "Boa distinção: partição organiza grupos com tratamento semelhante; valores-limite investigam transições de faixas ordenadas; tabela de decisão organiza combinações de condições e ações. Elas podem ser combinadas no mesmo planejamento. Prática revisada, sem XP ou salvamento."
      : "Associe grupos à partição de equivalência, extremos da faixa à análise de valores-limite e combinações de condições à tabela de decisão. Corrija livremente: esta revisão não tem nota, XP ou registro de tentativas.",
  };
}
