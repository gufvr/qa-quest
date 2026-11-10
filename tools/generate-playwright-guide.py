from pathlib import Path
from datetime import date
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
OUTPUT = ROOT / "public/materiais/qa-quest-playwright.pdf"
CREATED = date(2026, 11, 5)
LOGO = ROOT / "qaquest.png"
INK, MUTED, BLUE, DARK, PALE, LINE = [
    colors.HexColor(value)
    for value in (
        "#1C2D4A",
        "#586E90",
        "#1686FA",
        "#101827",
        "#EEF3FA",
        "#DDE6F3",
    )
]
for regular, bold in [
    (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf")),
    (
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ),
]:
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("PWGuide", str(regular)))
        pdfmetrics.registerFont(TTFont("PWGuide-Bold", str(bold)))
        pdfmetrics.registerFontFamily(
            "PWGuide", normal="PWGuide", bold="PWGuide-Bold"
        )
        break
else:
    raise RuntimeError("Arial or DejaVu Sans is required.")
mono = next(
    (
        path
        for path in [
            Path("C:/Windows/Fonts/consola.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
        ]
        if path.exists()
    ),
    None,
)
if mono:
    pdfmetrics.registerFont(TTFont("PWGuide-Code", str(mono)))
styles = getSampleStyleSheet()
for name, size, leading, color, bold in [
    ("BodyPW", 10, 15, INK, False),
    ("SmallPW", 8, 11.7, MUTED, False),
    ("TitlePW", 29, 34, INK, True),
    ("SectionPW", 18, 23, INK, True),
    ("SubPW", 11.5, 16, INK, True),
    ("LabelPW", 8, 12, BLUE, True),
]:
    styles.add(
        ParagraphStyle(
            name=name,
            fontName="PWGuide-Bold" if bold else "PWGuide",
            fontSize=size,
            leading=leading,
            textColor=color,
            spaceAfter=10,
        )
    )
styles.add(
    ParagraphStyle(
        name="CodePW",
        fontName="PWGuide-Code" if mono else "Courier",
        fontSize=8.1,
        leading=11.5,
        textColor=INK,
    )
)
story = []


def p(text, style="BodyPW"):
    return Paragraph(text, styles[style])


def add(text, style="BodyPW"):
    story.append(p(text, style))


def section(label, title, intro):
    add(label, "LabelPW")
    add(title, "SectionPW")
    add(intro)


def box(title, text):
    table = Table([[p(title, "SubPW")], [p(text)]], colWidths=[471])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.extend([table, Spacer(1, 12)])


def code(text):
    table = Table([[Preformatted(text, styles["CodePW"])]], colWidths=[471])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.extend([table, Spacer(1, 12)])


def rows(headings, content, widths):
    table = Table(
        [[p(escape(cell), "SmallPW") for cell in headings]]
        + [[p(cell, "SmallPW") for cell in row] for row in content],
        colWidths=widths,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LINE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PALE, colors.white]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.extend([table, Spacer(1, 12)])


def frame(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(0, height - 78, width, 78, fill=1, stroke=0)
    canvas.drawImage(
        str(LOGO), 53, height - 57, width=35, height=35, mask="auto"
    )
    canvas.setFillColor(colors.white)
    canvas.setFont("PWGuide-Bold", 11)
    canvas.drawString(100, height - 43, "QA QUEST  /  PLAYWRIGHT")
    canvas.setFillColor(MUTED)
    canvas.setFont("PWGuide", 7.2)
    canvas.drawString(
        54, height - 99, "BIBLIOTECA DE ESTUDOS  /  TRILHA 05  /  MÓDULO 03"
    )
    canvas.setStrokeColor(LINE)
    canvas.line(54, 44, width - 54, 44)
    canvas.drawString(
        54,
        30,
        f"QA Quest  |  Material complementar  |  v1.0  |  {CREATED:%d/%m/%Y}",
    )
    canvas.drawRightString(width - 54, 30, f"{doc.page:02d} / 06")
    canvas.restoreState()


story.append(Spacer(1, 25))
add("AUTOMAÇÃO DE TESTES WEB", "LabelPW")
add("Playwright:<br/>do locator à evidência", "TitlePW")
add(
    "Monte um teste, acompanhe o estado da interface e investigue uma falha antes de decidir se o problema está no produto ou no teste."
)
box(
    "O caso Fikily",
    "Selecionar Acessórios, buscar Aurora e aplicar deve produzir uma lista pronta com Mochila Aurora e Estojo Aurora. Teclado Aurora é um eletrônico e não deve aparecer. Todos os dados são fictícios.",
)
rows(
    ["Prática", "O que muda neste módulo"],
    [
        [
            "Construir",
            "Estrutura async/await, locators e assertions web-first.",
        ],
        [
            "Observar",
            "Prontidão do catálogo e snapshots em uma linha do tempo didática.",
        ],
        [
            "Investigar",
            "Referência aderente, defeito na candidata e teste frágil.",
        ],
        [
            "Revisar",
            "Estado conhecido, isolamento, retries e parecer limitado ao escopo.",
        ],
    ],
    [100, 371],
)
box(
    "Simulação não é execução real",
    "O QA Quest não instala nem executa Playwright, código do aluno ou serviços externos. Os resultados são preparados localmente. O exemplo requer um projeto Playwright Test e uma aplicação de teste autorizada configurados fora do site.",
)
add(
    "A leitura é opcional e não altera XP. Fundamentos e Cypress são recomendações de estudo, não pré-requisitos de acesso além da Fase 4.",
    "SmallPW",
)
story.append(PageBreak())

section(
    "01 / ESTRUTURA E LOCATORS",
    "Descreva o elemento que você procura.",
    "test e expect vêm de @playwright/test. test.describe agrupa casos; beforeEach prepara cada caso. async/await organiza operações assíncronas; Arrange, Act, Assert ajuda a separar preparação, ações e verificações. [1]",
)
code(
    'import { test, expect } from "@playwright/test";\ntest.describe("Catálogo Fikily", () => {\n  test.beforeEach(async ({ page }) => {\n    await page.goto("/catalog");\n  });\n  test("filtra acessórios", async ({ page }) => {\n    const category = page.getByLabel("Categoria");\n    await category.selectOption("accessories");\n  });\n});'
)
add(
    "/catalog é uma rota de exemplo: exige baseURL e uma aplicação que implemente esse caminho. Não é uma URL pública oferecida pelo QA Quest.",
    "SmallPW",
)
rows(
    ["Locator", "Contrato e cuidado"],
    [
        [
            "getByRole",
            "Papel e nome acessível: button com nome Aplicar; searchbox com nome Buscar produto.",
        ],
        ["getByLabel", "Rótulo associado ao campo: Categoria."],
        [
            "getByTestId",
            "Atributo explícito mantido pelo time: catalog-results.",
        ],
        [
            "getByPlaceholder",
            "Placeholder Ex.: Aurora, quando esse texto é a intenção da consulta.",
        ],
    ],
    [120, 351],
)
box(
    "Locator não é um elemento congelado",
    "Ao ser utilizado, o locator procura um elemento atual. CSS e XPath também podem ser válidos; o risco é acoplar o teste a cor ou posição sem intenção. Nenhuma dessas consultas substitui uma avaliação completa de acessibilidade. [2]",
)
story.append(PageBreak())

section(
    "02 / AÇÕES E ASSERTIONS",
    "O resultado precisa corresponder à regra.",
    "Ações aguardam condições de actionability aplicáveis, não o sucesso do negócio. As verificações variam entre selectOption, fill e click. O exemplo abaixo usa a massa conhecida de dois acessórios. [3, 4]",
)
result = subprocess.run(
    [
        "node",
        "--input-type=module",
        "-e",
        'import {PLAYWRIGHT_STEPS,buildPlaywrightCode} from "./core/playwright-lab.js"; console.log(JSON.stringify(buildPlaywrightCode({awards:Object.fromEntries(PLAYWRIGHT_STEPS.map(s=>[s.id,s.points]))})));',
    ],
    cwd=ROOT,
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True,
)
code(json.loads(result.stdout))
add(
    "toHaveCount(2) impede lista vazia nesta massa. toContainText confere nomes; toHaveAttribute confere a categoria dos dois cards esperados. Dois itens com um eletrônico ainda violam o contrato, mesmo se a contagem passar. [4, 5]",
    "SmallPW",
)
story.append(PageBreak())

section(
    "03 / SINCRONIZAÇÃO E EVIDÊNCIAS",
    "Leia o estado antes de atribuir a causa.",
    "Prefira uma assertion sobre uma condição observável, como data-state=ready. Uma pausa fixa não prova que a atualização terminou. networkidle não é a recomendação geral para comprovar prontidão de testes. [4, 6]",
)
rows(
    ["Perfil", "Esperado e observado", "Interpretação e impacto"],
    [
        [
            "Referência confiável",
            "Esperado: lista pronta só com acessórios.<br/>800 ms: dois acessórios; verificações passam.",
            "Caso aderente, somente no escopo preparado.",
        ],
        [
            "Candidata confiável",
            "Esperado: nenhum eletrônico.<br/>800 ms: lista ready com três produtos, um eletrônico.",
            "Defeito do produto. A pessoa recebe resultado fora do filtro.",
        ],
        [
            "Referência frágil",
            "Esperado: conferir após atualização.<br/>300 ms: snapshot antigo de três itens.<br/>800 ms: lista correta com dois acessórios.",
            "Falha do teste: falso alarme causado por leitura prematura.",
        ],
    ],
    [105, 206, 160],
)
code(
    'await page.waitForTimeout(300);\nconst snapshot = await page.getByTestId("product-card").count();\nexpect(snapshot).toBe(2);'
)
add(
    "O número capturado não muda sozinho. Essa assertion imediata difere de await expect(cards).toHaveCount(2), que pode reconsultar. expect.poll reavalia uma função até um critério passar; não é, por si, a causa de instabilidade. [4]"
)
box(
    "Limites desta evidência",
    "Tempos e eventos são fixtures determinísticas, não métricas do computador. A linha do tempo não é o Trace Viewer real. waitForResponse só faz sentido quando há uma resposta relevante; este laboratório não faz requisições. [6]",
)
story.append(PageBreak())

section(
    "04 / REVISÃO E PARECER",
    "Independência também é parte da qualidade.",
    "Playwright Test fornece contextos de navegador isolados por teste. Fixtures oferecem recursos; beforeEach pode preparar o cenário. Projects são configurações e storageState pode reutilizar autenticação: nenhum garante independência sozinho. [7, 8]",
)
add(
    "Retry da assertion tenta satisfazer uma condição; retry do teste executa uma nova tentativa do caso. No projeto real, trace na primeira nova tentativa exige retries habilitados. O QA Quest não gera ou recebe trace.zip. [9]"
)
code(
    'import { defineConfig } from "@playwright/test";\nexport default defineConfig({\n  retries: 1,\n  use: { trace: "on-first-retry" },\n});'
)
box(
    "Parecer sustentado",
    "A referência atende ao caso preparado. A candidata precisa de ajuste no filtro e nova avaliação. O teste frágil precisa de sincronização por condição. Concluir corretamente a missão não equivale a aprovar uma suíte real ou a aplicação para produção.",
)
add("Exercício de revisão", "SubPW")
add(
    "1. Por que o clique concluído não comprova a atualização?<br/>2. Dois cards garantem que o filtro está correto?<br/>3. Qual a diferença entre snapshot e assertion web-first?<br/>4. Por que beforeEach e storageState não substituem independência?",
    "SmallPW",
)
box(
    "Critérios de correção",
    "1. A ação pode terminar antes do resultado de negócio.<br/>2. Não; nomes e categoria também precisam corresponder ao contrato.<br/>3. O snapshot captura um valor; a assertion sobre locator pode reconsultar.<br/>4. O caso precisa de estado controlado e não deve depender de outro teste.",
)
story.append(PageBreak())

section(
    "05 / REFERÊNCIAS E PRÓXIMA PRÁTICA",
    "Continue com fontes gratuitas.",
    "Conteúdo autoral didático, com exemplos próprios e paráfrases. Consulte a documentação da versão usada no seu projeto. As fontes abaixo foram verificadas em 05/11/2026.",
)
references = [
    (
        "1",
        "Estrutura e escrita de testes",
        "https://playwright.dev/docs/writing-tests",
    ),
    ("2", "Locators e contratos", "https://playwright.dev/docs/locators"),
    (
        "3",
        "Auto-waiting e actionability",
        "https://playwright.dev/docs/actionability",
    ),
    (
        "4",
        "Assertions, retry e polling",
        "https://playwright.dev/docs/test-assertions",
    ),
    (
        "5",
        "Assertions de locators",
        "https://playwright.dev/docs/api/class-locatorassertions",
    ),
    (
        "6",
        "Page: carregamento e respostas",
        "https://playwright.dev/docs/api/class-page",
    ),
    (
        "7",
        "Isolamento por contextos",
        "https://playwright.dev/docs/browser-contexts",
    ),
    ("8", "Fixtures", "https://playwright.dev/docs/test-fixtures"),
    ("9", "Trace Viewer e retries", "https://playwright.dev/docs/trace-viewer"),
]
for number, label, url in references:
    add(
        f'[{number}] <b>{escape(label)}</b><br/><link href="{escape(url)}" color="#1264B8">{escape(url)}</link>',
        "SmallPW",
    )
box(
    "StepScript: opcional e sem XP extra",
    "Projeto complementar de Gustavo Favero, criador do QA Quest. Permite gravar interações e gerar código Cypress/Playwright, mas não executa os testes pelo painel. Grave apenas ambientes autorizados com dados fictícios. Revise valores, seletores, esperas e assertions antes de compartilhar. O QA Quest não recebe suas gravações nem exige a extensão.",
)
store = "https://chromewebstore.google.com/detail/stepscript/kjapjhhghfigfilijhbdlchgpiojidhd"
add(
    f'<link href="{store}" color="#1264B8">StepScript na Chrome Web Store</link>',
    "SmallPW",
)
add(
    "Versão 1.0 · 05/11/2026. A execução real é um assunto externo ao laboratório local. Nenhuma instalação é necessária para concluir esta missão.",
    "SmallPW",
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
document = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=62,
    rightMargin=62,
    topMargin=124,
    bottomMargin=60,
    title="QA Quest - Playwright",
    author="QA Quest",
    subject="Trilha 05 - Módulo 03",
    pageCompression=1,
)
document.build(story, onFirstPage=frame, onLaterPages=frame)
reader = PdfReader(OUTPUT)
if len(reader.pages) != 6:
    raise RuntimeError(
        f"Expected exactly 6 pages, got {len(reader.pages)}. Review the layout."
    )
assert all(len(page.extract_text()) > 200 for page in reader.pages)
print(f"Created {OUTPUT}: {len(reader.pages)} pages")
