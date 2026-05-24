import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify({ sha: "test", branch: "test", builtAt: "test" }),
  },
  test: {
    environment: "jsdom",
    include: ["src/**/__tests__/**/*.test.tsx", "src/**/__tests__/**/*.test.ts"],
    globals: true,
    setupFiles: ["./src/__tests__/vitest.setup.ts"],
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__tests__/**",
        "src/**/index.ts",
        "src/main.tsx",
        "src/sw.ts",
        "src/**/*.d.ts",
      ],
    },
  },
});
