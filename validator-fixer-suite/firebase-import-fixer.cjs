const fs = require('fs');
const path = require('path');

function fixImports(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  files.forEach(file => {
    const filePath = path.join(directory, file.name);
    if (file.isDirectory()) {
      fixImports(filePath);
    } else if (file.isFile() && file.name.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes("@lib/firebase")) {
        content = content.replace(/@lib\/firebase/g, "@/lib/firebase");
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Fixed import in: ${filePath}`);
      }
    }
  });
}

console.log(`🔧 Scanning directory to fix Firebase imports: ${path.resolve(__dirname, '../client/src')}`);
fixImports(path.resolve(__dirname, '../client/src'));
console.log("🎉 Firebase import fix complete.");