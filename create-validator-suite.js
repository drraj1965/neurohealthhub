import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, "validator-suite");

// Validator definitions
const validators = [
  {
    filename: "firebase-import-validator.js",
    content: `
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "../client/src");
console.log("Scanning directory for Firebase import issues:", rootDir);

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes("from './firebase'")) {
    console.log("[ISSUE] Bad import in: " + filePath);
  }
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) scanDir(fullPath);
    else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) checkFile(fullPath);
  }
}

scanDir(rootDir);
console.log("✅ Firebase import check complete.");
`
  },
  {
    filename: "unused-imports-validator.js",
    content: `console.log("🛠️  Unused imports validator is a placeholder. Extend this as needed.");`
  },
  {
    filename: "missing-deps-validator.js",
    content: `console.log("🛠️  Missing dependencies validator is a placeholder. Extend this as needed.");`
  }
];

// Create validator-suite folder and files
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir);
}

validators.forEach(validator => {
  const filePath = path.join(baseDir, validator.filename);
  fs.writeFileSync(filePath, validator.content.trimStart(), "utf8");
  console.log("✅ Created: " + filePath);
});

console.log("🎉 Validator Suite Scaffolding Complete. Run validators from ./validator-suite");