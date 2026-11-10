import os
from datetime import date, datetime, timezone
from functools import partial
from pathlib import Path
from xml.sax.saxutils import escape

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/materiais/qa-quest-tecnicas-projeto-testes.pdf"
LOGO = ROOT / "qaquest.png"
CREATED = date(2026, 11, 9)
CREATED_TIME = datetime(
    CREATED.year, CREATED.month, CREATED.day, tzinfo=timezone.utc
)
os.environ["SOURCE_DATE_EPOCH"] = str(int(CREATED_TIME.timestamp()))
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
        pdfmetrics.registerFont(TTFont("TDGuide", str(regular)))
        pdfmetrics.registerFont(TTFont("TDGuide-Bold", str(bold)))
        pdfmetrics.registerFontFamily(
            "TDGuide", normal="TDGuide", bold="TDGuide-Bold"
        )
        break
else:
    raise RuntimeError("Arial or DejaVu Sans is required.")

styles = getSampleStyleSheet()
for name, size, leading, color, bold in [
    ("BodyTD", 10.2, 15.2, INK, False),
    ("SmallTD", 8.2, 12, MUTED, False),
    ("TitleTD", 28, 33, INK, True),
    ("SectionTD", 18, 23, INK, True),
    ("SubTD", 11.5, 16, INK, True),
    ("LabelTD", 8, 12, BLUE, True),
]:
    styles.add(
        ParagraphStyle(
            name=name,
            fontName="TDGuide-Bold" if bold else "TDGuide",
            fontSize=size,
            leading=leading,
            textColor=color,
            spaceAfter=10,
        )
    )

story = []


def add(text, style="BodyTD"):
    story.append(Paragraph(text, styles[style]))


def section(label, title, intro):
    add(label, "LabelTD")
    add(title, "SectionTD")
    add(intro)


