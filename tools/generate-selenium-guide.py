from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/materiais/qa-quest-selenium.pdf"
LOGO = ROOT / "qaquest.png"
CREATED = date(2026, 11, 9)
INK = colors.HexColor("#1C2D4A")
MUTED = colors.HexColor("#586E90")
BLUE = colors.HexColor("#1686FA")
DARK = colors.HexColor("#101827")
PALE = colors.HexColor("#EEF3FA")
LINE = colors.HexColor("#DDE6F3")

for regular, bold in [
    (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf")),
    (
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ),
]:
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("SEGuide", str(regular)))
        pdfmetrics.registerFont(TTFont("SEGuide-Bold", str(bold)))
        pdfmetrics.registerFontFamily(
            "SEGuide", normal="SEGuide", bold="SEGuide-Bold"
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
    pdfmetrics.registerFont(TTFont("SEGuide-Code", str(mono)))

styles = getSampleStyleSheet()
for name, size, leading, color, bold in [
    ("BodySE", 10, 15, INK, False),
    ("SmallSE", 8, 11.7, MUTED, False),
    ("TitleSE", 29, 34, INK, True),
    ("SectionSE", 18, 23, INK, True),
    ("SubSE", 11.5, 16, INK, True),
    ("LabelSE", 8, 12, BLUE, True),
]:
    styles.add(
        ParagraphStyle(
            name=name,
            fontName="SEGuide-Bold" if bold else "SEGuide",
            fontSize=size,
            leading=leading,
            textColor=color,
            spaceAfter=10,
        )
    )
styles.add(
    ParagraphStyle(
        name="CodeSE",
        fontName="SEGuide-Code" if mono else "Courier",
        fontSize=7.9,
        leading=11,
        textColor=INK,
    )
)

story = []


def add(text, style="BodySE"):
    story.append(Paragraph(text, styles[style]))


def section(label, title, intro):
    add(label, "LabelSE")
    add(title, "SectionSE")
    add(intro)


def box(title, text):
    table = Table(
        [[Paragraph(title, styles["SubSE"])], [Paragraph(text, styles["BodySE"])]],
        colWidths=[471],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.extend([table, Spacer(1, 12)])


def code(text):
    table = Table([[Preformatted(text, styles["CodeSE"])]], colWidths=[471])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.extend([table, Spacer(1, 12)])


def rows(headings, content, widths):
    data = [[Paragraph(escape(cell), styles["SmallSE"]) for cell in headings]]
    data.extend(
        [Paragraph(cell, styles["SmallSE"]) for cell in row] for row in content
    )
    table = Table(data, colWidths=widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LINE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PALE, colors.white]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.extend([table, Spacer(1, 12)])


def frame(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(0, height - 78, width, 78, fill=1, stroke=0)
    canvas.drawImage(str(LOGO), 53, height - 57, width=35, height=35, mask="auto")
    canvas.setFillColor(colors.white)
    canvas.setFont("SEGuide-Bold", 11)
    canvas.drawString(100, height - 43, "QA QUEST  /  SELENIUM WEBDRIVER")
    canvas.setFillColor(MUTED)
    canvas.setFont("SEGuide", 7.2)
    canvas.drawString(54, height - 99, "BIBLIOTECA DE ESTUDOS  /  TRILHA 05  /  MÓDULO 04")
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
add("AUTOMAÇÃO DE TESTES WEB", "LabelSE")
add("Selenium WebDriver:<br/>da sessão ao parecer", "TitleSE")
add(
    "Controle um navegador em um projeto externo, observe o estado da interface e investigue uma falha antes de atribuir sua causa."
)
box(
    "O caso Fikily",
    "Um carrinho fictício tem subtotal de R$ 200,00. O cupom FVR10 deve mostrar Cupom aplicado, desconto de R$ 20,00 e total de R$ 180,00 quando o resultado estiver pronto.",
)
rows(
    ["Prática", "Pergunta central"],
    [
        ["Montar", "Como criar e encerrar uma sessão própria de WebDriver?"],
        ["Localizar", "Quais atributos identificam os controles sem depender da posição?"],
        ["Esperar", "O resultado está pronto ou apenas presente na página?"],
        ["Investigar", "A divergência vem do produto ou do instante da leitura?"],
    ],
    [100, 371],
)
box(
    "Simulação não é execução real",
    "O QA Quest não instala nem executa Selenium, código do aluno, checkout real ou serviços externos. As evidências são fixtures locais. O código ilustrativo requer um projeto Node.js configurado e uma aplicação de laboratório autorizada fora do site.",
)
add(
    "A leitura é opcional e não muda XP. Os módulos anteriores são recomendados, não pré-requisitos além da Fase 4.",
    "SmallSE",
)
story.append(PageBreak())

section(
    "01 / SESSÃO E LOCALIZADORES",
    "Encontre o elemento e cuide da sessão.",
    "WebDriver comunica-se com o navegador. Uma biblioteca externa faz as comparações: este exemplo usa node:assert/strict. Builder cria a sessão, By descreve como encontrar elementos e quit encerra o driver. [1, 2]",
)
code(
    'const { Builder, By, until } = require("selenium-webdriver");\n'
    'const assert = require("node:assert/strict");\n\n'
    "async function testCoupon() {\n"
    "  let driver;\n"
    "  try {\n"
    "    const labUrl = process.env.FIKILY_LAB_URL;\n"
    '    if (!labUrl) throw new Error("Configure o laboratório.");\n'
    '    driver = await new Builder().forBrowser("chrome").build();\n'
    "    await driver.get(labUrl);\n"
    "  } finally {\n"
    "    if (driver) await driver.quit();\n"
    "  }\n"
    "}\n"
    "testCoupon().catch((error) => {\n"
    "  console.error(error);\n"
    "  process.exitCode = 1;\n"
    "});"
)
add(
    "FIKILY_LAB_URL representa uma aplicação autorizada que implementa os controles do exercício. Não é uma URL pública oferecida pelo QA Quest. [2]",
    "SmallSE",
)
rows(
    ["Controle", "Localizador possível"],
    [
        ["Cupom", 'By.id("coupon-code")'],
        ["Aplicar", "By.css('[data-testid=\"apply-coupon\"]')"],
        ["Resultado", "By.css('[data-testid=\"coupon-result\"]')"],
    ],
    [120, 351],
)
box(
    "Escolha pelo contrato",
    "By.id, By.name e By.css são estratégias válidas. CSS e XPath não são automaticamente incorretos; a fragilidade vem de depender de posições ou detalhes visuais que não representam a regra. [3]",
)
story.append(PageBreak())

section(
    "02 / INTERAÇÕES E VERIFICAÇÕES",
    "Mensagem positiva não basta.",
    "Localize, preencha, clique, aguarde e compare. O exemplo abaixo é código para um projeto Node.js externo, não um script executado pelo QA Quest. [2, 4]",
)
code(
    'const { Builder, By, until } = require("selenium-webdriver");\n'
    'const assert = require("node:assert/strict");\n'
    "async function testCoupon() {\n"
    "  let driver;\n"
    "  try {\n"
    "    const url = process.env.FIKILY_LAB_URL;\n"
    '    if (!url) throw new Error("Configure o laboratório.");\n'
    '    driver = await new Builder().forBrowser("chrome").build();\n'
    "    await driver.get(url);\n"
    '    const field = await driver.findElement(By.id("coupon-code"));\n'
    '    await field.sendKeys("FVR10");\n'
    "    const button = await driver.findElement(\n"
    '      By.css(\'[data-testid="apply-coupon"]\')\n'
    "    );\n"
    "    await button.click();\n"
    "    await driver.wait(\n"
    '      until.elementLocated(By.css(\'[data-testid="coupon-result"]\')),\n'
    "      5000\n"
    "    );\n"
    "    await driver.wait(async () => {\n"
    "      const result = await driver.findElement(\n"
    '        By.css(\'[data-testid="coupon-result"]\')\n'
    "      );\n"
    '      return (await result.getAttribute("data-state"))\n'
    '        === "ready";\n'
    "    }, 5000);\n"
    "    const read = async (id) =>\n"
    '      (await driver.findElement(By.css(`[data-testid="${id}"]`)))\n'
    "        .getText();\n"
    '    assert.equal(await read("coupon-message"), "Cupom aplicado");\n'
    '    assert.equal(await read("coupon-discount"), "R$ 20,00");\n'
    '    assert.equal(await read("coupon-total"), "R$ 180,00");\n'
    "  } finally {\n"
    "    if (driver) await driver.quit();\n"
    "  }\n"
    "}\n"
    "testCoupon().catch((error) => {\n"
    "  console.error(error);\n"
    "  process.exitCode = 1;\n"
    "});"
)
add(
    "sendKeys e click fazem a interação; getText lê o conteúdo. A comparação de mensagem, desconto e total é feita por node:assert/strict, não por uma assertion embutida no WebDriver. [1, 2]",
    "SmallSE",
)
story.append(PageBreak())

section(
    "03 / ESPERAS E EVIDÊNCIAS",
    "Espere uma condição verificável.",
    "until.elementLocated pode aguardar presença, mas presença não significa visibilidade nem resultado pronto. driver.wait também aceita uma função que verifique uma condição observável com timeout. Misturar esperas implícitas e explícitas pode alterar o tempo previsto. [4, 5]",
)
rows(
    ["Perfil", "Observado", "Interpretação"],
    [
        [
            "Referência confiável",
            "800 ms: pronto; desconto R$ 20,00 e total R$ 180,00.",
            "Caso aderente neste escopo.",
        ],
        [
            "Candidata confiável",
            "800 ms: mensagem positiva, desconto R$ 0,00 e total R$ 200,00.",
            "Defeito do produto: a cobrança ignora o cupom.",
        ],
        [
            "Referência frágil",
            "300 ms: leitura do total antigo. 800 ms: referência correta em R$ 180,00.",
            "Falso alarme causado por leitura prematura.",
        ],
    ],
    [108, 205, 158],
)
code(
    "await new Promise((resolve) => setTimeout(resolve, 300));\n"
    "const oldTotal = await driver.findElement(\n"
    '  By.css(\'[data-testid="coupon-total"]\')\n'
    ").getText();\n"
    'assert.equal(oldTotal, "R$ 180,00");'
)
box(
    "Por que o teste frágil falha?",
    "Em 300 ms, a variável captura R$ 200,00; ela não se atualiza quando a página chega a R$ 180,00. Uma espera explícita pelo estado pronto evita atribuir esse falso alarme ao produto. [4]",
)
add(
    "Tempos e eventos são didáticos e determinísticos. Esta sequência temporal não é um log do Selenium nem uma medição do navegador.",
    "SmallSE",
)
story.append(PageBreak())

section(
    "04 / REVISÃO E PARECER",
    "Teste confiável começa de um estado conhecido.",
    "Prepare dados e sessão independentes entre casos. Encerre o driver em finally mesmo após uma falha posterior à criação da sessão. A documentação do Selenium recomenda evitar estado compartilhado entre testes. [2, 6]",
)
box(
    "Parecer sustentado",
    "A referência atende ao caso preparado. A candidata confirma o cupom sem alterar o valor e deve voltar para ajuste e nova avaliação. O teste frágil precisa de sincronização por condição. Concluir a missão não aprova a suíte real nem a aplicação para produção.",
)
add("Exercício de revisão", "SubSE")
add(
    "1. Por que encontrar coupon-result não prova que o desconto foi aplicado?<br/>"
    "2. O que precisa ser conferido além da mensagem Cupom aplicado?<br/>"
    "3. A leitura de R$ 200,00 aos 300 ms prova um defeito na referência?<br/>"
    "4. Por que driver.quit deve estar em finally?<br/>"
    "5. Por que não misturar automaticamente esperas implícitas e explícitas?",
    "SmallSE",
)
box(
    "Critérios de correção",
    "1. Presença não prova estado pronto nem regra de negócio.<br/>"
    "2. Conferir desconto R$ 20,00 e total R$ 180,00.<br/>"
    "3. Não: a referência fica correta aos 800 ms; o teste leu cedo demais.<br/>"
    "4. Para encerrar uma sessão criada mesmo se houver falha.<br/>"
    "5. A combinação pode produzir tempos de espera imprevisíveis.",
)
add(
    "O QA Quest usa escolhas e fixtures locais. Em um projeto real, ambiente, dados, runner, navegadores e critérios de aprovação precisam de configuração e avaliação próprias.",
    "SmallSE",
)
story.append(PageBreak())

section(
    "05 / REFERÊNCIAS E PRÓXIMOS PASSOS",
    "Continue com fontes gratuitas.",
    "Conteúdo autoral didático, com exemplos próprios e paráfrases. Consulte a documentação correspondente à versão usada no seu projeto. Links verificados em 09/11/2026.",
)
references = [
    ("1", "Componentes e papel do WebDriver", "https://www.selenium.dev/documentation/overview/components/"),
    ("2", "Primeiro script em JavaScript", "https://www.selenium.dev/documentation/webdriver/getting_started/"),
    ("3", "Estratégias de localização", "https://www.selenium.dev/documentation/webdriver/elements/locators/"),
    ("4", "Estratégias de espera", "https://www.selenium.dev/documentation/webdriver/waits/"),
    ("5", "API JavaScript de WebDriver", "https://www.selenium.dev/selenium/docs/api/javascript/WebDriver.html"),
    ("6", "Evitar estado compartilhado", "https://www.selenium.dev/documentation/test_practices/encouraged/avoid_sharing_state/"),
]
for number, label, url in references:
    add(
        f'[{number}] <b>{escape(label)}</b><br/><link href="{escape(url)}" color="#1264B8">{escape(url)}</link>',
        "SmallSE",
    )
box(
    "Próxima prática responsável",
    "Em um projeto de testes autorizado, configure o Selenium WebDriver para JavaScript, uma aplicação de laboratório e um runner adequado. Comece por um caso pequeno e independente. Não use contas, dados ou sistemas de terceiros sem permissão.",
)
add(
    "Versão 1.0 · 09/11/2026. O laboratório do QA Quest é uma simulação local e não executa Selenium ou código do aluno.",
    "SmallSE",
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
document = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=62,
    rightMargin=62,
    topMargin=124,
    bottomMargin=60,
    title="QA Quest - Selenium WebDriver",
    author="QA Quest",
    subject="Trilha 05 - Módulo 04",
    pageCompression=1,
)
document.build(story, onFirstPage=frame, onLaterPages=frame)
reader = PdfReader(OUTPUT)
if len(reader.pages) != 6:
    raise RuntimeError(f"Expected six pages, got {len(reader.pages)}")
if not all(len(page.extract_text()) > 200 for page in reader.pages):
    raise RuntimeError("A page has insufficient extractable text")
print(f"Created {OUTPUT}: {len(reader.pages)} pages")
