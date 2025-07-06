import {treeTemplate} from './templating.mjs';
import {unprefixId, assertRawTreeValid} from './helpers.mjs';
import css from './cbx-tree.css?inline';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);


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

  /** @type {HTMLLabelElement | null} */
  get #focusedLabel() {
    return this.#shadowRoot.querySelector('[tabindex="0"]');
  }
  set #focusedLabel(newLabel) {
    const prevLabel = this.#focusedLabel;
    if (newLabel === prevLabel) {
      return;
    }
    prevLabel?.removeAttribute('tabindex');
    newLabel?.setAttribute('tabindex', '0');
  }

  /** @type {HTMLLabelElement[]} */
  get #visibleLabels() {
    return [...this.#shadowRoot.querySelectorAll('[part="label"]:not([aria-expanded="false"] [part="tree"] *)')];
  }

  /** @type {((parentValue: string) => Promise<CbxRawTreeItem[]>) | null} */
  subtreeProvider = null;


  get formData() {
    const data = new FormData();
    const {name} = this;
    this.#selection.forEach((id) => {
      const value = this.#getItem(id)?.value;
      if (value !== undefined) {
        data.append(name, value);
      }
    });
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

  get disabled() {
    return this.hasAttribute('disabled');
  }
  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get type() {
    return this.localName;
  }


  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({mode: 'open'});
    this.#shadowRoot.adoptedStyleSheets = [stylesheet];

    this.#internals = this.attachInternals();

    this.setData(this.#getDefaultRawTree());

    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0; // the element must be focusable for proper hinting when form validation fails
    }

    this.#shadowRoot.addEventListener('change', (e) => this.#onChange(e));
    this.#shadowRoot.addEventListener('click', (e) => this.#onItemToggle(e));
    this.addEventListener('focus', () => this.#onFocus());
    this.#shadowRoot.addEventListener('keydown', (e) => this.#onKeyDown(e));
  }


  // === Lifecycle callbacks ===

  formDisabledCallback(disabled) {
    this.#setControlsDisabled(disabled);
  }

  formResetCallback() {
    this.setData(this.#getDefaultRawTree());
  }
  
  formStateRestoreCallback(state, mode) {
    if (mode !== 'restore') {
      return;
    }
    try {
      this.setData(JSON.parse(state));
    } catch (e) {
      console.warn('Failed to restore the tree state', e);
    }
  }


  // === Event listeners ===

  #onChange({target}) {
    if (target.part.contains('checkbox')) {
      this.#toggleItemChecked(target);
      return;
    }
  }

  #onItemToggle({target}) {
    if (target.part.contains('toggle')) {
      this.#toggleItem(target.closest('[part="item"]'));
    }
  }

  #onFocus() {
    this.#focusedLabel?.focus();
  }

  #onKeyDown(e) {
    if (e.defaultPrevented || this.disabled) {
      return;
    }
    switch (e.key) {
      case 'ArrowRight': {
        const item = this.#focusedLabel?.closest('[part="item"]');
        if (item?.ariaExpanded === 'true') {
          this.#focusNext();
        } else if (item?.ariaExpanded === 'false') {
          this.#toggleItem(item);
        }
        break;
      }
      case 'ArrowLeft': {
        const item = this.#focusedLabel?.closest('[part="item"]');
        if (item?.ariaExpanded === 'true') {
          this.#toggleItem(item);
        } else {
          this.#focusParent();
        }
        break;
      }
      case 'ArrowDown':
        this.#focusNext();
        break;
      case 'ArrowUp':
        this.#focusPrev();
        break;
      case 'Home':
        this.#focusFirst();
        break;
      case 'End':
        this.#focusLast();
        break;
      case 'Enter': {
        const item = this.#focusedLabel?.closest('[part="item"]');
        if (item.ariaExpanded !== 'undefined') {
          this.#toggleItem(item);
        }
        break;
      }
      case ' ': {
        const checkbox = this.#focusedLabel?.querySelector('[part="checkbox"]');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          checkbox.indeterminate = false;
          this.#toggleItemChecked(checkbox);
        }
        break;
      }
      default:
        return;
    }
    e.preventDefault();
  }


  // === Internals ===

  #render() {
    this.#shadowRoot.setHTMLUnsafe(treeTemplate(this.#tree));
    const checkboxes = this.#shadowRoot.querySelectorAll('[part="checkbox"]');
    [...checkboxes].forEach((checkbox) => {
      const state = this.#getItem(unprefixId(checkbox.id))?.state;
      checkbox.checked = state === 'checked';
      checkbox.indeterminate = state === 'indeterminate';
    });
    this.#focusedLabel = this.#shadowRoot.querySelector('[part="label"]');
  }

  /**
   * Convert raw tree data to internal tree representation
   * @param {CbxRawTreeItem[]} rawTree - Raw tree data
   * @param {string} parentId - Identifier of a parent item (the case of building a subtree)
   * @returns {CbxTreeMap}
   */
  #buildTree(rawTree, parentId) {
    return new Map(rawTree.map((rawItem, index) => {
      const id = parentId ? `${parentId}:${index}` : String(index);
      if (rawItem.checked) {
        this.#selection.add(id);
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

  async #requestSubtree(parentId) {
    if (typeof this.subtreeProvider !== 'function') {
      return;
    }
    const parentItem = this.#getItem(parentId);
    if (parentItem?.children !== null) {
      return;
    }
    const itemElement = this.#shadowRoot.getElementById(`item_${parentId}`);
    itemElement.inert = true;
    try {
      const subtree = await this.subtreeProvider(parentItem.value);
      assertRawTreeValid(subtree);
      parentItem.children = this.#buildTree(subtree, parentItem.id);
    } finally {
      itemElement.inert = false;
    }
    if (!parentItem.children.size) {
      return;
    }
    itemElement.insertAdjacentHTML('beforeend', treeTemplate(parentItem.children, false));
    if (this.disabled) {
      this.#setControlsDisabled(true, itemElement);
    }
    this.#syncDescendants(parentItem);
    this.#refreshFormValue();
  }

  /**
   * Get item object reference by item id
   * @param {string} id - Item identifier
   * @returns {CbxTreeItem | undefined}
   */
  #getItem(id) {
    const parts = id.split(':');
    return parts.slice(1).reduce((item, part) => item?.children?.get(`${item?.id}:${part}`), this.#tree.get(parts[0]));
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
   * Check/uncheck all items of a the tree or a subtree
   * @param {boolean} isChecked
   * @param {CbxTreeMap} tree
   */
  #setAllChecked(isChecked, tree) {
    if (!tree?.size) {
      return;
    }
    const method = isChecked ? 'add' : 'delete';
    tree.forEach((item, id) => {
      this.#selection[method](id);
      const checkbox = this.#shadowRoot.getElementById(`cbx_${id}`);
      checkbox.checked = isChecked;
      checkbox.indeterminate = false;
      this.#setAllChecked(isChecked, item.children);
    });
  }

  /**
   * Update the `disabled` property on the controls in the specified container
   * @param {boolean} isDisabled
   * @param {HTMLElement | ShadowRoot} [container]
   */
  #setControlsDisabled(isDisabled, container = this.#shadowRoot) {
    const controls = container.querySelectorAll('button, input');
    [...controls].forEach((ctrl) => ctrl.disabled = isDisabled);
  }

  /**
   * Sync selection states of the item’s descendants
   * @param {CbxTreeItem} item 
   */
  #syncDescendants(item) {
    if (item.children) {
      this.#setAllChecked(this.#selection.has(item.id), item.children);
    }
  }

  /**
   * Sync selection states of the item’s ancestors
   * @param {CbxTreeItem} item 
   */
  #syncAncestors(item) {
    if (this.#tree.has(item.id)) { // top-level item
      return;
    }
    const parentItem = this.#getItem(item.id.slice(0, item.id.lastIndexOf(':')));
    const state = this.#calcItemState(parentItem);
    this.#selection[state === 'checked' ? 'add' : 'delete'](parentItem.id);
    const checkbox = this.#shadowRoot.getElementById(`cbx_${parentItem.id}`);
    checkbox.checked = state === 'checked';
    checkbox.indeterminate = state === 'indeterminate';
    this.#syncAncestors(parentItem);
  }

  #refreshFormValue() {
    this.#internals.setFormValue(this.formData, JSON.stringify(this));
  }

  /**
   * Toggle the item’s checked state based on the checkbox current state
   * @param {HTMLInputElement} checkbox
   */
  #toggleItemChecked(checkbox) {
    const id = unprefixId(checkbox.id);
    const method = checkbox.checked ? 'add' : 'delete';
    this.#selection[method](id);
    const item = this.#getItem(id);
    // Order of synchronisation matters (descendants first, then ancestors)
    this.#syncDescendants(item);
    this.#syncAncestors(item);
    this.#refreshFormValue();
    this.dispatchEvent(new CustomEvent('cbxtreechange', {bubbles: true, detail: this.formData}));
  }

  /**
   * Expand the item if it is collapsed or collapse if it is expanded
   * @param {HTMLLIElement} itemElement
   */
  #toggleItem(itemElement) {
    const isExpanding = itemElement.ariaExpanded !== 'true';
    itemElement.ariaExpanded = isExpanding ? 'true' : 'false';
    const id = unprefixId(itemElement.id);
    if (isExpanding) {
      this.#requestSubtree(id);
    }
    const item = this.#getItem(id);
    item.collapsed = !isExpanding;
    this.#focusedLabel = itemElement.querySelector('[part="label"]');
    this.#refreshFormValue();
    this.dispatchEvent(new CustomEvent('cbxtreetoggle', {bubbles: true, detail: {
      title: item.title,
      value: item.value,
      newState: isExpanding ? 'expanded' : 'collapsed',
    }}));
  }

  /**
   * Apply focus to the first item in the tree
   */
  #focusFirst() {
    const firstLabel = this.#shadowRoot.querySelector('[part="label"]');
    if (firstLabel) {
      this.#focusedLabel = firstLabel;
      firstLabel.focus();
    }
  }

  /**
   * Apply focus to the last visible item in the tree
   */
  #focusLast() {
    const lastLabel = this.#visibleLabels.at(-1);
    if (lastLabel) {
      this.#focusedLabel = lastLabel;
      lastLabel.focus();
    }
  }

  /**
   * Move focus to the next visible item in the tree
   */
  #focusNext() {
    const currentLabel = this.#focusedLabel;
    if (!currentLabel) {
      this.#focusFirst();
      return;
    }
    const visibleLabels = this.#visibleLabels;
    const nextLabel = visibleLabels[visibleLabels.indexOf(currentLabel) + 1];
    if (nextLabel) {
      this.#focusedLabel = nextLabel;
      nextLabel.focus();
    }
  }

  /**
   * Move focus to the previous visible item in the tree
   */
  #focusPrev() {
    const currentLabel = this.#focusedLabel;
    if (!currentLabel) {
      this.#focusFirst();
      return;
    }
    const visibleLabels = this.#visibleLabels;
    const prevLabel = visibleLabels[visibleLabels.indexOf(currentLabel) - 1];
    if (prevLabel) {
      this.#focusedLabel = prevLabel;
      prevLabel.focus();
    }
  }

  /**
   * Move focus one level up, to the parent item
   */
  #focusParent() {
    const currentLabel = this.#focusedLabel;
    if (!currentLabel) {
      this.#focusFirst();
      return;
    }
    const parentLabel = currentLabel.closest('[part="tree"]').closest('[part="item"]')?.querySelector('[part="label"]');
    if (parentLabel) {
      this.#focusedLabel = parentLabel;
      parentLabel.focus();
    }
  }

  /** @returns {CbxRawTreeItem[]} */
  #getDefaultRawTree() {
    const contentJSON = this.textContent.trim() || '[]';
    try {
      const tree = JSON.parse(contentJSON);
      assertRawTreeValid(tree);
      return tree;
    } catch {
      console.error(new DOMException('<cbx-tree> contents must be a valid JSON array representation', 'DataError'));
      return [];
    }
  }

  /**
   * Convert internal representation of a tree back to its raw format
   * @param {CbxTreeMap} tree
   * @returns {CbxRawTreeItem[]}
   */
  #toRaw(tree = this.#tree) {
    return [...tree.values()].map((item) => ({
      title: item.title,
      value: item.value,
      icon: item.icon,
      checked: this.#selection.has(item.id),
      collapsed: item.collapsed === true ? true : undefined,
      children: item.children ? this.#toRaw(item.children) : item.children,
    }));
  }


  // === Public interface ===

  /**
   * Overwrite and rerender the entire tree
   * @param {CbxRawTreeItem[]} treeData 
   */
  setData(treeData) {
    assertRawTreeValid(treeData);
    this.#selection.clear();
    this.#tree = this.#buildTree(treeData);
    this.#render();
    this.#refreshFormValue();
  }

  toJSON() {
    return this.#toRaw();
  }

  /**
   * Check or uncheck all the items in the tree
   * @param {boolean} [checked] - Whether to check (`true`) or uncheck (`false`) all the items
   */
  toggleChecked(checked) {
    if (checked === undefined) {
      checked = !!this.#shadowRoot.querySelector('[part="checkbox"]:not(:checked)');
    }
    this.#setAllChecked(checked, this.#tree);
    this.#refreshFormValue();
  }

  /**
   * Expand or collapse all tree items. Items that have on-demand loading behavior are not expanded by this method
   * @param {boolean} [isExpanding] - Whether the items should be expanded
   */
  toggle(isExpanding) {
    let itemElements = [...this.#shadowRoot.querySelectorAll('[part="item"]:has([part="tree"])')];
    if (isExpanding === undefined) {
      isExpanding = itemElements.some(({ariaExpanded}) => ariaExpanded === 'false');
    }
    const ariaExpanded = String(isExpanding);
    itemElements.forEach((itemElement) => {
      if (itemElement.ariaExpanded === ariaExpanded) {
        return;
      }
      itemElement.ariaExpanded = ariaExpanded;
      const item = this.#getItem(unprefixId(itemElement.id));
      item.collapsed = !isExpanding;
    });
    this.#refreshFormValue();
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
