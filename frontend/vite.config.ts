import path from "path"

import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const basePath = process.env.FRONTEND_BASE_PATH || env.FRONTEND_BASE_PATH
  const appNodeModules = path.resolve(__dirname, "./node_modules")

  if (!basePath) {
    throw new Error("FRONTEND_BASE_PATH is required. Use an app-specific placeholder value.")
  }

  return {
    plugins: [
      react(),
      {
        transformIndexHtml: {
          order: "post",
          handler(html) {
            // Support both %KEY% and __KEY__ formats
            return html.replace(/(?:%|__)(\w+)(?:%|__)/g, (_, key) => env[key] || process.env[key] || "")
          },
        },
        async closeBundle() {
          const fs = await import("fs");
          const manifestPath = path.resolve(__dirname, "dist/manifest.json");
          if (fs.existsSync(manifestPath)) {
            let content = fs.readFileSync(manifestPath, "utf-8");
            // Replace both %VITE_...% and %FRONTEND_BASE_PATH% or __...__ style placeholders
            content = content.replace(/(?:%|__)(\w+)(?:%|__)/g, (_, key) => {
              return env[key] || process.env[key] || "";
            });
            fs.writeFileSync(manifestPath, content);
          }
        },
      },
    ],
    base: basePath,
    resolve: {
      alias: {
        "@radix-ui": path.resolve(appNodeModules, "@radix-ui"),
        "@hookform": path.resolve(appNodeModules, "@hookform"),
        "react-hook-form": path.resolve(appNodeModules, "react-hook-form"),
        "react-day-picker": path.resolve(appNodeModules, "react-day-picker"),
        "date-fns": path.resolve(appNodeModules, "date-fns"),
        "class-variance-authority": path.resolve(appNodeModules, "class-variance-authority"),
        "clsx": path.resolve(appNodeModules, "clsx"),
        "tailwind-merge": path.resolve(appNodeModules, "tailwind-merge"),
        "lucide-react": path.resolve(appNodeModules, "lucide-react"),
        "sonner": path.resolve(appNodeModules, "sonner"),
        "zod": path.resolve(appNodeModules, "zod"),
        "react": path.resolve(appNodeModules, "react"),
        "react-dom": path.resolve(appNodeModules, "react-dom"),
        "react-router-dom": path.resolve(appNodeModules, "react-router-dom"),
        "@ui-core": path.resolve(__dirname, "./packages/ui-core/src"),
        "@ui-shell": path.resolve(__dirname, "./packages/ui-shell/src"),
        "@ui-tokens": path.resolve(__dirname, "./packages/ui-tokens/src"),
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      fs: {
        allow: [path.resolve(__dirname, "../../../")],
      },
    },
    build: {
      outDir: "dist",
    },
  }
})