def box(title, text):
    table = Table(
        [[Paragraph(title, styles["SubTD"])], [Paragraph(text, styles["BodyTD"])]],
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


def rows(headings, content, widths):
    data = [[Paragraph(escape(cell), styles["SmallTD"]) for cell in headings]]
    data.extend(
        [Paragraph(cell, styles["SmallTD"]) for cell in row] for row in content
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


def frame(canvas, document):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(0, height - 78, width, 78, fill=1, stroke=0)
    canvas.drawImage(str(LOGO), 53, height - 57, width=35, height=35, mask="auto")
    canvas.setFillColor(colors.white)
    canvas.setFont("TDGuide-Bold", 10.3)
    canvas.drawString(100, height - 43, "QA QUEST  /  PROJETO DE TESTES")
    canvas.setFillColor(MUTED)
    canvas.setFont("TDGuide", 7.2)
    canvas.drawString(54, height - 99, "BIBLIOTECA DE ESTUDOS  /  BASE COMUM  /  FASE 02")
    canvas.setStrokeColor(LINE)
    canvas.line(54, 44, width - 54, 44)
    canvas.drawString(
        54,
        30,
        f"QA Quest  |  Material complementar  |  v1.0  |  {CREATED:%d/%m/%Y}",
    )
    canvas.drawRightString(width - 54, 30, f"{document.page:02d} / 06")
    canvas.restoreState()


story.append(Spacer(1, 25))
add("DA REGRA AOS CASOS", "LabelTD")
add("Técnicas de<br/>Projeto de Testes", "TitleTD")
add(
    "Escolha dados com uma intenção clara. Pratique três maneiras de transformar regras em verificações observáveis."
)
rows(
    ["Técnica", "Pergunta de trabalho"],
    [
        ["Partição de equivalência", "Quais grupos devem receber o mesmo tratamento?"],
        ["Valores-limite", "Onde muda o resultado entre aceitar e rejeitar?"],
        ["Tabela de decisão", "Que ação corresponde a cada combinação de condições?"],
    ],
    [155, 316],
)
box(
    "Os casos fictícios da FictFvr",
    "<b>Regra A:</b> a quantidade já é um número inteiro. Aceitar de 1 a 5, inclusive; rejeitar os demais inteiros.<br/><br/><b>Regra B:</b> oferecer frete grátis somente se VIP estiver ativo <b>E</b> o subtotal for de pelo menos R$ 200,00. Nos demais casos, manter frete padrão.",
)
add(
    "Esta apostila acompanha a prática opcional da Fase 2. Não concede XP nem exige concluir ou refazer a missão. Não executa testes reais nem determina aprovação para produção.",
    "SmallTD",
)
story.append(PageBreak())

section(
    "01 / PARTIÇÃO DE EQUIVALÊNCIA",
    "Represente os grupos, não repita dados ao acaso.",
    "Partição de equivalência organiza valores que, segundo a regra, devem receber tratamento semelhante. Um representante permite exercitar cada grupo sem enumerar todas as entradas. [1, seção 4.2.1]",
)
rows(
    ["Partição da Regra A", "Representante", "Esperado"],
    [
        ["Inteiro menor que 1", "0", "Rejeitar quantidade."],
        ["Inteiro de 1 a 5, inclusive", "3", "Aceitar quantidade."],
        ["Inteiro maior que 5", "6", "Rejeitar quantidade."],
    ],
    [220, 95, 156],
)
box(
    "Por que não testar somente 2, 3 e 4?",
    "Os três valores estão no grupo aceito. Esse conjunto repete um tratamento e deixa de exercitar os dois grupos rejeitados. Já 0, 3 e 6 representam os três grupos deste recorte.",
)
add("O recorte precisa ser explícito", "SubTD")
add(
    "Aqui, o formato já foi validado: estamos falando apenas de inteiros. Vazio, texto e decimal precisam de requisitos próprios. Não os inclua silenciosamente no grupo de quantidades abaixo de 1."
)
add(
    "Grupos devem ser não vazios e não se sobrepor. A escolha pressupõe tratamento semelhante; não demonstra que todo valor do grupo se comporta corretamente. [1, seção 4.2.1]",
    "SmallTD",
)
story.append(PageBreak())

section(
    "02 / ANÁLISE DE VALORES-LIMITE",
    "Investigue as transições da faixa.",
    "Use valores-limite em partições ordenadas. Nesta prática de 2 valores, observamos cada transição com um par de vizinhos de tratamentos diferentes. [1, seção 4.2.2]",
)
rows(
    ["Valor", "Resultado esperado", "Intenção do caso"],
    [
        ["0", "Rejeitar", "Vizinho imediatamente abaixo do primeiro aceito."],
        ["1", "Aceitar", "Primeiro inteiro aceito."],
        ["5", "Aceitar", "Último inteiro aceito."],
        ["6", "Rejeitar", "Vizinho imediatamente acima do último aceito."],
    ],
    [55, 125, 291],
)
box(
    "As duas transições deste recorte",
    "<b>0 deve falhar / 1 deve passar.</b><br/><b>5 deve passar / 6 deve falhar.</b><br/><br/>Se uma implementação aceitar apenas valores maiores que 1, o caso com 1 revela a divergência. Se aceitar até 6, o caso com 6 revela a divergência.",
)
add("Limite não substitui a regra", "SubTD")
add(
    "Primeiro confirme que os extremos são inclusivos e qual é a unidade dos dados. O vizinho de um inteiro é diferente do vizinho de um valor monetário ou de uma data. O caso com 3 pode ser útil, mas não substitui os pares 0/1 e 5/6."
)
add(
    "Existem outros critérios, como análise de 3 valores. Não chamamos esta seleção de cobertura completa de todas as técnicas: ela cobre somente as duas transições declaradas para a Regra A.",
    "SmallTD",
)
story.append(PageBreak())

section(
    "03 / TABELA DE DECISÃO",
    "Combine condições antes de escolher ações.",
    "Uma tabela de decisão relaciona combinações de condições às ações esperadas. No formato abaixo, cada linha é uma regra. Todas as quatro combinações são viáveis. [1, seção 4.2.3]",
)
box(
    "Regra B - frete da FictFvr",
    "Frete grátis somente com <b>VIP ativo E subtotal de pelo menos R$ 200,00</b>. Não há outra condição. R$ 250,00 representa um subtotal que atende ao patamar; R$ 150,00 representa um que não atende.",
)
rows(
    ["Regra", "VIP ativo?", "Subtotal", "Frete esperado"],
    [
        ["R1", "Sim", "R$ 250,00", "Grátis"],
        ["R2", "Sim", "R$ 150,00", "Padrão"],
        ["R3", "Não", "R$ 250,00", "Padrão"],
        ["R4", "Não", "R$ 150,00", "Padrão"],
    ],
    [45, 95, 130, 201],
)
add("O que essa seleção pode revelar?", "SubTD")
add(
    "Testar apenas R1 não distingue a regra correta de uma implementação que libera frete para qualquer VIP ou para qualquer compra alta. R2 e R3 tornam essa diferença observável. R4 cobre o caso em que nenhuma condição é atendida."
)
add(
    "O patamar de R$ 200,00 pode receber testes adicionais em 199 e 200 reais se o domínio for declarado em reais inteiros. Isso é uma aplicação de limites à condição do subtotal, não uma substituição da tabela."
)
story.append(PageBreak())

section(
    "04 / EXERCÍCIO DE REVISÃO",
    "Explique a escolha dos seus casos.",
    "Use somente as regras A e B da página 1. Anote os casos antes de consultar os critérios abaixo. Não há nota nem pontuação nesta revisão.",
)
add(
    "<b>1.</b> Escolha um representante para cada grupo da quantidade.<br/>"
    "<b>2.</b> Liste os quatro valores dos pares nas duas transições da faixa.<br/>"
    "<b>3.</b> Complete as quatro regras de frete e justifique R2 e R3.<br/>"
    "<b>4.</b> Relacione grupos, extremos e combinações às três técnicas."
)
box(
    "Critérios de correção",
    "<b>1.</b> Qualquer trio com um inteiro abaixo de 1, um entre 1 e 5 e um acima de 5. Por exemplo: -2, 4 e 9.<br/><br/>"
    "<b>2.</b> 0, 1, 5 e 6, com rejeitar/aceitar/aceitar/rejeitar.<br/><br/>"
    "<b>3.</b> Só R1 tem frete grátis. R2 não atinge o subtotal; R3 não tem VIP. R4 não atende a nenhuma condição.<br/><br/>"
    "<b>4.</b> Grupos: partição de equivalência. Extremos: valores-limite. Combinações: tabela de decisão.",
)
add("Escreva um caso verificável", "SubTD")
rows(
    ["Contexto e ação", "Esperado", "Observado"],
    [
        ["Regra A; informar quantidade inteira 6.", "Quantidade rejeitada.", "Preencher após executar em um ambiente autorizado."],
    ],
    [190, 100, 181],
)
add(
    "Defina o esperado antes de observar o sistema. Caso um resultado divirja, registre contexto e evidência; não invente a causa. Um exemplo didático não demonstra que o produto real passou.",
    "SmallTD",
)
story.append(PageBreak())

section(
    "05 / REFERÊNCIAS E PRÓXIMO USO",
    "Leve o raciocínio ao seu planejamento.",
    "Parta do requisito, declare o domínio, selecione casos com uma intenção e registre o esperado. As técnicas se complementam; nenhuma delas elimina riscos ou prova ausência de defeitos.",
)
rows(
    ["Antes de executar", "Pergunta de revisão"],
    [
        ["Regra e domínio", "As condições e inclusões estão explícitas?"],
        ["Representantes", "Os grupos válidos e inválidos foram considerados?"],
        ["Limites", "Os pares de transição escolhidos têm resultados diferentes?"],
        ["Combinações", "As regras viáveis têm ações esperadas sem contradição?"],
        ["Conclusão", "Minha evidência permite concluir somente o escopo executado?"],
    ],
    [130, 341],
)
references = [
    (
        "1",
        "ISTQB - CTFL Syllabus v4.0.1, seções 4.2.1, 4.2.2 e 4.2.3",
        "https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf",
    ),
    (
        "2",
        "ISTQB - página oficial do CTFL e materiais gratuitos",
        "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/",
    ),
]
add("Referências oficiais gratuitas", "SubTD")
for number, label, url in references:
    add(
        f'[{number}] <b>{escape(label)}</b><br/><link href="{escape(url)}" color="#1264B8">{escape(url)}</link>',
        "SmallTD",
    )
add(
    "Referência conceitual: autores do CTFL v4.0.1 e ISTQB, titulares do syllabus. As explicações e os exemplos deste guia são autorais do QA Quest. Não há vínculo, certificação ou credenciamento do material pelo ISTQB.",
    "SmallTD",
)
add(
    f"Versão 1.0. Criação e verificação das referências: {CREATED:%d/%m/%Y}. Complemento opcional da Fase 2, sem XP ou armazenamento de respostas.",
    "SmallTD",
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
document = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=62,
    rightMargin=62,
    topMargin=124,
    bottomMargin=60,
    title="QA Quest - Técnicas de Projeto de Testes",
    author="QA Quest",
    subject="Base comum - Complemento opcional da Fase 2",
    pageCompression=1,
)
document.build(
    story,
    onFirstPage=frame,
    onLaterPages=frame,
    canvasmaker=partial(Canvas, invariant=1),
)
reader = PdfReader(OUTPUT)
if len(reader.pages) != 6:
    raise RuntimeError(f"Expected six pages, got {len(reader.pages)}")
if not all(len(page.extract_text()) > 200 for page in reader.pages):
    raise RuntimeError("A page has insufficient extractable text")
print(f"Created {OUTPUT}: {len(reader.pages)} pages")
