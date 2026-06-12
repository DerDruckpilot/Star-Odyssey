import { access } from "node:fs/promises";
import path from "node:path";

const requiredPaths = [
  "package.json",
  "index.html",
  "src",
  "src/main.js",
  "src/styles.css",
  "assets",
  "docs",
  "README.md",
  ".gitignore",
  "docs/project-guidelines.md"
];

const missing = [];

for (const projectPath of requiredPaths) {
  try {
    await access(path.join(process.cwd(), projectPath));
  } catch {
    missing.push(projectPath);
  }
}

if (missing.length > 0) {
  console.error(`Missing required project paths:\n${missing.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Project structure check passed.");
}
