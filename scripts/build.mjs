import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(projectRoot, "src");
const includePattern = /^[\t ]*<!-- @include ([^\s]+) -->[\t ]*$/gm;
const projectsPattern = /^[\t ]*<!-- @projects -->[\t ]*$/gm;
const entries = ["index.html", "playground.html"];
const projects = JSON.parse(readFileSync(join(sourceRoot, "data", "projects.json"), "utf8"));

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderProject = (project) => {
  const proofItems = project.proofs
    .map(
      (proof) => `
                  <div class="product-proof">
                    <span>${escapeHtml(proof.label)}</span>
                    <p>${escapeHtml(proof.text)}</p>
                  </div>`,
    )
    .join("");
  const techItems = project.tech.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  const secondaryAction = project.secondaryUrl
    ? `
                  <a class="project-action project-action--secondary magnetic" href="${escapeHtml(project.secondaryUrl)}">
                    ${escapeHtml(project.secondaryLabel)} <span aria-hidden="true">→</span>
                  </a>`
    : "";

  return `            <article class="product-card product-card--${escapeHtml(project.tone)} reveal">
              <header class="product-card__head">
                <span class="product-card__number">${escapeHtml(project.number)}</span>
                <div>
                  <p>${escapeHtml(project.kicker)}</p>
                  <span>${escapeHtml(project.stage)}</span>
                </div>
              </header>

              <div class="product-card__layout">
                <div class="product-card__content">
                  <p class="product-card__role">${escapeHtml(project.role)}</p>
                  <h3>${escapeHtml(project.name)}<small>${escapeHtml(project.englishName)}</small></h3>
                  <p class="product-card__description">${escapeHtml(project.description)}</p>

                  <div class="product-card__proofs">${proofItems}
                  </div>

                  <div class="tag-row">${techItems}</div>

                  <div class="product-card__actions">
                    <a class="project-action project-action--primary magnetic" href="${escapeHtml(project.entryUrl)}" target="_blank" rel="noreferrer">
                      ${escapeHtml(project.entryLabel)} <span aria-hidden="true">↗</span>
                    </a>${secondaryAction}
                  </div>
                </div>

                <a class="product-card__visual" href="${escapeHtml(project.entryUrl)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(project.entryLabel)}（新窗口打开）">
                  <span class="product-card__browser-bar" aria-hidden="true"><i></i><i></i><i></i><b>LIVE PRODUCT</b></span>
                  <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt)}" width="1440" height="900" loading="lazy" />
                  <span class="product-card__visual-note">临时演示地址 <b aria-hidden="true">↗</b></span>
                </a>
              </div>
            </article>`;
};

const renderProjects = () => projects.map(renderProject).join("\n");

const render = (content, parents = []) => {
  const withIncludes = content.replace(includePattern, (_, relativePath) => {
    const includePath = resolve(sourceRoot, relativePath);
    const scopedPath = relative(sourceRoot, includePath);
    if (scopedPath.startsWith("..") || isAbsolute(scopedPath)) {
      throw new Error(`include 路径超出 src 目录：${relativePath}`);
    }
    if (parents.includes(includePath)) {
      throw new Error(`检测到循环 include：${[...parents, includePath].join(" -> ")}`);
    }
    const fragment = readFileSync(includePath, "utf8").trimEnd();
    return render(fragment, [...parents, includePath]);
  });
  return withIncludes.replace(projectsPattern, renderProjects);
};

const generatedNotice = "<!-- 此文件由 npm run build 生成，请修改 src 下的源码。 -->";
for (const entry of entries) {
  const entryPath = join(sourceRoot, entry);
  const outputPath = join(projectRoot, entry);
  const source = readFileSync(entryPath, "utf8");
  const output = render(source).replace("<!doctype html>", `<!doctype html>\n${generatedNotice}`);
  const previous = existsSync(outputPath) ? readFileSync(outputPath, "utf8") : "";

  if (previous !== output) {
    writeFileSync(outputPath, output, "utf8");
    console.log(`已生成 ${entry}`);
  } else {
    console.log(`${entry} 已是最新版本`);
  }
}
