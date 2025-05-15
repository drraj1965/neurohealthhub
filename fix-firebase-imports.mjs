// fix-firebase-imports.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process the entire project directory
const directoryToProcess = path.resolve(__dirname, ".");

// Search and replace terms
const target = '@lib/firebase';
const replacement = '@/lib/firebase';

// Function to recursively process directories
function processDirectory(dirPath, results) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath, results);
    } else if (filePath.endsWith(".js") || filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes(target)) {
        const updatedContent = content.split(target).join(replacement);
        fs.writeFileSync(filePath, updatedContent, "utf8");
        results.modified.push(filePath);
        console.log(`✅ Updated: ${filePath}`);
      } else {
        results.unchanged.push(filePath);
        console.log(`➖ No change: ${filePath}`);
      }
    }
  });
}

// Prepare results storage
const results = { modified: [], unchanged: [] };

console.log(`🔍 Scanning directory: ${directoryToProcess}`);
processDirectory(directoryToProcess, results);

// Summary Report
console.log("\n✅ Replacement Summary:");
console.log(`Modified files  : ${results.modified.length}`);
console.log(`Unchanged files : ${results.unchanged.length}`);
console.log("\n🎉 Operation complete.");