const { TextEncoder, TextDecoder } = require('util'); // This line might be problematic if jest.config.cjs is not treated as CJS by Node for some reason, but usually fine.

module.exports = {
  testEnvironment: 'jsdom', // Single testEnvironment line
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: ['node_modules/(?!(@mswjs|msw)/)'], // Correctly placed and essential
  // globals: {}, // Removed as polyfills are in jest.setup.js
  collectCoverage: true,
  coverageReporters: ["json", "lcov", "text", "clover", "html", "text-summary"],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
};
