from pathlib import Path
import json
import subprocess
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    Preformatted,
)
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/materiais/qa-quest-cypress.pdf"
LOGO = ROOT / "qaquest.png"
BLUE, INK, MUTED = [
    colors.HexColor(value) for value in ("#1686FA", "#1C2D4A", "#586E90")
]
DARK, PALE, LINE = [
    colors.HexColor(value) for value in ("#101827", "#EEF3FA", "#DDE6F3")
]
font_candidates = [
    (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf")),
    (
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ),
]
for regular, bold in font_candidates:
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("Guide", str(regular)))
        pdfmetrics.registerFont(TTFont("Guide-Bold", str(bold)))
        pdfmetrics.registerFontFamily(
            "Guide", normal="Guide", bold="Guide-Bold"
        )
        break
else:
    raise RuntimeError(
        "Provide Arial or DejaVu Sans before generating the guide."
    )
styles = getSampleStyleSheet()
for name, size, leading, color in [
    ("Body", 10, 15.5, INK),
    ("Small", 7.8, 11.5, MUTED),
    ("TitleGuide", 29, 34, INK),
    ("SectionGuide", 18, 23, INK),
    ("SubGuide", 11.5, 16, INK),
    ("Eyebrow", 8, 12, BLUE),
]:
    styles.add(
        ParagraphStyle(
            name=name,
            fontName=(
                "Guide-Bold"
                if name in ("TitleGuide", "SectionGuide", "SubGuide", "Eyebrow")
                else "Guide"
            ),
            fontSize=size,
            leading=leading,
            textColor=color,
            spaceAfter=10,
        )
    )
mono_candidates = [
    Path("C:/Windows/Fonts/consola.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
]
mono = next((path for path in mono_candidates if path.exists()), None)
if mono:
    pdfmetrics.registerFont(TTFont("Guide-Code", str(mono)))
styles.add(
    ParagraphStyle(
        name="CodeGuide",
        fontName="Guide-Code" if mono else "Courier",
        fontSize=8.8,
        leading=13.8,
        textColor=INK,
    )
)
story = []


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def add(text, style="Body"):
    story.append(p(text, style))


def section(number, title, intro):
    add(number, "Eyebrow")
    add(title, "SectionGuide")
    add(intro)


def box(title, text):
    table = Table([[p(title, "SubGuide")], [p(text)]], colWidths=[471])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 13),
                ("RIGHTPADDING", (0, 0), (-1, -1), 13),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([table, Spacer(1, 14)])


def code(text):
    table = Table([[Preformatted(text, styles["CodeGuide"])]], colWidths=[471])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.extend([table, Spacer(1, 14)])


def rows(headings, content, widths):
    data = [[p(escape(cell), "Small") for cell in headings]] + [
        [p(cell, "Small") for cell in row] for row in content
    ]
    table = Table(data, colWidths=widths, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LINE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PALE, colors.white]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.extend([table, Spacer(1, 14)])


def page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(0, height - 78, width, 78, fill=1, stroke=0)
    canvas.drawImage(
        str(LOGO), 53, height - 57, width=35, height=35, mask="auto"
    )
    canvas.setFillColor(colors.white)
    canvas.setFont("Guide-Bold", 11)
    canvas.drawString(100, height - 43, "QA QUEST  /  CYPRESS")
    canvas.setFillColor(MUTED)
    canvas.setFont("Guide", 7.2)
    canvas.drawString(
        54, height - 99, "BIBLIOTECA DE ESTUDOS  /  TRILHA 05  /  MÓDULO 02"
    )
    canvas.setStrokeColor(LINE)
    canvas.line(54, 44, width - 54, 44)
    canvas.drawString(
        54, 30, "QA Quest  |  Material complementar  |  v1.0  |  01/11/2026"
    )
    canvas.drawRightString(width - 54, 30, f"{doc.page:02d} / 06")
    canvas.restoreState()


