/**
 * Get an internal id by removing a prefix from the given id
 * @param {string} id
 * @returns string
 */
export const unprefixId = (id) => id?.slice(id.indexOf('_') + 1);
