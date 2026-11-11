import React from "react";
import { createRoot } from "react-dom/client";
import { Card, Cards } from "./HowItWorks.styles.js";

function HowCards() {
  return (
    <Cards>
      <Card>
        <span className="label">SEU PROGRESSO</span>
        <h3>XP, nível e sequência</h3>
        <p>
          O XP é compartilhado entre fases e trilhas. As tentativas ficam
          registradas e o melhor resultado é preservado; repetir não duplica XP.
          Concluir missões em dias seguidos alimenta sua sequência.
        </p>
      </Card>
      <Card>
        <span className="label">NO SEU NAVEGADOR</span>
        <h3>Continue de onde parou</h3>
        <p>
          O progresso e o tema ficam salvos localmente neste navegador, sem
          conta ou sincronização entre dispositivos. Limpar os dados do site
          pode apagar esse histórico.
        </p>
      </Card>
      <Card>
        <span className="label">MATERIAL OPCIONAL</span>
        <h3>Apoio antes ou depois</h3>
        <p>
          As apostilas podem ser visualizadas ou baixadas na Biblioteca. Você
          não precisa ler um PDF nem concluir uma missão para acessar os
          materiais disponíveis.
        </p>
        <a className="page-back" href="biblioteca.html">
          Abrir a Biblioteca →
        </a>
      </Card>
      <Card>
        <span className="label">AMBIENTE DIDÁTICO</span>
        <h3>Simulações, sem sistemas reais</h3>
        <p>
          Os cenários da Fikily usam dados fictícios. Não são testes em lojas,
          contas, serviços ou meios de pagamento reais.
        </p>
      </Card>
    </Cards>
  );
}

const root = document.getElementById("how-cards-root");
if (root) createRoot(root).render(<HowCards />);
