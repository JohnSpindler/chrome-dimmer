const webpack = require('webpack');
/* Plugins */
const CopyPlugin = require('copy-webpack-plugin');
const {DefinePlugin, WebExtPlugin} = require('./webpack/plugins');
/* Utils */
const path = require('path');
const {formatAliases} = require('./webpack/helpers');
/* Globals */
const {DEBUG, debug, info, log, trace} = require('./env.json');
const {name: packageName} = require('./package.json');

const {ProvidePlugin} = webpack;

/** @typedef {webpack.Configuration} Config */
/** @typedef {webpack.WebpackPluginFunction | webpack.WebpackPluginInstance} Plugin */

const CONSTANTS = {
  APP_NAME: JSON.stringify(packageName),
  DEBUG,
  EXTENSION_ID: 'chrome.runtime.id',
  debug: DEBUG && debug ? 'console.debug' : 'noop',
  info: DEBUG && info ? 'console.info' : 'noop',
  log: DEBUG && log ? 'console.log' : 'noop',
  trace: DEBUG && trace ? 'console.trace' : 'noop',
};

/* Helpers */
const dir = (...paths) => path.resolve(__dirname, ...paths);
const srcDir = (...paths) => dir('src', ...paths);
const distDir = (...paths) => dir('dist', ...paths);
const DIST_DIR = distDir();
const POPUP_DIRNAME = 'popup';

const entries = {
  contentScripts: srcDir('contentScripts', 'index.ts'),
  popup: srcDir(POPUP_DIRNAME, 'index.ts'),
};
const formattedAliases = formatAliases(require.resolve('./tsconfig.json'));

/**
 * @type {(env: {
 *   [key:string]: string | number | boolean | undefined;
 *   launch?: boolean | undefined;
 * }) => Config}
 */
function getConfig(env) {
  /** @type {Plugin[]} */
  const additionalPlugins = [];
  if (env.launch) {
    additionalPlugins.push(new WebExtPlugin());
  }

  /** @type {Config} */
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
      sideEffects: true,
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
      new DefinePlugin(CONSTANTS),
      new ProvidePlugin({noop: require.resolve('./webpack/globals/noop')}),
      /** @type {Plugin} */ (
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
        })
      ),
      ...additionalPlugins,
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

  return config;
}

module.exports = getConfig;
