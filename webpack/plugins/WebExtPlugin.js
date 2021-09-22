// Original source: https://github.com/hiikezoe/web-ext-webpack-plugin/blob/master/web-ext-webpack-plugin.js

const webExt = require('web-ext');

const pluginName = 'WebExtPlugin';
/**
 * @typedef {{
 * sourceDir?: string;
 * artifactsDir?: string;
 * browserConsole?: boolean;
 * buildPackage?: boolean;
 * chromiumBinary?: string;
 * chromiumProfile?: string;
 * firefox?: string;
 * firefoxProfile?: string;
 * keepProfileChanges?: boolean;
 * outputFilename?: string;
 * overwriteDest?: boolean;
 * profileCreateIfMissing?: boolean;
 * startUrl?: string;
 * target?: 'firefox-desktop' | 'firefox-android' | 'chromium';
 * }} Options

 */
/**
 * @typedef {Object} RunParams
 * @property {string}   artifactsDir
 * @property {boolean} browserConsole
 * @property {FirefoxPreferences=} pref
 * @property {string} firefox
 * @property {string=} firefoxProfile
 * @property {boolean=} profileCreateIfMissing
 * @property {string[]} ignoreFiles
 * @property {boolean} keepProfileChanges
 * @property {boolean=} noInput
 * @property {boolean} noReload
 * @property {boolean} preInstall
 * @property {string} sourceDir
 * @property {string[]} watchFile
 * @property {string[]} watchIgnored
 * @property {string} startUrl Note: was `string[]` before
 * @property {string} target Note: was `string[]` before
 * @property {string[]} args
 * // Android CLI options.
 * @property {string=} adbBin
 * @property {string=} adbHost
 * @property {string=} adbPort
 * @property {string=} adbDevice
 * @property {number=} adbDiscoveryTimeout
 * @property {boolean=} adbRemoveOldArtifacts
 * @property {string=} firefoxApk
 * @property {string=} firefoxApkComponent
 * // Chromium Desktop CLI options.
 * @property {string=} chromiumBinary
 * @property {string=} chromiumProfile
 */
/** @typedef {import('web-ext/src/cmd')} defaultBuildExtension */

/** @typedef {import('web-ext/src/util/desktop-notifier').showDesktopNotification} defaultDesktopNotifications */
/** @typedef {import('web-ext/src/firefox')} defaultFirefoxApp */
/** @typedef {import('web-ext/src/firefox/remote').connectWithMaxRetries} defaultFirefoxClient */
/** @typedef {import('web-ext/src/extension-runners')} ExtensionRunners */
/** @typedef {ExtensionRunners['defaultReloadStrategy']} defaultReloadStrategy */
/** @typedef {ExtensionRunners['MultiExtensionRunner']} DefaultMultiExtensionRunner */
/** @typedef {import('web-ext/src/util/manifest')} defaultGetValidatedManifest */
/**
 * @typedef {Object} RunOptions
 * @property  {defaultBuildExtension} buildExtension
 * @property  {defaultDesktopNotifications} desktopNotifications
 * @property  {defaultFirefoxApp} firefoxApp
 * @property  {defaultFirefoxClient} firefoxClient
 * @property  {defaultReloadStrategy} reloadStrategy
 * @property  {boolean=} shouldExitProgram
 * @property  {DefaultMultiExtensionRunner=} MultiExtensionRunner
 * @property  {defaultGetValidatedManifest=} getValidatedManifest
 */
/**
 * @async
 * @callback Run
 * @param {Partial<RunParams>} arg1
 * @param {Partial<RunOptions>} arg2
 * @returns {Promise<DefaultMultiExtensionRunner>}
 */

/***/
class WebExtPlugin {
  /** @param {Options & {lintOnBuild?: boolean}} options */
  constructor({
    browserConsole = true,
    lintOnBuild = false,
    sourceDir = 'dist',
    // startUrl = 'localhost:3000',
    startUrl = 'google.com/search?q=a',
    target = 'chromium',
  } = {}) {
    this.browserConsole = browserConsole;
    this.lintOnBuild = lintOnBuild;
    this.runner = null;
    this.sourceDir = `${process.cwd()}/${sourceDir}`;
    this.startUrl = startUrl;
    this.target = target;
    this.watchMode = false;
  }

  apply(compiler) {
    const watchRun = async (compiler) => {
      this.watchMode = true;
    };

    const afterEmit = async (compilation) => {
      try {
        if (this.lintOnBuild) {
          await webExt.cmd.lint(
            {
              boring: false,
              metadata: false,
              output: 'text',
              pretty: false,
              sourceDir: this.sourceDir,
              verbose: false,
              warningsAsErrors: true,
            },
            {
              shouldExitProgram: false,
            },
          );
        }

        if (!this.watchMode) {
          return;
        }

        if (this.runner) {
          // @ts-ignore
          this.runner.reloadAllExtensions();
          return;
        }
        /**
         * @type {Run}
         * @see {@link file:///Users/jspin/OneDrive/code/chrome/chrome-dimmer/node_modules/web-ext/src/cmd/run.js}
         */
        const run = webExt.cmd.run;
        await run(
          {
            browserConsole: this.browserConsole,
            noReload: true,
            sourceDir: this.sourceDir,
            // @ts-ignore
            startUrl: this.startUrl,
            // @ts-ignore
            target: this.target,
          },
          {},
        ).then((runner) => (this.runner = runner));

        if (!this.runner) {
          return;
        }

        // @ts-ignore
        this.runner.registerCleanup(() => {
          this.runner = null;
        });
      } catch (err) {
        console.log(err);
      }
    };

    compiler.hooks.afterEmit.tapPromise({name: pluginName}, afterEmit);
    compiler.hooks.watchRun.tapPromise({name: pluginName}, watchRun);
  }
}

module.exports = WebExtPlugin;
