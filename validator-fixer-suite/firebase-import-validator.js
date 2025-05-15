import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanAndReport(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes("@lib/firebase")) {
    console.log("❌ Issue detected in:", filePath);
  } else {
    console.log("✅ No issues in:", filePath);
  }
}

function processDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isDirectory()) processDir(filePath);
    else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) scanAndReport(filePath);
  });
}

processDir(path.resolve(__dirname, '../client/src'));
console.log("🎉 Firebase import validation complete.");