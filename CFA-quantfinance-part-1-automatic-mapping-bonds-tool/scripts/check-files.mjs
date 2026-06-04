import { access } from "node:fs/promises";

const requiredFiles = [
  "CODEX.md",
  "docs/requirements.md",
  "docs/technical-spec.md",
  "docs/design-spec.md",
  "docs/scoring-model.md",
  "docs/development-process.md",
  "docs/implementation-roadmap.md",
  "app/index.html",
  "app/styles.css",
  "app/main.js",
  "app/scoring.js",
  "app/sample-data.js",
  "scripts/test-scoring.mjs",
  "scripts/dev-server.mjs"
];

const missing = [];

for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error("Missing required files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("Project scaffold check passed.");
