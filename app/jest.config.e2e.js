module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/__tests__/**/*.e2e.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest-puppeteer.setup.js'],
};