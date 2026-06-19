import { access } from "node:fs/promises";
import path from "node:path";
import {
  importedOutpostVisualLayoutFiles,
  outpostVisualLayouts
} from "../src/data/outpostVisualLayouts.js";

const requiredPaths = [
  "package.json",
  "index.html",
  "src",
  "src/data",
  "src/data/boardLayout.js",
  "src/data/buildCosts.js",
  "src/data/numberTokens.js",
  "src/data/outpostVisualLayouts.js",
  "src/game",
  "src/game/gameState.js",
  "src/main.js",
  "src/i18n.js",
  "src/styles.css",
  "assets",
  "docs",
  "README.md",
  ".gitignore",
  "docs/project-guidelines.md"
];

const missing = [];
const layoutIssues = [];

for (const projectPath of requiredPaths) {
  try {
    await access(path.join(process.cwd(), projectPath));
  } catch {
    missing.push(projectPath);
  }
}

if (importedOutpostVisualLayoutFiles.length !== 8) {
  layoutIssues.push(`Expected 8 imported outpost layout files, found ${importedOutpostVisualLayoutFiles.length}.`);
}

for (const outpostType of ["greenPeople", "diplomats", "traders", "wisePeople"]) {
  for (const layoutType of ["twoTopOneBottom", "oneTopTwoBottom"]) {
    const layout = outpostVisualLayouts[outpostType]?.[layoutType];
    if (!layout) {
      layoutIssues.push(`Missing outpost layout for ${outpostType}/${layoutType}.`);
      continue;
    }
    if (!layout.outpost) layoutIssues.push(`Missing outpost transform for ${outpostType}/${layoutType}.`);
    if ((layout.tradeStations ?? []).length !== 5) {
      layoutIssues.push(`Expected 5 trade station slots for ${outpostType}/${layoutType}.`);
    }
  }
}

if (missing.length > 0 || layoutIssues.length > 0) {
  const messages = [];
  if (missing.length > 0) messages.push(`Missing required project paths:\n${missing.join("\n")}`);
  if (layoutIssues.length > 0) messages.push(`Outpost layout issues:\n${layoutIssues.join("\n")}`);
  console.error(messages.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log("Project structure check passed.");
}
