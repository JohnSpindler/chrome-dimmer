const path = require('path');

module.exports = (tsconfigCompilerOptions) => {
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
};
