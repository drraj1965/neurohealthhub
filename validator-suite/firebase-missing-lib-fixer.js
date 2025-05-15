// validator-suite/firebase-missing-lib-fixer.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Proper __dirname resolution for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target directory
const directoryToProcess = path.resolve(__dirname, "../client/src");

console.log(`🔧 Scanning directory to fix missing /lib in Firebase imports: ${directoryToProcess}`);

let updatedFilesCount = 0;

// Recursive file processing function
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".js")) {
      let content = fs.readFileSync(filePath, "utf8");
      const updatedContent = content.replace(
        /(from\s+['"](?:@\/)?(?:\.{0,2}\/)?firebase['"])/g,
        "from '@/lib/firebase'"
      );

      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, "utf8");
        console.log(`✅ Fixed import in: ${filePath}`);
        updatedFilesCount++;
      }
    }
  });
}

processDirectory(directoryToProcess);
console.log(`🎉 Firebase /lib fix complete. Files updated: ${updatedFilesCount};`);