module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'miniprogram/services/**/*.js',
    'miniprogram/utils/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
    },
  },
  // 微信小程序 API mock 在 tests/setup.js 中处理
  setupFiles: ['./tests/setup.js'],
}
