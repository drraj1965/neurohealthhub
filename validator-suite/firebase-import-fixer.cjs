import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes("@lib/firebase")) {
    content = content.replace(/@lib\\/firebase/g, "@/lib/firebase");
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("✅ Fixed:", filePath);
  }
}

function processDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isDirectory()) processDir(filePath);
    else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) fixFile(filePath);
  });
}

processDir(path.resolve(__dirname, '../client/src'));
console.log("🎉 Firebase import fixing complete.");