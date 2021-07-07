// Original source: https://github.com/hiikezoe/web-ext-webpack-plugin/blob/master/web-ext-webpack-plugin.js

const webExt = require('web-ext');

const pluginName = 'WebExtPlugin';

class WebExtPlugin {
  constructor({
    browserConsole = true,
    lintOnBuild = false,
    sourceDir = 'dist',
    startUrl = 'localhost:3000',
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
            }
          );
        }

        if (!this.watchMode) {
          return;
        }

        if (this.runner) {
          this.runner.reloadAllExtensions();
          return;
        }

        await webExt.cmd
          .run(
            {
              browserConsole: this.browserConsole,
              noReload: true,
              sourceDir: this.sourceDir,
              startUrl: this.startUrl,
              target: this.target,
            },
            {}
          )
          .then((runner) => (this.runner = runner));

        if (!this.runner) {
          return;
        }

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
