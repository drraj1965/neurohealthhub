import fs from "fs";
import path from "path";

const directoryToProcess = path.resolve(__dirname, ".");

const target = '@/lib/firebase';
const replacement = '@/lib/firebase';

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith(".js") || filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
      const content = fs.readFileSync(filePath, "utf8");
      console.log(`🔄 Checking: ${filePath}`);
      if (content.includes(target)) {
        const updatedContent = content.split(target).join(replacement);
        fs.writeFileSync(filePath, updatedContent, "utf8");
        console.log(`✅ Updated: ${filePath}`);
      }
    }
  });
}

console.log(`🔍 Scanning directory: ${directoryToProcess}`);
processDirectory(directoryToProcess);
console.log("🎉 Done replacing @/lib/firebase with @/lib/firebase.");