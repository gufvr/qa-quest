# QA Quest

<p align="center">
  <img src="qaquest.png" alt="Ícone do QA Quest" width="120">
</p>

Plataforma gamificada para estudar Quality Assurance por meio de desafios, análises e simuladores práticos. A Bazaraza e os endereços `bazaraza.test` são exemplos fictícios usados nos cenários. O projeto também é um exercício de HTML, CSS, JavaScript e aprendizado assistido por IA.

## Fases disponíveis

- **Fase 1 — Fundamentos:** questionário com perguntas aleatórias e feedback explicativo.
- **Fase 2 — Análise de Requisitos:** fluxos, ambiguidades, critérios de aceitação e riscos.
- **Fase 3 — Simulador de Login:** execução funcional e registro de defeito.
- **Fase 4 — Plano de Testes:** definição de escopo, riscos, estratégia, prioridades e critérios de saída.

Após a Fase 4, o **hub de trilhas** apresenta Fluxos e investigação, Confiança na release e Qualidade especializada. A Fase 3 introduz o teste funcional; a Trilha 01 inclui os simuladores de Teste Exploratório e Teste End-to-End. No E2E, acompanhe um pedido por seis checkpoints, registre três divergências e receba até 100 XP.

Na **Trilha 02**, o Smoke Test simula seis checks de uma versão fictícia da Bazaraza. A missão se conclui ao emitir o parecer correto sobre essa release; uma reprovação bloqueia apenas a versão simulada, não o produto. Um Smoke aprovado libera testes aprofundados, mas não aprova a aplicação para produção. A Sanidade valida a correção do Checkout e seus efeitos próximos, com quatro checks e até 100 XP. Regressão continua planejada.

O progresso por trilha, XP compartilhado, tentativas, tema e desbloqueios são salvos no navegador.

## Como executar

O projeto usa Vite para desenvolvimento local e build. Requer Node.js e npm instalados.

```bash
git clone URL_DO_REPOSITORIO
cd qa-quest
npm install
npm run dev
```

Abra o endereço local exibido pelo Vite e entre em `tracks.html` após concluir a Fase 4. Para gerar e visualizar a versão de produção, use `npm run build` e `npm run preview`. O GitHub Pages exibe a versão publicada; edições locais aparecem no servidor do Vite.

## Tecnologias

- HTML5 e CSS3;
- JavaScript e Web Components nativos;
- `localStorage`;
- Google Fonts.

## Estrutura

```text
qa-quest/
├── components/   # componentes reutilizáveis
├── core/         # progresso e persistência
├── pages/        # lógica de cada página
├── styles/       # estilos globais e das fases
├── index.html    # mapa da jornada
├── phase1.html   # Fase 1
├── phase2.html   # Fase 2
├── phase3.html   # Fase 3
├── phase4.html   # Fase 4
├── exploratory.html # laboratório de teste exploratório
├── e2e.html        # simulador de teste End-to-End
├── smoke.html      # checagem essencial de uma release fictícia
├── sanity.html     # validação focada da correção do Checkout
└── tracks.html   # hub de trilhas
```

## Status

Protótipo funcional em desenvolvimento. Novas missões, simuladores e testes automatizados serão adicionados gradualmente.
