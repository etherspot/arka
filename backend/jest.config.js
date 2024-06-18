/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/js-with-ts-esm",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(data-uri-to-buffer|formdata-polyfill|fetch-blob|node-fetch)/)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/build/"],
  resetModules: true,
  testTimeout: 90000,
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 75,
      functions: 100,
      lines: 95,
    },
  },
  coveragePathIgnorePatterns: ["src/server.ts", "src/plugins/config.ts"],
  collectCoverage: true,
  coverageReporters: ["lcov", "text"],
};
