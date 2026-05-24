import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/__tests__/**",
        "src/**/index.ts",
        "src/testing/**",
        "src/domain/entities/**",
        "src/domain/ports/**",
      ],
    },
  },
});
