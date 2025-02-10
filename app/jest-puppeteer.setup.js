const nextJest = require('next/jest').default;

/* @type {import('jest').Config} */
const createJestConfig = nextJest({
  dir: './',
});

/* @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-puppeteer',
  preset: 'jest-puppeteer',
};

module.exports = createJestConfig(config);