const jestJupyterLab = require('@jupyterlab/testutils/lib/jest-config');

const esModules = [
  '@codemirror',
  '@jupyter/react-components',
  '@jupyter/web-components',
  '@jupyter/ydoc',
  '@jupyterlab/',
  '@equation-forge/',
  'lib0',
  'nanoid',
  'vscode-ws-jsonrpc',
  'y-protocols',
  'y-websocket',
  'yjs'
].join('|');

const baseConfig = jestJupyterLab(__dirname);

module.exports = {
  ...baseConfig,
  automock: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/.ipynb_checkpoints/*'
  ],
  coverageReporters: ['lcov', 'text'],
  moduleNameMapper: {
    '^@equation-forge/ui$':
      '<rootDir>/node_modules/@equation-forge/ui/dist/index.js',
    '^@equation-forge/core/ast$':
      '<rootDir>/node_modules/@equation-forge/core/dist/math/ast/index.js',
    '^@equation-forge/core/compile$':
      '<rootDir>/node_modules/@equation-forge/core/dist/math/compile/index.js',
    '^@equation-forge/core/latex$':
      '<rootDir>/node_modules/@equation-forge/core/dist/math/adapters/latex/index.js',
    '^@equation-forge/core/rewrite$':
      '<rootDir>/node_modules/@equation-forge/core/dist/math/rewrite/index.js',
    '^@equation-forge/core/selection$':
      '<rootDir>/node_modules/@equation-forge/core/dist/math/selection/index.js',
    '^mathlive$': '<rootDir>/node_modules/mathlive/mathlive.js'
  },
  testRegex: 'src/.*/.*.spec.ts[x]?$',
  transformIgnorePatterns: [`/node_modules/(?!${esModules}).+`]
};
