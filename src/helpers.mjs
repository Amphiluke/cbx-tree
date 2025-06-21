/**
 * Get an internal id by removing a prefix from the given id
 * @param {string} id
 * @returns string
 */
export const unprefixId = (id) => id?.slice(id.indexOf('_') + 1);

/**
 * A loose assertion for the argument to be a valid raw tree
 * @param {*} rawTree
 */
export const assertRawTreeValid = (rawTree) => {
  if (!Array.isArray(rawTree)) { // cheap and cheerful (kind of)
    throw new TypeError('Tree data must be an array of tree items');
  }
};
