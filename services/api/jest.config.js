/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  // The NestJS DI decorators (@Injectable) are harmless at test time;
  // we instantiate the class directly.
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.spec.json",
      },
    ],
  },
  // Prisma client is mocked — we only test pure rule logic.
  moduleNameMapper: {
    "^@prisma/client$": "<rootDir>/__mocks__/@prisma/client.ts",
  },
  // The existing inventory-rules.engine.spec.ts uses node:test (run via
  // `npm run rules:test` with tsx). Exclude it from Jest so both runners
  // can coexist without conflict.
  testPathIgnorePatterns: ["/node_modules/", "inventory-rules\\.engine\\.spec\\.ts$"],
};
