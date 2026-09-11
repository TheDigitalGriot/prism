import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

/**
 * Standalone dev server. The engine talks to the sidecar (Wiring B + the real harvest)
 * over 127.0.0.1:5178 rather than reading the filesystem through Vite, so the exact
 * same code path works when the engine is mounted inside another app — a composed host
 * supplies its own `reveal` and its own canvas, and nothing here changes.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: false,
    open: false,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
})
