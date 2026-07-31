import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "json-summary"],
      exclude: ["node_modules", "tests", "**/*.d.ts", "**/*.config.*", "**/__mocks__/**"],
    },
  },
});
