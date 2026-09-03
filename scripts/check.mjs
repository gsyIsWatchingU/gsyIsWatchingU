import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, [join(projectRoot, "scripts", "build.mjs")], {
  cwd: projectRoot,
  stdio: "inherit",
});

const html = readFileSync(join(projectRoot, "index.html"), "utf8");
const errors = [];

if (html.includes("@include")) {
  errors.push("index.html 中仍有未展开的 include");
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) {
  errors.push(`存在重复 id：${duplicateIds.join("、")}`);
}

for (const match of html.matchAll(/\s(?:href|src)="(\.\/[^"#?]+)(?:[?#][^"]*)?"/g)) {
  const target = join(projectRoot, match[1].slice(2));
  if (!existsSync(target)) errors.push(`本地资源不存在：${match[1]}`);
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