story.append(Spacer(1, 30))
add("AUTOMAÇÃO DE TESTES WEB", "Eyebrow")
add("Cypress:<br/>do cenário ao spec", "TitleGuide")
add(
    "Construa comandos, confira resultados e aprenda a investigar uma falha sem confundir cliques com qualidade."
)
story.append(Spacer(1, 18))
box(
    "O caso Fikily",
    "Ao selecionar Acessórios, buscar Aurora e aplicar, a lista pronta deve exibir somente acessórios. A massa fictícia tem Mochila Aurora, Estojo Aurora e Teclado Aurora. O último é um eletrônico.",
)
rows(
    ["Etapa", "O que você vai praticar"],
    [
        ["01 / Definir", "Traduzir uma regra em resultado esperado."],
        ["02 / Construir", "Estrutura, seletores, ações e assertions."],
        ["03 / Observar", "Comparar uma referência e uma candidata."],
        ["04 / Revisar", "Sincronização, isolamento e diagnóstico."],
    ],
    [105, 366],
)
box(
    "Antes de começar",
    "É útil conhecer cenários e assertions do módulo Fundamentos. A apostila é opcional e não muda seu XP. O laboratório do QA Quest é uma simulação local: <b>não instala nem executa Cypress</b>.",
)
add(
    "Os exemplos usam dados fictícios e uma aplicação de teste autorizada. A execução real exige um projeto Cypress configurado fora do QA Quest.",
    "Small",
)
story.append(PageBreak())
section(
    "01 / ESTRUTURA E ELEMENTOS",
    "Dê intenção ao seu teste.",
    "Um spec é um arquivo de teste. describe organiza um grupo de casos e it descreve um comportamento verificável. cy.visit abre a página do ambiente configurado. [1, 2]",
)
code(
    'describe("Catálogo Fikily", () => {\n  it("filtra acessórios por busca", () => {\n    cy.visit("/catalog")\n    // Ações e assertions ficam aqui.\n  })\n})'
)
add("Ambiente e dados controlados", "SubGuide")
add(
    "/catalog é uma rota de exemplo. Ela só funciona se existir no servidor de uma aplicação de teste e se o projeto Cypress tiver baseUrl configurado. Não é uma rota pública prometida pelo QA Quest. Cada caso deve preparar seu próprio estado. [2, 3]"
)
rows(
    ["Consulta", "Quando faz sentido"],
    [
        [
            "cy.get('[data-testid=…]')",
            "Localizar por um atributo estável combinado com o time.",
        ],
        [
            "cy.contains('Aplicar')",
            "Localizar pelo texto quando ele é parte relevante do contrato.",
        ],
        [
            "Classe visual ou posição",
            "Evitar depender de cor ou ordem quando isso não faz parte da regra.",
        ],
    ],
    [180, 291],
)
add(
    "Os atributos de teste também podem mudar; precisam de manutenção. Papel e nome acessível são outra opção conforme a versão e a API disponíveis. Não confunda comandos nativos com comandos de plugins. Esta aula usa cy.get e cy.contains. [4, 5]"
)
box(
    "Pergunta prática",
    "Se o botão mudar de roxo para azul e continuar aplicando o filtro, seu teste deveria falhar? Se não, uma classe de cor provavelmente não é o contrato certo.",
)
story.append(PageBreak())
section(
    "02 / AÇÕES E RESULTADOS",
    "Interagir não é comprovar.",
    "As ações precisam de uma ordem coerente: o select deve existir, a busca precisa ser preenchida e Aplicar deve ser acionado antes de conferir os resultados.",
)
code(
    'cy.get(\'[data-testid="category-filter"]\')\n  .select("accessories")\ncy.get(\'[data-testid="catalog-search"]\')\n  .type("Aurora")\ncy.get(\'[data-testid="apply-filter"]\').click()'
)
rows(
    ["Comando", "Papel no exemplo"],
    [
        ["select", "Escolher o value accessories em um select HTML. [6]"],
        ["type", "Digitar Aurora no campo da busca. [7]"],
        [
            "click",
            "Acionar Aplicar. O clique não comprova a lista resultante. [8]",
        ],
        ["should", "Comparar um estado observado com o critério esperado. [9]"],
    ],
    [85, 386],
)
box(
    "Assertion insuficiente",
    "Conferir só que a página está visível ou que o primeiro produto é um acessório pode deixar um eletrônico passar despercebido. Confira uma lista não vazia e a categoria de todos os cards.",
)
add(
    "Depois de uma ação que pode atualizar a tela, consulte novamente os elementos necessários. Não suponha que uma referência antiga ao DOM continuará válida. [8]"
)
add(
    "Todos os nomes desta massa contêm Aurora. O caso evidencia o filtro de categoria, mas não cobre sozinho toda a busca, termos sem resultados ou todas as combinações de filtros.",
    "Small",
)
story.append(PageBreak())
section(
    "03 / ASSERTIONS E SINCRONIZAÇÃO",
    "Espere pelo estado, não por sorte.",
    "O contrato marca a lista com data-state=ready após a atualização. O teste aguarda essa condição com limite e consulta os cards novamente. [9, 10]",
)
result = subprocess.run(
    [
        "node",
        "--input-type=module",
        "-e",
        "import {CYPRESS_STEPS,buildCypressCode} from './core/cypress-lab.js'; console.log(JSON.stringify(buildCypressCode({awards:Object.fromEntries(CYPRESS_STEPS.map(s=>[s.id,s.points]))})))",
    ],
    cwd=ROOT,
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True,
)
example = "\n".join(json.loads(result.stdout).splitlines()[2:])
code(example)
add("Como ler a retryability", "SubGuide")
add(
    "Consultas encadeadas e assertions podem ser refeitas até passar ou atingir o timeout. Ações não são repetidas como assertions. O callback de should deve apenas conferir dados: não coloque cliques nem comandos Cypress dentro dele. Uma pausa fixa, como cy.wait(300), não garante que a atualização terminou. [9, 10]"
)
add(
    "Exemplo para um projeto configurado; não é executado no QA Quest. Um timeout limita a espera, não define um requisito de performance.",
    "Small",
)
story.append(PageBreak())
section(
    "04 / DIAGNÓSTICO E MANUTENÇÃO",
    "A mesma cor vermelha, causas diferentes.",
    "Os perfis abaixo são fixtures locais independentes. Os tempos são dados didáticos, não medições reais do navegador.",
)
rows(
    ["Perfil", "Esperado / observado", "Leitura de QA"],
    [
        [
            "Referência + teste confiável",
            "Esperado: lista pronta com acessórios.<br/>Observado: em 800 ms, dois acessórios.",
            "O caso atende à regra, somente neste escopo.",
        ],
        [
            "Candidata + teste confiável",
            "Esperado: nenhum eletrônico.<br/>Observado: em 800 ms, lista pronta ainda contém Teclado Aurora.",
            "Defeito do produto. A pessoa recebe um resultado fora da categoria.",
        ],
        [
            "Referência + teste frágil",
            "Esperado: conferir após a atualização.<br/>Observado: captura o estado anterior em 300 ms; a lista correta aparece em 800 ms.",
            "Falha do teste: leitura prematura, não defeito do filtro.",
        ],
    ],
    [113, 205, 153],
)
box(
    "O teste frágil desta aula",
    "A variante com pausa fixa lê um snapshot em 300 ms e o confere sem retry. Ela não representa o spec confiável da página anterior. Em Cypress real, a cadeia e o tipo de assertion determinam o que será repetido. [10]",
)
add("Revisão antes de aceitar o resultado", "SubGuide")
add(
    "1. Reproduza com dados conhecidos; guarde esperado, observado e impacto.<br/>2. Confira seletor, estado inicial, sincronização e alcance da assertion.<br/>3. Não remova a assertion para esconder uma divergência.<br/>4. Prepare cada teste de forma independente, sem depender de outro it. [3]"
)
box(
    "Parecer",
    "A candidata precisa de ajuste no filtro e nova avaliação. Concluir a missão significa interpretar as evidências corretamente; não significa que uma suíte real foi executada ou que a aplicação está aprovada para produção.",
)
story.append(PageBreak())
section(
    "05 / REVISÃO E PRÓXIMA PRÁTICA",
    "Explique antes de automatizar mais.",
    "Exercício: responda às quatro perguntas. Não é necessário instalar ferramentas.",
)
add(
    "1. Um clique passou. O que falta observar para validar o filtro?<br/>2. Por que ler aos 300 ms pode gerar um falso alarme?<br/>3. O que fazer se a lista pronta ainda exibir um eletrônico?<br/>4. Por que um caso não deve depender do estado de outro?",
    "Small",
)
box(
    "Critérios de correção",
    "1. Lista não vazia e categorias de todos os resultados.<br/>2. A atualização pode não ter terminado; observar uma condição com limite.<br/>3. Registrar evidência e devolver a candidata para investigação/ajuste.<br/>4. Cada caso deve funcionar isoladamente, com estado inicial conhecido.",
)
add("StepScript: prática complementar, opcional", "SubGuide")
add(
    "Projeto de Gustavo Favero, criador do QA Quest. Grava interações e gera código Cypress/Playwright, mas não executa testes pelo painel. Use só ambientes autorizados e dados fictícios. Revise seletores, valores e assertions antes de compartilhar. A missão e o XP não dependem da extensão. [11]",
    "Small",
)
add("Referências gratuitas e verificadas", "SubGuide")
references = [
    (
        "1",
        "Estrutura",
        "https://docs.cypress.io/app/core-concepts/writing-and-organizing-tests",
    ),
    ("2", "cy.visit", "https://docs.cypress.io/api/commands/visit"),
    (
        "3",
        "Isolamento",
        "https://docs.cypress.io/app/core-concepts/test-isolation",
    ),
    (
        "4",
        "Seletores",
        "https://docs.cypress.io/app/core-concepts/best-practices",
    ),
    ("5", "cy.contains", "https://docs.cypress.io/api/commands/contains"),
    ("6", "select", "https://docs.cypress.io/api/commands/select"),
    ("7", "type", "https://docs.cypress.io/api/commands/type"),
    ("8", "click", "https://docs.cypress.io/api/commands/click"),
    ("9", "should", "https://docs.cypress.io/api/commands/should"),
    (
        "10",
        "Retry-ability",
        "https://docs.cypress.io/app/core-concepts/retry-ability",
    ),
    (
        "11",
        "StepScript",
        "https://chromewebstore.google.com/detail/stepscript/kjapjhhghfigfilijhbdlchgpiojidhd",
    ),
]
for number, label, url in references:
    add(
        f"""[{number}] <b>{escape(label)}</b> - <link href="{escape(url)}" color="#1264B8">{escape(url.replace('https://', ''))}</link>""",
        "Small",
    )
add(
    "Conteúdo autoral didático, com paráfrases e exemplos próprios. Fontes consultadas em 01/11/2026. Confira a versão utilizada no seu projeto.",
    "Small",
)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=62,
    leftMargin=62,
    topMargin=124,
    bottomMargin=60,
    title="QA Quest - Cypress",
    author="QA Quest",
    subject="Trilha 05 - Módulo 02 - Cypress",
    pageCompression=1,
)
doc.build(story, onFirstPage=page, onLaterPages=page)
reader = PdfReader(str(OUTPUT))
if len(reader.pages) != 6:
    raise RuntimeError(
        f"Guide must have exactly 6 pages; got {len(reader.pages)}. Adjust layout before publishing."
    )
assert all((len(item.extract_text()) > 200 for item in reader.pages))
print(f"Created {OUTPUT} ({len(reader.pages)} pages)")
