/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',

  testPathIgnorePatterns: [
      '/node_modules/',
      '/build/'
  ],
  resetModules: true,
  testTimeout: 30000,
  coverageThreshold: {
      global: {
          statements: 95,
          branches: 75,
          functions: 100,
          lines: 95,
      },
  },
  coveragePathIgnorePatterns: [
      'src/server.ts',
      'src/plugins/config.ts',
  ],
}