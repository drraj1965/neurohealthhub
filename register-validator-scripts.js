import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

packageJson.scripts = {
  ...packageJson.scripts,
  "validate:firebase-imports": "node validator-suite/firebase-import-validator.js",
  "validate:unused-imports": "node validator-suite/unused-imports-validator.js",
  "validate:missing-deps": "node validator-suite/missing-deps-validator.js",
  "validate:all": "npm run validate:firebase-imports && npm run validate:unused-imports && npm run validate:missing-deps"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
console.log("✅ Validator scripts added to package.json");