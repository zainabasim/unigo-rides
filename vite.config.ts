import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // Vercel deployment - use root path
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false,
    },
    historyApiFallback: true,
  },
  build: {
    outDir: "dist",
    // Source maps help debug blank pages, but can be set to false once fixed
    sourcemap: true, 
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Ensure proper asset handling for GitHub Pages
    assetsDir: 'assets',
    // Generate .nojekyll file to prevent GitHub Pages from processing with Jekyll
    emptyOutDir: true,
  },
}));