import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { execSync } from "node:child_process";

function resolveVersion(): { sha: string; branch: string; builtAt: string } {
  const builtAt = new Date().toISOString();
  const envSha =
    process.env["CF_PAGES_COMMIT_SHA"] ??
    process.env["GITHUB_SHA"] ??
    process.env["VERCEL_GIT_COMMIT_SHA"];
  const envBranch =
    process.env["CF_PAGES_BRANCH"] ??
    process.env["GITHUB_REF_NAME"] ??
    process.env["VERCEL_GIT_COMMIT_REF"];
  if (envSha) {
    return { sha: envSha.slice(0, 7), branch: envBranch ?? "?", builtAt };
  }
  try {
    const sha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
    return { sha, branch, builtAt };
  } catch {
    return { sha: "dev", branch: "dev", builtAt };
  }
}

const version = resolveVersion();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-maskable.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff,woff2,ico,png}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/__\//, /^\/api\//, /^\/login/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: "Veterinario",
        short_name: "Veterinario",
        description: "Gestionale per attività di studio veterinario.",
        theme_color: "#1e3a8a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "it",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icon-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
