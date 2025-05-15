const { exec } = require('child_process');

console.log("🚀 Running build validation (vite build)...");

exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Build failed with error:\n${stderr}`);
  } else {
    console.log(`✅ Build succeeded:\n${stdout}`);
  }
});