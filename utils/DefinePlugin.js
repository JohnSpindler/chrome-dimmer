const {DefinePlugin} = require('webpack');

/** @todo Investigate compiler hooks: https://webpack.js.org/api/compiler-hooks/ */

class DefinePluginOverride {
  /** @param {{[key: string]: any; compiler?: string[]}} definitions */
  constructor(definitions) {
    this.definitions = definitions;
  }

  /** @param {import('webpack').Compiler} compiler */
  getFinalDefinitions(compiler) {
    if (!this.finalDefinitions) {
      const finalDefinitions = this.definitions?.compiler?.reduce?.(
        (acc, cur) => {
          const fn = this.definitions[cur];
          return {
            ...acc,
            [cur]: typeof fn === 'function' ? fn(compiler) : fn,
          };
        },
        {}
      );

      delete this.definitions.compiler;
      this.finalDefinitions = {...this.definitions, ...finalDefinitions};
    }

    return this.finalDefinitions;
  }

  /** @param {import('webpack').Compiler} compiler */
  apply(compiler) {
    const finalDefinitions = this.getFinalDefinitions(compiler);
    new DefinePlugin(finalDefinitions).apply(compiler);
  }
}

module.exports = {DefinePluginOverride, default: DefinePluginOverride};
