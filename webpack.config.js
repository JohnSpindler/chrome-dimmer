const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const {DefinePluginOverride} = require('./webpack/plugins/DefinePlugin');
const WebExtPlugin = require('./webpack/plugins/WebExtPlugin');
const {DEBUG, debug, info, log, trace} = require('./env.json');
const {compilerOptions: tsconfigCompilerOptions} = require('./tsconfig.json');
const {formatAliases, formatEntries} = require('./webpack/helpers');

const noop = (..._args) => {};
const CONSTANTS = {
  APP_NAME: JSON.stringify(require('./package.json').name),
  DEBUG,
  EXTENSION_ID: 'chrome.runtime.id',
  noop,
  debug: DEBUG && debug ? 'console.debug' : `(${noop})`,
  info: DEBUG && info ? 'console.info' : `(${noop})`,
  log: DEBUG && log ? 'console.log' : `(${noop})`,
  trace: DEBUG && trace ? 'console.trace' : `(${noop})`,
};

const dir = (relativePath = '') => path.resolve(__dirname, relativePath);
const srcDir = (relativePath = '') =>
  path.resolve(`${__dirname}/src`, relativePath);

const entries = {
  contentScripts: 'brightness.ts',
  popup: 'popup.ts',
};

const formattedEntries = formatEntries(srcDir(), entries);
const formattedAliases = formatAliases(tsconfigCompilerOptions);

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
    usedExports: true,
  },
  devtool: 'inline-source-map',
  entry: formattedEntries,
  externals: ['chrome'],
  output: {
    compareBeforeEmit: true,
    filename: '[name].js',
    globalObject: 'globalThis',
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
    // @ts-ignore
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
