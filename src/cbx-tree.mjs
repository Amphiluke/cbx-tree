import {treeTemplate} from './templating.mjs';
import css from './cbx-tree.css?inline';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);


/**
 * Raw data for a single item of the tree
 * @typedef {object} CbxRawTreeItem
 * @property {string} title - Item title
 * @property {string} value - Item checkbox’s value, must be unique within the entire tree
 * @property {boolean} [checked] - Item selection state
 * @property {string} [icon] - Item icon’s URL
 * @property {CbxRawTreeItem[] | null} [children] - A list of child items, or `null` if subtree isn’t fetched yet
 */

/**
 * Internal representation for a single item of the tree
 * @typedef {object} CbxTreeItem
 * @property {string} id - Item identifier, unique within the entire tree
 * @property {string} value - Item checkbox’s value, must be unique within the entire tree
 * @property {string} title - Item title
 * @property {string} [icon] - Item icon’s URL
 * @property {CbxTreeMap | null} [children] - A map of child items, or `null` if subtree isn’t fetched yet
 * @property {'checked' | 'unchecked' | 'indeterminate'} state - Computed state of the item’s selection
 */

/**
 * Map ids to corresponding tree items
 * @typedef {Map<string, CbxTreeItem>} CbxTreeMap
 */

export default class CbxTree extends HTMLElement {
  static get formAssociated() {
    return true;
  }

  /** @type {ShadowRoot} */
  #shadowRoot;

  /** @type {ElementInternals} */
  #internals;

  /** @type {CbxTreeMap} */
  #tree = new Map();

  /** @type {Set<string>} */
  #selection = new Set();


  get formData() {
    const data = new FormData();
    const {name} = this;
    this.#selection.forEach((value) => data.append(name, value));
    return data;
  }

  get form() {
    return this.#internals.form;
  }

  get name() {
    return this.getAttribute('name');
  }
  set name(value) {
    this.setAttribute('name', value);
  }

  get type() {
    return this.localName;
  }


  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({
      mode: 'open',
      delegatesFocus: true, // required for proper hinting when form validation fails
    });
    this.#shadowRoot.adoptedStyleSheets = [stylesheet];

    this.#internals = this.attachInternals();
    this.#tree = this.#buildTree(this.#getDefaultRawTree());
    this.#render();

    this.#shadowRoot.addEventListener('change', ({target}) => {
      const id = target.dataset.itemId;
      const method = target.checked ? 'add' : 'delete';
      this.#selection[method](id);
      const item = this.#getItem(id);
      this.#syncAncestors(item);
      this.#syncDescendants(item);
      this.#internals.setFormValue(this.formData, JSON.stringify([...this.#tree]));
    });
  }


  // === Lifecycle callbacks ===

  formResetCallback() {
    this.#tree = this.#buildTree(this.#getDefaultRawTree());
    this.#render();
  }
  
  formStateRestoreCallback(state, mode) {
    if (mode !== 'restore') {
      return;
    }
    try {
      this.#tree = new Map(JSON.parse(state)); // TODO sync selection
      this.#render();
    } catch (e) {
      console.warn('Failed to restore the tree state', e);
    }
  }


  // === Internals ===

  #render() {
    this.#shadowRoot.setHTMLUnsafe(treeTemplate(this.#tree));
  }

  /**
   * Convert raw tree data to internal tree representation
   * @param {CbxRawTreeItem[]} rawTree - Raw tree data
   * @param {string} parentId - Identifier of a parent item (for recursive calls only)
   * @returns {CbxTreeMap}
   */
  #buildTree(rawTree, parentId) {
    return new Map(rawTree.map((rawItem, index) => {
      const id = parentId ? `${parentId}\0${index}` : String(index);
      if (rawItem.checked) {
        this.#selection.add(id);
      }
      /** @type {CbxTreeItem} */
      const item = {
        id,
        title: rawItem.title,
        value: rawItem.value,
        icon: rawItem.icon,
        children: rawItem.children ? this.#buildTree(rawItem.children, id) : rawItem.children,
      };
      Object.defineProperty(item, 'state', {
        get: () => {
          if (this.#selection.has(item.id)) {
            return 'checked';
          }
          if (!item.children?.size) {
            return 'unchecked';
          }
          return this.#calcItemState(item);
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
  #getItem(id) {
    const parts = id.split('\0');
    return parts.slice(1).reduce((item, part) => item?.children?.get(`${item?.id}\0${part}`), this.#tree.get(parts[0]));
  }

  /**
   * Determine item state based on the states of its children
   * @param {CbxTreeItem} item
   * @returns {'checked' | 'unchecked' | 'indeterminate'}
   */
  #calcItemState(item) {
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
   * Sync selection states of the item’s ancestors
   * @param {CbxTreeItem} item 
   */
  #syncAncestors(item) {
    if (this.#tree.has(item.id)) { // top-level item
      return;
    }
    const parentItem = this.#getItem(item.id.slice(0, item.id.lastIndexOf('\0')));
    const method = this.#calcItemState(parentItem) === 'checked' ? 'add' : 'delete';
    this.#selection[method](parentItem.id);
    this.#syncAncestors(parentItem);
  }

  /**
   * Sync selection states of the item’s descendants
   * @param {CbxTreeItem} item 
   */
  #syncDescendants(item) {
    if (!item.children) {
      return;
    }
    const method = this.#selection.has(item.id) ? 'add' : 'delete';
    item.children.forEach((childItem, id) => {
      this.#selection[method](id);
      this.#syncDescendants(childItem);
    });
  }

  /** @returns {CbxRawTreeItem[]} */
  #getDefaultRawTree() {
    const contentJSON = this.textContent.trim() || '[]';
    try {
      const tree = JSON.parse(contentJSON);
      if (!Array.isArray(tree)) {
        throw new TypeError();
      }
      return tree;
    } catch {
      console.error(new DOMException('<cbx-tree> contents must be a valid JSON array representation', 'DataError'));
      return [];
    }
  }


  // === Public interface ===

  /**
   * Overwrite and rerender the entire tree
   * @param {CbxRawTreeItem[]} treeData 
   */
  setData(treeData) {
    if (!Array.isArray(treeData)) {
      throw new TypeError('Tree data must be an array of tree items');
    }
    this.#tree = this.#buildTree(treeData); // TODO sync selection
    this.#render();
  }

  toJSON() {
    // TODO Convert to raw format!
    return structuredClone(this.#tree);
  }


  // === Form validation ===

  get validity() {
    return this.#internals.validity;
  }

  get validationMessage() {
    return this.#internals.validationMessage;
  }

  get willValidate() {
    return this.#internals.willValidate;
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  setValidity(...args) {
    return this.#internals.setValidity(...args);
  }
}

customElements.define('cbx-tree', CbxTree);
