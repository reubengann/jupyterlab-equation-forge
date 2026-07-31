const jestJupyterLab = require('@jupyterlab/testutils/lib/jest-config');

const esModules = [
  '@codemirror',
  '@jupyter/react-components',
  '@jupyter/web-components',
  '@jupyter/ydoc',
  '@jupyterlab/',
  '@physics-derivation-pad/',
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
    '^@physics-derivation-pad/ui$':
      '<rootDir>/node_modules/@physics-derivation-pad/ui/dist/index.js',
    '^@physics-derivation-pad/core/ast$':
      '<rootDir>/node_modules/@physics-derivation-pad/core/dist/math/ast/index.js',
    '^@physics-derivation-pad/core/compile$':
      '<rootDir>/node_modules/@physics-derivation-pad/core/dist/math/compile/index.js',
    '^@physics-derivation-pad/core/latex$':
      '<rootDir>/node_modules/@physics-derivation-pad/core/dist/math/adapters/latex/index.js',
    '^@physics-derivation-pad/core/rewrite$':
      '<rootDir>/node_modules/@physics-derivation-pad/core/dist/math/rewrite/index.js',
    '^mathlive$': '<rootDir>/node_modules/mathlive/mathlive.js'
  },
  testRegex: 'src/.*/.*.spec.ts[x]?$',
  transformIgnorePatterns: [`/node_modules/(?!${esModules}).+`]
};
