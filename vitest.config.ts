import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    setupFiles: ["tests/setup.ts"],
    hookTimeout: 60000,
  },
});
