#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Locate paths
const suiteDir = path.resolve(__dirname, 'validator-fixer-suite');
const packageJsonPath = path.resolve(__dirname, 'package.json');

// Verify suite directory exists
if (!fs.existsSync(suiteDir)) {
  console.error("❌ Validator-Fixer Suite directory not found.");
  process.exit(1);
}

// Prebuild Validator Script Content
const prebuildValidatorPath = path.join(suiteDir, 'prebuild-validator.cjs');
const prebuildScriptContent = `#!/usr/bin/env node

console.log("🔍 Starting Pre-Build Validation Suite...");

const { execSync } = require('child_process');

try {
  execSync('npm run validate:firebase-imports', { stdio: 'inherit' });
  execSync('npm run validate:firebase-imports:fix', { stdio: 'inherit' });
  execSync('npm run validate:firebase-lib-fix', { stdio: 'inherit' });
  console.log("✅ Pre-Build Validation Suite Complete.");
  process.exit(0);
} catch (error) {
  console.error("❌ Pre-Build Validation Failed:", error.message);
  process.exit(1);
}
`;

// Write script file
fs.writeFileSync(prebuildValidatorPath, prebuildScriptContent);
console.log(`✅ Created: ${prebuildValidatorPath}`);

// Update package.json with prebuild validator script
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts = {
  ...packageJson.scripts,
  "validate:prebuild": "node validator-fixer-suite/prebuild-validator.cjs"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log("✅ Updated package.json with validate:prebuild script");

console.log("🎉 Pre-Build Validator Scaffold Complete.");