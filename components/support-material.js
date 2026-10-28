import { getSupportMaterials } from "../core/content-catalog.js";

const availabilityByUrl = new Map();

function getContentType(response) {
  return response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
}

async function inspectPdfResponse(response) {
  if (!response.ok) return false;
  const contentType = getContentType(response);
  if (contentType === "application/pdf") {
    await response.body?.cancel();
    return true;
  }
  if (contentType !== "application/octet-stream" || !response.body) {
    await response.body?.cancel();
    return false;
  }

  const reader = response.body.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  return value && new TextDecoder().decode(value.slice(0, 5)) === "%PDF-";
}

async function checkPdfAvailability(url) {
  if (!availabilityByUrl.has(url)) {
    availabilityByUrl.set(url, (async () => {
      try {
        const headResponse = await fetch(url, { method: "HEAD", cache: "no-store" });
        const headContentType = getContentType(headResponse);
        if (headResponse.ok && headContentType === "application/pdf") return true;
        if (![405, 501].includes(headResponse.status) && headContentType !== "application/octet-stream") return false;

        const rangeResponse = await fetch(url, {
          headers: { Range: "bytes=0-4" },
          cache: "no-store"
        });
        return inspectPdfResponse(rangeResponse);
      } catch (error) {
        return false;
      }
    })());
  }

  return availabilityByUrl.get(url);
}

async function resolvePdfUrl(path) {
  // Vite publica public/ na raiz do build. O fallback cobre o GitHub Pages
  // configurado para servir diretamente a raiz do repositório.
  const candidates = [path, `public/${path}`]
    .map((candidate) => new URL(candidate, document.baseURI).href);

  for (const url of candidates) {
    if (await checkPdfAvailability(url)) return url;
  }

  return null;
}

function createLink(className, href, text) {
  const link = document.createElement("a");
  link.className = className;
  link.href = href;
  link.textContent = text;
  return link;
}

class QASupportMaterial extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";
    this.render();
  }

  async render() {
    const missionId = this.getAttribute("mission-id");
    const materials = getSupportMaterials(missionId);

    if (!materials.length) {
      this.hidden = true;
      return;
    }

    this.hidden = false;
    this.setAttribute("aria-label", materials.length === 1 ? "Material de apoio" : "Materiais de apoio");
    this.replaceChildren(...materials.map((material) => this.renderMaterial(material)));
  }

  renderMaterial(material) {
    const article = document.createElement("article");
    article.className = "support-material";

    const icon = document.createElement("span");
    icon.className = "support-material__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "PDF";

    const copy = document.createElement("div");
    copy.className = "support-material__copy";
    const eyebrow = document.createElement("span");
    eyebrow.className = "support-material__eyebrow";
    eyebrow.textContent = "MATERIAL DE APOIO · OPCIONAL";
    const title = document.createElement("strong");
    title.textContent = material.title;
    const description = document.createElement("p");
    description.textContent = material.description;
    copy.append(eyebrow, title, description);

    const actions = document.createElement("div");
    actions.className = "support-material__actions";
    const status = document.createElement("span");
    status.className = "support-material__status";
    status.setAttribute("role", "status");
    status.textContent = "Verificando disponibilidade…";
    actions.append(status);

    article.append(icon, copy, actions);
    this.resolveActions(material, actions, status);
    return article;
  }

  async resolveActions(material, actions, status) {
    const url = await resolvePdfUrl(material.path);

    if (!this.isConnected) return;
    if (!url) {
      status.textContent = "Material indisponível no momento.";
      return;
    }

    status.remove();
    const viewLink = createLink("support-material__link support-material__link--primary", url, "Visualizar aula (PDF)");
    viewLink.target = "_blank";
    viewLink.rel = "noopener";
    viewLink.setAttribute("aria-label", `${material.title}: visualizar aula em PDF (abre em nova aba)`);

    const downloadLink = createLink("support-material__link", url, "Baixar PDF");
    downloadLink.download = material.filename;
    downloadLink.setAttribute("aria-label", `${material.title}: baixar PDF`);
    actions.append(viewLink, downloadLink);
  }
}

if (!customElements.get("qa-support-material")) {
  customElements.define("qa-support-material", QASupportMaterial);
}
