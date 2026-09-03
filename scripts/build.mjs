import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(projectRoot, "src");
const entryPath = join(sourceRoot, "index.html");
const outputPath = join(projectRoot, "index.html");
const includePattern = /^[\t ]*<!-- @include ([^\s]+) -->[\t ]*$/gm;

const render = (content, parents = []) =>
  content.replace(includePattern, (_, relativePath) => {
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

const source = readFileSync(entryPath, "utf8");
const generatedNotice = "<!-- 此文件由 npm run build 生成，请修改 src 下的源码。 -->";
const output = render(source).replace("<!doctype html>", `<!doctype html>\n${generatedNotice}`);
const previous = existsSync(outputPath) ? readFileSync(outputPath, "utf8") : "";

if (previous !== output) {
  writeFileSync(outputPath, output, "utf8");
  console.log("已生成 index.html");
} else {
  console.log("index.html 已是最新版本");
}
