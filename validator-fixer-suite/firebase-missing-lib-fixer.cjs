const fs = require('fs');
const path = require('path');

function fixMissingLib(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  files.forEach(file => {
    const filePath = path.join(directory, file.name);
    if (file.isDirectory()) {
      fixMissingLib(filePath);
    } else if (file.isFile() && file.name.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      const regex = /from\s+['"](\.?\/)?firebase['"]/g;
      if (regex.test(content)) {
        const updatedContent = content.replace(regex, 'from "@/lib/firebase"');
        fs.writeFileSync(filePath, updatedContent, 'utf-8');
        console.log(`✅ Fixed import in: ${filePath}`);
      }
    }
  });
}

console.log(`🔧 Scanning directory to fix missing /lib in Firebase imports: ${path.resolve(__dirname, '../client/src')}`);
fixMissingLib(path.resolve(__dirname, '../client/src'));
console.log("🎉 Firebase /lib fix complete.");