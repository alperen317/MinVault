module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude server startup file
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  testTimeout: 30000,
  verbose: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/'
  ]
};