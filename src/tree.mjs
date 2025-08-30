/**
 * Raw user-defined data for a single item of the tree
 * @typedef {object} CbxRawTreeItem
 * @property {string} title - Item title
 * @property {string} value - Item checkbox’s value, unique within the entire tree
 * @property {string} [icon] - Item icon’s URL
 * @property {boolean} [checked] - Item selection state
 * @property {boolean} [collapsed] - Whether a children subtree is collapsed
 * @property {CbxRawTreeItem[] | null} [children] - A list of child items, or `null` if subtree isn’t fetched yet
 */

/**
 * Internal representation for a single item of the tree
 * @typedef {object} CbxTreeItem
 * @property {string} id - Item identifier, unique within the entire tree
 * @property {string} title - Item title
 * @property {string} value - Item checkbox’s value, unique within the entire tree
 * @property {string} [icon] - Item icon’s URL
 * @property {'checked' | 'unchecked' | 'indeterminate'} state - Computed state of the item’s selection
 * @property {boolean} [collapsed] - Whether a children subtree is collapsed
 * @property {CbxTreeMap | null} [children] - A map of child items, or `null` if subtree isn’t fetched yet
 */

/**
 * Map ids to corresponding tree items
 * @typedef {Map<string, CbxTreeItem>} CbxTreeMap
 */

export class Tree {
  static assertRawTreeValid(rawTree) {
    if (!Array.isArray(rawTree)) { // cheap and cheerful (kind of)
      throw new TypeError('Tree data must be an array of tree items');
    }
  }

  /** @type {CbxTreeMap} */
  #tree = new Map();

  get tree() {
    return this.#tree;
  }

  /** @type {Set<string>} */
  selection = new Set();

  constructor(rawTree) {
    this.#tree = this.#buildTree(rawTree);
  }

  /**
   * Convert raw tree data to internal tree representation
   * @param {CbxRawTreeItem[]} rawTree - Raw tree data
   * @param {string} [parentId] - Identifier of a parent item (the case of building a subtree)
   * @returns {CbxTreeMap}
   */
  #buildTree(rawTree, parentId) {
    return new Map(rawTree.map((rawItem, index) => {
      const id = parentId ? `${parentId}:${index}` : String(index);
      if (rawItem.checked) {
        this.selection.add(id);
      }
      /** @type {CbxTreeItem} */
      const item = {
        id,
        title: rawItem.title,
        value: rawItem.value,
        icon: rawItem.icon,
        collapsed: rawItem.children?.length ? !!rawItem.collapsed : (rawItem.children === null ? true : undefined),
        children: rawItem.children ? this.#buildTree(rawItem.children, id) : rawItem.children,
      };
      Object.defineProperty(item, 'state', {
        get: () => {
          if (this.selection.has(item.id)) {
            return 'checked';
          }
          if (!item.children?.size) {
            return 'unchecked';
          }
          return this.calcItemState(item);
        },
      });
      return [id, item];
    }));
  }

  /**
   * Get item object reference by item id
   * @param {string} id - Item identifier
   * @returns {CbxTreeItem | undefined}
   */
  getItem(id) {
    const [topPart, ...parts] = id.split(':');
    return parts.reduce((item, part) => item?.children?.get(`${item?.id}:${part}`), this.#tree.get(topPart));
  }

  /**
   * Get parent item object reference by the id of its child item
   * @param {string} id - Child item identifier
   * @returns {CbxTreeItem | undefined}
   */
  getParentItem(id) {
    return this.getItem(id.slice(0, id.lastIndexOf(':')));
  }

  /**
   * Determine item state based on the states of its children
   * @param {CbxTreeItem} item
   * @returns {'checked' | 'unchecked' | 'indeterminate'}
   */
  calcItemState(item) {
    const childrenStates = new Set([...item.children.values()].map(({state}) => state));
    if (childrenStates.has('indeterminate')) {
      return 'indeterminate';
    }
    if (!childrenStates.has('checked')) {
      return 'unchecked';
    }
    if (!childrenStates.has('unchecked')) {
      return 'checked';
    }
    return 'indeterminate';
  }

  /**
   * Overwrite the subtree of an item
   * @param {CbxTreeItem} parentItem - Parent item for the subtree
   * @param {CbxRawTreeItem[]} rawSubtree - Raw subtree data
   */
  setSubtree(parentItem, rawSubtree) {
    parentItem.children = this.#buildTree(rawSubtree, parentItem.id);
  }

  /**
   * Iterate over the tree
   * @param {(item: CbxTreeItem) => void} callback 
   * @param {CbxTreeMap} [tree]
   */
  walkTree(callback, tree = this.#tree) {
    tree.forEach((item) => {
      callback(item);
      if (item.children) {
        this.walkTree(callback, item.children);
      }
    });
  }

  /**
   * Convert internal representation of a tree back to its raw format
   * @param {CbxTreeMap} tree
   * @returns {CbxRawTreeItem[]}
   */
  toRaw(tree = this.#tree) {
    return [...tree.values()].map((item) => ({
      title: item.title,
      value: item.value,
      icon: item.icon,
      checked: this.selection.has(item.id),
      collapsed: item.collapsed === true ? true : undefined,
      children: item.children ? this.toRaw(item.children) : item.children,
    }));
  }
}
