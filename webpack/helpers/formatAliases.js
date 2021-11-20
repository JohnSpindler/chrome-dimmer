const {dirname, resolve, join} = require('path');

/**
 * @param {string} tsconfigPath
 * @returns {import('webpack').Configuration['resolve']['alias']}
 */
module.exports = function formatAliases(tsconfigPath) {
  /** @type {{compilerOptions: import('typescript').CompilerOptions}} */
  const tsconfig = require(tsconfigPath);
  const {compilerOptions: {paths = {}, baseUrl = '.'} = {}} = tsconfig;
  const baseDir = join(dirname(tsconfigPath), baseUrl);

  const formattedAliases =  Object.keys(paths).reduce((aliases, aliasName) => {
    // paths associated with current key
    const aliasPaths = paths[aliasName] || [];
    // remove wildcards (not compatible with webpack mappings)
    // and resolve paths as absolute
    const formattedPaths = aliasPaths.map((aliasPath) =>
      resolve(baseDir, aliasPath.replace(/\/\*$/, '')),
    );
    // remove wildcard (not compatible with webpack mappings)
    const webpackAliasName = aliasName.replace(/\/\*$/, '');

    return {
      ...aliases,
      [webpackAliasName]: formattedPaths,
    };
  }, {});

  return formattedAliases;
};
