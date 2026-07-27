# QA Quest

Uma experiência gamificada para estudar Quality Assurance por meio de missões, desafios e feedbacks.

O QA Quest nasceu de um objetivo pessoal: depender menos de plataformas de cursos e assumir um papel mais ativo no meu aprendizado. A ideia é transformar conteúdos de QA em uma jornada prática, na qual eu possa testar conhecimentos, receber feedback e evoluir enquanto também desenvolvo minhas habilidades técnicas.

Este é um projeto em construção — e também meu experimento com *vibe coding*. Estou usando IA como parceira para explorar ideias, praticar a criação de prompts e aprender durante o desenvolvimento. As decisões sobre o produto, os testes e a evolução do projeto fazem parte desse processo.

## O que já funciona

- landing page responsiva com a apresentação da jornada;
- primeira missão sobre fundamentos de QA;
- dez questões de múltipla escolha sorteadas de um banco com 21 fundamentos;
- alternativas embaralhadas a cada nova tentativa;
- feedback explicativo após cada resposta;
- pontuação de até 100 XP e tela de resultado;
- opção de refazer a missão;
- segunda missão baseada em um caso prático de análise de requisitos;
- diagnóstico final das competências de fluxos, critérios de aceitação e revisão de riscos;
- simulador de rotina QA com uma aplicação fictícia de login;
- sete tarefas avaliadas pelas ações do jogador e relatório de defeito;
- temas claro e escuro, com preferência salva no navegador;
- navegação por teclado, link para pular conteúdo e suporte a movimento reduzido.

O XP, as tentativas, os melhores resultados e o desbloqueio sequencial das fases são preservados entre sessões no navegador.

## Como executar

O projeto não possui dependências nem processo de build.

1. Clone este repositório:

   ```bash
   git clone URL_DO_REPOSITORIO
   ```

2. Entre na pasta do projeto:

   ```bash
   cd qa-quest
   ```

3. Abra o arquivo `index.html` em um navegador moderno.

Também é possível baixar os arquivos e abrir o `index.html` diretamente.

## Tecnologias utilizadas

- HTML5;
- CSS3;
- JavaScript e Web Components nativos;
- `localStorage` para guardar tema, XP, tentativas, conclusões e fases desbloqueadas;
- Google Fonts.

Escolhi começar sem frameworks para fortalecer meus fundamentos e entender melhor o funcionamento de cada parte da interface. A organização usa componentes nativos carregados por scripts clássicos, mantendo a execução direta pelo navegador sem servidor ou processo de build.

## Estrutura do projeto

```text
qa-quest/
├── components/              # componentes reutilizáveis da interface
│   ├── qa-brand.js          # marca e link inicial
│   ├── qa-header.js         # cabeçalhos configurados por variante
│   ├── qa-theme-toggle.js   # alternância e persistência do tema
│   ├── qa-footer.js         # rodapé compartilhado
│   ├── qa-save-status.js    # feedback do progresso salvo
│   └── qa-toast.js          # notificações temporárias
├── core/
│   └── progress.js          # XP, tentativas e desbloqueio das fases
├── pages/
│   ├── home.js              # mapa e comportamento da página inicial
│   ├── phase1.js            # questionário de fundamentos
│   ├── phase2.js            # análise de requisitos
│   └── phase3.js            # simulador de rotina QA
├── styles/
│   ├── global.css           # tokens, componentes e estilos globais
│   ├── mission.css          # estrutura compartilhada das missões
│   ├── phase2.css           # estilos da análise de requisitos
│   └── phase3.css           # estilos do simulador
├── index.html               # página inicial e mapa da jornada
├── missao.html              # Fase 1
├── fase2.html               # Fase 2
├── fase3.html               # Fase 3
└── qaquest.png              # favicon
```

## Próximos passos

- criar novas missões e ampliar o conteúdo de QA;
- criar simuladores de dashboard e checkout;
- adicionar testes automatizados ao próprio projeto;
- publicar uma versão online para facilitar a experimentação;
- melhorar a experiência com base no feedback de quem testar.

## IA como parte do aprendizado

A IA foi usada como apoio na ideação, no desenvolvimento da interface e na revisão do código. Mais do que acelerar a construção, meu objetivo é aprender a dar contexto, avaliar respostas, testar sugestões e transformar prompts em decisões conscientes.

Para mim, *vibe coding* não significa abrir mão de entender o que foi criado. Significa usar a IA para experimentar mais, fazer perguntas melhores e aprender construindo.

## Status

Protótipo funcional em desenvolvimento. Sugestões e feedbacks são bem-vindos.
