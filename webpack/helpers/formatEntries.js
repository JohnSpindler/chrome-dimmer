const path = require('path');

module.exports = (baseDir, entries) => {
  const entryKeys = Object.keys(entries);
  return entryKeys.reduce((acc, cur) => {
    const newKey = `${cur}/bundle`;
    const currentValues = entries[cur];
    const newVals = (
      Array.isArray(currentValues)
        ? /** @type {string[]} */ (currentValues)
        : [currentValues]
    ).map((v) => path.resolve(baseDir, `${cur}/${v}`));
    return {...acc, [newKey]: newVals};
  }, {});
};
