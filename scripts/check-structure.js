import { access, readFile } from "node:fs/promises";
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
  "assets/source/ui/menu/raw",
  "docs",
  "README.md",
  ".gitignore",
  "docs/project-guidelines.md",
  "docs/rule-sources.md",
  "docs/star-odyssey-rule-decisions.md",
  "docs/rules/supernova/star_odyssey_supernova_regelwerk.md",
  "docs/rules/supernova/star_odyssey_supernova_missionskarten.md"
];

const missing = [];
const layoutIssues = [];
const productionSourceIssues = [];
const assetIssues = [];

for (const projectPath of requiredPaths) {
  try {
    await access(path.join(process.cwd(), projectPath));
  } catch {
    missing.push(projectPath);
  }
}

for (const projectPath of ["src/main.js", "src/controller.js", "src/remote/controllerState.js"]) {
  const source = await readFile(path.join(process.cwd(), projectPath), "utf8");
  if (source.includes("console.debug(")) {
    productionSourceIssues.push(`${projectPath} contains unconditional console.debug output.`);
  }
}

const publicMenuRawPath = path.join(process.cwd(), "public/assets/ui/menu/raw");
try {
  await access(publicMenuRawPath);
  assetIssues.push("Menu source assets must not exist below public/assets/ui/menu/raw.");
} catch {
  // Expected: editable source files live outside the web root.
}

const menuManifestPath = path.join(process.cwd(), "public/assets/ui/menu/processed/menu-assets.manifest.json");
const menuManifest = JSON.parse(await readFile(menuManifestPath, "utf8"));
for (const asset of menuManifest.assets ?? []) {
  if (!String(asset.sourceRawFile).startsWith("assets/source/ui/menu/raw/")) {
    assetIssues.push(`${asset.assetKey} has a source outside assets/source/ui/menu/raw.`);
  }
  for (const [field, projectPath] of [["sourceRawFile", asset.sourceRawFile], ["finalPath", asset.finalPath]]) {
    try {
      await access(path.join(process.cwd(), String(projectPath)));
    } catch {
      assetIssues.push(`${asset.assetKey} references missing ${field}: ${projectPath}`);
    }
  }
}

const pagesWorkflow = await readFile(path.join(process.cwd(), ".github/workflows/deploy-pages.yml"), "utf8");
if (!pagesWorkflow.includes("--exclude 'source/'") || !pagesWorkflow.includes("--exclude 'incoming/'")) {
  assetIssues.push("GitHub Pages deployment must exclude editable source and incoming assets.");
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

if (missing.length > 0 || layoutIssues.length > 0 || productionSourceIssues.length > 0 || assetIssues.length > 0) {
  const messages = [];
  if (missing.length > 0) messages.push(`Missing required project paths:\n${missing.join("\n")}`);
  if (layoutIssues.length > 0) messages.push(`Outpost layout issues:\n${layoutIssues.join("\n")}`);
  if (productionSourceIssues.length > 0) messages.push(`Production source issues:\n${productionSourceIssues.join("\n")}`);
  if (assetIssues.length > 0) messages.push(`Asset structure issues:\n${assetIssues.join("\n")}`);
  console.error(messages.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log("Project structure check passed.");
}
