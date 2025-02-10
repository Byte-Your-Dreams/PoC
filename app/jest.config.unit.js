
const nextJest = require('next/jest').default;

const createJestConfig = nextJest({
  dir: './',
});

module.exports = createJestConfig({
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.jest.json',
      },
    },
    testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
});