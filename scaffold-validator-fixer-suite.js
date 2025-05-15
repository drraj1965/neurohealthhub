import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folderPath = path.resolve(__dirname, 'validator-fixer-suite');

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
  console.log(`📂 Created folder: ${folderPath}`);
}

const files = [
  {
    name: 'firebase-import-validator.js',
    content: `// Validate incorrect @lib/firebase usage
import fs from 'fs';
import path from 'path';

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
`
  },
  {
    name: 'firebase-import-fixer.js',
    content: `// Auto-fix incorrect @lib/firebase usage
import fs from 'fs';
import path from 'path';

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
`
  }
];

// Write files
files.forEach(file => {
  const filePath = path.join(folderPath, file.name);
  fs.writeFileSync(filePath, file.content, 'utf-8');
  console.log(`✅ Created: ${filePath}`);
});

console.log('🎉 Validator-Fixer Suite Scaffolding Complete.');