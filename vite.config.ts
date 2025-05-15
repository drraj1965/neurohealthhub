import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// Resolve __dirname properly for Windows and cross-platform
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Resolved __dirname:", __dirname);

// Correctly resolve paths
const clientPath = path.resolve(__dirname, "client");
const outDirPath = path.resolve(__dirname, "dist", "public");

console.log("Resolved root directory:", clientPath);
console.log("Resolved outDir:", outDirPath);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [import("@replit/vite-plugin-cartographer").then((m) => m.cartographer())]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: clientPath,
  build: {
    outDir: outDirPath,
    emptyOutDir: true,
  },
  server: {
    port: 0,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});