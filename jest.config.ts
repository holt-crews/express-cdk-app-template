import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  clearMocks: true,
  verbose: true,
  roots: ["src"],
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  testTimeout: 50000,
};

config.setupFiles = [
  "./src/__tests__/setupEnvVars.ts",
  "./src/__tests__/setupConfig.ts",
];

export default config;
