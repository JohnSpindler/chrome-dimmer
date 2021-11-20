const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const {ProvidePlugin} = require('webpack');
const {DefinePluginOverride} = require('./webpack/plugins/DefinePlugin');
const WebExtPlugin = require('./webpack/plugins/WebExtPlugin');
const {formatAliases} = require('./webpack/helpers');
const {DEBUG, debug, info, log, trace} = require('./env.json');

const CONSTANTS = {
  APP_NAME: JSON.stringify(require('./package.json').name),
  DEBUG,
  EXTENSION_ID: 'chrome.runtime.id',
  debug: DEBUG && debug ? 'console.debug' : 'noop',
  info: DEBUG && info ? 'console.info' : 'noop',
  log: DEBUG && log ? 'console.log' : 'noop',
  trace: DEBUG && trace ? 'console.trace' : 'noop',
};

const dir = (...paths) => path.resolve(__dirname, ...paths);
const srcDir = (...paths) => dir('src', ...paths);
const distDir = (...paths) => dir('dist', ...paths);
const DIST_DIR = distDir();
const POPUP_DIRNAME = 'popup';

const entries = {
  contentScripts: srcDir('contentScripts', 'index.ts'),
  popup: srcDir(POPUP_DIRNAME, 'index.ts'),
};
const formattedAliases = formatAliases(require.resolve('./tsconfig'));

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'development',
  optimization: {
    concatenateModules: true,
    emitOnErrors: false,
    flagIncludedChunks: true,
    innerGraph: true,
    mangleExports: false,
    minimize: false,
    portableRecords: true,
    providedExports: true,
    removeAvailableModules: true,
    removeEmptyChunks: true,
    sideEffects: true, // requires `{providedExports: true}`
    usedExports: true,
  },
  devtool: 'inline-source-map',
  entry: entries,
  externals: ['chrome'],
  output: {
    compareBeforeEmit: true,
    filename: '[name]/main.js',
    globalObject: 'globalThis',
    path: DIST_DIR,
    pathinfo: false,
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
              logLevel: 'WARN',
            }),
          },
        ],
      },
    ],
  },
  plugins: [
    new DefinePluginOverride(CONSTANTS),
    new ProvidePlugin({noop: require.resolve('./webpack/globals/noop')}),
    new CopyPlugin({
      patterns: [
        {
          from: dir('manifest.json'),
          to: DIST_DIR,
        },
        {
          from: srcDir(POPUP_DIRNAME, 'contrasticon.png'),
          to: distDir(POPUP_DIRNAME),
        },
        {
          from: srcDir(POPUP_DIRNAME, 'index.html'),
          to: distDir(POPUP_DIRNAME),
        },
      ],
    }),
    new WebExtPlugin(),
  ],
  resolve: {
    alias: formattedAliases,
    extensions: ['.ts'],
  },
  stats: {
    builtAt: true,
    errorDetails: true,
    groupAssetsByEmitStatus: true,
    groupAssetsByExtension: false,
    groupAssetsByPath: false,
    modules: false,
    timings: true,
  },
};

module.exports = config;
