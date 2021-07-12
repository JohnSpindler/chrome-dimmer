const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const {DefinePluginOverride} = require('./webpack/DefinePlugin');
const WebExtPlugin = require('./webpack/WebExtPlugin');
const {DEBUG} = require('./env.json');
const {compilerOptions: tsconfigCompilerOptions} = require('./tsconfig.json');

const noop = (..._args) => {};
const CONSTANTS = {
  APP_NAME: JSON.stringify(require('./package.json').name),
  DEBUG,
  EXTENSION_ID: 'chrome.runtime.id',
  NOOP: noop,
  debug: DEBUG ? 'console.debug' : `(${noop})`,
  trace: DEBUG ? 'console.trace' : `(${noop})`,
};

const dir = (relativePath = '') => path.resolve(__dirname, relativePath);
const srcDir = (relativePath = '') =>
  path.resolve(`${__dirname}/src`, relativePath);

const entries = {
  contentScripts: 'brightness.ts',
  popup: 'popup.ts',
};

const entryKeys = /** @type {(keyof entries)[]} */ (Object.keys(entries));
const formattedEntries = entryKeys.reduce((acc, cur) => {
  const newKey = `${cur}/bundle`;
  const currentValues = entries[cur];
  const newVals = (Array.isArray(currentValues)
    ? /** @type {string[]} */ (currentValues)
    : [currentValues]
  ).map((v) => srcDir(`${cur}/${v}`));
  return {...acc, [newKey]: newVals};
}, {});

const formattedAliases = (() => {
  const tsconfigPaths = tsconfigCompilerOptions.paths;
  const tsconfigBase = tsconfigCompilerOptions.baseUrl;
  return Object.keys(tsconfigPaths).reduce((aliases, aliasName) => {
    // paths associated with current key
    const aliasPaths = tsconfigPaths[aliasName] || [];
    // remove wildcards (not compatible with webpack mappings)
    // and resolve paths as absolute
    const formattedPaths = aliasPaths.map((aliasPath) =>
      path.resolve(tsconfigBase, aliasPath.replace(/\/\*$/, ''))
    );
    // remove wildcard (not compatible with webpack mappings)
    const webpackAliasName = aliasName.replace(/\/\*$/, '');

    return {
      ...aliases,
      [webpackAliasName]: formattedPaths,
    };
  }, {});
})();

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'development',
  optimization: {
    chunkIds: 'named',
    concatenateModules: true,
    emitOnErrors: false,
    flagIncludedChunks: true,
    innerGraph: true,
    mangleExports: false,
    minimize: false,
    moduleIds: 'named',
    portableRecords: true,
    providedExports: true,
    removeAvailableModules: true,
    removeEmptyChunks: false,
    sideEffects: true, // requires `{providedExports: true}`
    usedExports: false,
  },
  devtool: 'inline-source-map',
  entry: formattedEntries,
  externals: ['chrome'],
  output: {
    compareBeforeEmit: true,
    crossOriginLoading: 'anonymous',
    filename: '[name].js',
    globalObject: 'globalThis',
    iife: true,
    module: false,
    path: dir('dist'),
    pathinfo: 'verbose',
    devtoolModuleFilenameTemplate: (info) => {
      return info.resourcePath.replace('./src', '');
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: /** @type {import('ts-loader').Options} */ ({
              configFile: 'tsconfig.build.json',
              logLevel: 'INFO',
            }),
          },
        ],
      },
    ],
  },
  plugins: [
    new DefinePluginOverride(CONSTANTS),
    new CopyPlugin({
      patterns: [
        {
          from: dir('manifest.json'),
          to: dir('dist'),
        },
        {
          from: srcDir('popup/contrasticon.png'),
          to: dir('dist/popup'),
        },
        {
          from: srcDir('popup/popup.html'),
          to: dir('dist/popup'),
        },
      ],
    }),
    new WebExtPlugin(),
    function LogTimePlugin() {
      this.hooks.afterDone.tap('LogTimePlugin', () => {
        console.log(`\n[${new Date().toLocaleString()}] --- DONE.\n`);
      });
    },
  ],
  resolve: {
    alias: formattedAliases,
    extensions: ['.ts'],
  },
  stats: {
    builtAt: true,
    entrypoints: true,
    errorDetails: true,
    modules: false,
    timings: true,
  },
};

module.exports = config;
