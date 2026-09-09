import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const projectManifestPath = join(projectRoot, "src", "data", "projects.json");
execFileSync(process.execPath, [join(projectRoot, "scripts", "build.mjs")], {
  cwd: projectRoot,
  stdio: "inherit",
});

const errors = [];
let projects = [];

try {
  projects = JSON.parse(readFileSync(projectManifestPath, "utf8"));
} catch (error) {
  errors.push(`项目清单无法解析：${error.message}`);
}

if (!Array.isArray(projects) || projects.length === 0) {
  errors.push("项目清单至少需要一个项目");
} else {
  const requiredFields = [
    "id",
    "number",
    "tone",
    "kicker",
    "name",
    "englishName",
    "stage",
    "role",
    "description",
    "image",
    "imageAlt",
    "entryUrl",
    "entryLabel",
  ];
  const ids = projects.map((project) => project.id);
  const duplicateProjectIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateProjectIds.length) errors.push(`项目清单存在重复 id：${duplicateProjectIds.join("、")}`);

  for (const project of projects) {
    const missingFields = requiredFields.filter((field) => typeof project[field] !== "string" || !project[field].trim());
    if (missingFields.length) errors.push(`项目 ${project.id || "未知"} 缺少字段：${missingFields.join("、")}`);
    if (!Array.isArray(project.proofs) || project.proofs.length < 3) {
      errors.push(`项目 ${project.id || "未知"} 至少需要 3 条工程亮点`);
    }
    if (!Array.isArray(project.tech) || project.tech.length === 0) {
      errors.push(`项目 ${project.id || "未知"} 至少需要 1 个技术标签`);
    }
    if (typeof project.entryUrl === "string" && !project.entryUrl.startsWith("https://")) {
      errors.push(`项目 ${project.id || "未知"} 的在线入口必须使用 HTTPS`);
    }
    if (typeof project.image === "string" && project.image.startsWith("./")) {
      const imagePath = join(projectRoot, project.image.slice(2));
      if (!existsSync(imagePath)) errors.push(`项目 ${project.id || "未知"} 截图不存在：${project.image}`);
    }
  }
}

for (const page of ["index.html", "playground.html"]) {
  const html = readFileSync(join(projectRoot, page), "utf8");

  if (html.includes("@include")) {
    errors.push(`${page} 中仍有未展开的 include`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) {
    errors.push(`${page} 存在重复 id：${duplicateIds.join("、")}`);
  }

  for (const match of html.matchAll(/\s(?:href|src)="(\.\/[^"#?]+)(?:[?#][^"]*)?"/g)) {
    const target = join(projectRoot, match[1].slice(2));
    if (!existsSync(target)) errors.push(`${page} 本地资源不存在：${match[1]}`);
  }
}

for (const name of readdirSync(join(projectRoot, "scripts"))) {
  if (extname(name) !== ".js") continue;
  const source = readFileSync(join(projectRoot, "scripts", name), "utf8");
  try {
    new Function(source);
  } catch (error) {
    errors.push(`${name} 语法错误：${error.message}`);
  }
}

for (const name of readdirSync(join(projectRoot, "styles"))) {
  if (extname(name) !== ".css") continue;
  const source = readFileSync(join(projectRoot, "styles", name), "utf8");
  const openings = (source.match(/\{/g) ?? []).length;
  const closings = (source.match(/\}/g) ?? []).length;
  if (openings !== closings) {
    errors.push(`${name} 的花括号不平衡：${openings} 个 {，${closings} 个 }`);
  }
}

if (errors.length) {
  console.error(errors.map((message) => `- ${message}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("结构与本地资源检查通过");
}
