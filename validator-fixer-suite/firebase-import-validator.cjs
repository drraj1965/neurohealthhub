const fs = require('fs');
const path = require('path');

function validateImports(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  files.forEach(file => {
    const filePath = path.join(directory, file.name);
    if (file.isDirectory()) {
      validateImports(filePath);
    } else if (file.isFile() && file.name.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes("@lib/firebase")) {
        console.log(`❌ Issue in ${filePath}: Found '@lib/firebase'`);
      }
    }
  });
}

console.log(`🔍 Scanning directory: ${path.resolve(__dirname, '../client/src')}`);
validateImports(path.resolve(__dirname, '../client/src'));
console.log("✅ Validation complete.");