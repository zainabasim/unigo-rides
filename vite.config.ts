import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Ensures assets are linked correctly in the Vercel production build
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
  },
});