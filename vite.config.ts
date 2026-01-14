import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    build: {
      outDir: 'build'
    },
    server: {
      port: 8080,
      host: '0.0.0.0',
      allowedHosts: true
    },
    define: {
      // Some legacy code expects this CRA-style env var to exist.
      // Vite's define requires a concrete string value, so we default to an empty string.
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(env.REACT_APP_BACKEND_URL ?? ""),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});