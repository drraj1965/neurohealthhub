#!/usr/bin/env node

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
