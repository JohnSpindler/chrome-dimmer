//@ts-check
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const {DefinePluginOverride} = require('./utils/DefinePlugin');

const CONSTANTS = {
  DEBUG: require('./env.json').DEBUG,
  EXTENSION_ID: 'chrome.runtime.id',
  NOOP: (..._args) => {},
};

/**
 * @typedef {true | 'consume'} Consume Default. Consume the source map and
 *     remove SourceMappingURL comment.
 */
/**
 * @typedef {'skip'} NoConsume Do not consume the source map and do not remove
 *     SourceMappingURL comment.
 */
/**
 * @typedef {false | 'remove'} RemoveComment Do not consume the source map and
 *     remove SourceMappingURL comment.
 */
/**
 * @typedef {Object} SourceMapLoaderOptions
 * @property {(
 *   url: string,
 *   resourcePath: string
 * ) => Consume | NoConsume | RemoveComment} [filterSourceMappingUrl]
 *     Default is `(() => Consume)`
 */

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

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'development',
  optimization: {
    chunkIds: 'named',
    concatenateModules: true,
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
    filename: '[name].js',
    path: dir('dist'),
    devtoolModuleFilenameTemplate: (info) => {
      return info.resourcePath.replace('./src', '');
    },
    globalObject: 'globalThis',
    iife: true,
    module: false,
    pathinfo: true,
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
      {
        test: /\.js/,
        use: [
          {
            loader: 'source-map-loader',
            options: /** @type {SourceMapLoaderOptions} */ ({}),
          },
        ],
        enforce: 'pre',
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
    function LogTimePlugin() {
      this.hooks.afterDone.tap('LogTimePlugin', () => {
        console.log(`\n[${new Date().toLocaleString()}] --- DONE.\n`);
      });
    },
  ],
  resolve: {
    extensions: ['.ts'],
  },
  stats: {
    builtAt: true,
    modules: false,
  },
};

module.exports = config;
