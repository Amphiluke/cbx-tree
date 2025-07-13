import {Tree} from './tree.mjs';
import {treeTemplate} from './templating.mjs';
import {unprefixId} from './helpers.mjs';
import css from './cbx-tree.css?inline';

/** @import {CbxRawTreeItem, CbxTreeItem, CbxTreeMap} from './tree.mjs' */

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);


export default class CbxTree extends HTMLElement {
  static get formAssociated() {
    return true;
  }

  static get observedAttributes() {
    return ['nohover'];
  }

  /** @type {ShadowRoot} */
  #shadowRoot;

  /** @type {ElementInternals} */
  #internals;

  /** @type {Tree} */
  #tree;

  /** @type {AbortController | null} */
  #hoverEventCtrl = null;

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
    this.#tree.selection.forEach((id) => {
      const value = this.#tree.getItem(id)?.value;
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

  get noHover() {
    return this.hasAttribute('nohover');
  }
  set noHover(value) {
    if (value) {
      this.setAttribute('nohover', '');
    } else {
      this.removeAttribute('nohover');
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
    this.#shadowRoot.addEventListener('pointerdown', (e) => this.#onItemToggle(e));
    this.addEventListener('focus', () => this.#onFocus());
    this.#shadowRoot.addEventListener('keydown', (e) => this.#onKeyDown(e));
    this.#toggleHoverListener();
  }


  // === Lifecycle callbacks ===

  attributeChangedCallback(name) {
    if (name === 'nohover') {
      this.#toggleHoverListener();
    }
  }

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
      const label = target.closest('[part="label"]');
      this.#focusLabel(label, true);
      return;
    }
  }

  #onItemToggle(event) {
    if (event.isPrimary && event.target.part.contains('toggle')) {
      this.#toggleItem(event.target.closest('[part="item"]'));
      event.preventDefault(); // prevent toggle button from grabbing focus
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
      case 'PageDown':
        this.#focusNextPage();
        break;
      case 'PageUp':
        this.#focusPrevPage();
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

  #onPointerOver({target}) {
    const label = target.part.contains('toggle') ?
      target.closest('[part="item"]').querySelector('[part="label"]') :
      target.closest('[part="label"]');
    this.#focusLabel(label, true);
  }


  // === Internals ===

  #toggleHoverListener() {
    this.#hoverEventCtrl?.abort();
    if (this.noHover) {
      this.#hoverEventCtrl = null;
      return;
    }
    this.#hoverEventCtrl = new AbortController();
    this.#shadowRoot.addEventListener('pointerover', (e) => this.#onPointerOver(e), {signal: this.#hoverEventCtrl.signal});
  }

  #render() {
    this.#shadowRoot.setHTMLUnsafe(treeTemplate(this.#tree.tree));
    const checkboxes = this.#shadowRoot.querySelectorAll('[part="checkbox"]');
    [...checkboxes].forEach((checkbox) => {
      const state = this.#tree.getItem(unprefixId(checkbox.id))?.state;
      checkbox.checked = state === 'checked';
      checkbox.indeterminate = state === 'indeterminate';
    });
    this.#focusedLabel = this.#shadowRoot.querySelector('[part="label"]');
  }

  async #requestSubtree(parentId) {
    if (typeof this.subtreeProvider !== 'function') {
      return;
    }
    const parentItem = this.#tree.getItem(parentId);
    if (parentItem?.children !== null) {
      return;
    }
    const itemElement = this.#shadowRoot.getElementById(`item_${parentId}`);
    itemElement.inert = true;
    try {
      const subtree = await this.subtreeProvider(parentItem.value);
      Tree.assertRawTreeValid(subtree);
      this.#tree.setSubtree(parentItem, subtree);
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
      this.#tree.selection[method](id);
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
      this.#setAllChecked(this.#tree.selection.has(item.id), item.children);
    }
  }

  /**
   * Sync selection states of the item’s ancestors
   * @param {CbxTreeItem} item 
   */
  #syncAncestors(item) {
    if (this.#tree.tree.has(item.id)) { // top-level item
      return;
    }
    const parentItem = this.#tree.getParentItem(item.id);
    const state = this.#tree.calcItemState(parentItem);
    this.#tree.selection[state === 'checked' ? 'add' : 'delete'](parentItem.id);
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
    this.#tree.selection[method](id);
    const item = this.#tree.getItem(id);
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
    const item = this.#tree.getItem(id);
    item.collapsed = !isExpanding;
    this.#focusLabel(itemElement.querySelector('[part="label"]'), true);
    this.#refreshFormValue();
    this.dispatchEvent(new CustomEvent('cbxtreetoggle', {bubbles: true, detail: {
      title: item.title,
      value: item.value,
      newState: isExpanding ? 'expanded' : 'collapsed',
    }}));
  }

  #focusLabel(label, preventScroll = false) {
    if (label) {
      this.#focusedLabel = label;
      label.focus({preventScroll});
    }
  }

  /**
   * Apply focus to the first item in the tree
   */
  #focusFirst() {
    const firstLabel = this.#shadowRoot.querySelector('[part="label"]');
    this.#focusLabel(firstLabel);
  }

  /**
   * Apply focus to the last visible item in the tree
   */
  #focusLast() {
    const lastLabel = this.#visibleLabels.at(-1);
    this.#focusLabel(lastLabel);
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
    this.#focusLabel(nextLabel);
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
    this.#focusLabel(prevLabel);
  }

  /**
   * Move focus one page down
   */
  #focusNextPage() {
    const {clientHeight, scrollHeight} = this;
    if (scrollHeight - clientHeight < 10) {
      this.#focusLast();
      return;
    }
    const visibleLabels = this.#visibleLabels;
    const labelHeight = scrollHeight / visibleLabels.length;
    const pageSize = Math.floor(clientHeight / labelHeight);
    let currentIndex = visibleLabels.indexOf(this.#focusedLabel);
    if (currentIndex === -1) {
      currentIndex = 0;
    }
    const nextIndex = Math.min(currentIndex + pageSize - 1, visibleLabels.length - 1);
    this.#focusLabel(visibleLabels[nextIndex]);
  }

  /**
   * Move focus one page up
   */
  #focusPrevPage() {
    const {clientHeight, scrollHeight} = this;
    if (scrollHeight - clientHeight < 10) {
      this.#focusFirst();
      return;
    }
    const visibleLabels = this.#visibleLabels;
    const labelHeight = scrollHeight / visibleLabels.length;
    const pageSize = Math.round(clientHeight / labelHeight);
    let currentIndex = visibleLabels.indexOf(this.#focusedLabel);
    if (currentIndex === -1) {
      currentIndex = 0;
    }
    const nextIndex = Math.max(currentIndex - pageSize + 1, 0);
    this.#focusLabel(visibleLabels[nextIndex]);
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
    this.#focusLabel(parentLabel);
  }

  /** @returns {CbxRawTreeItem[]} */
  #getDefaultRawTree() {
    const contentJSON = this.textContent.trim() || '[]';
    try {
      const tree = JSON.parse(contentJSON);
      Tree.assertRawTreeValid(tree);
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
    Tree.assertRawTreeValid(treeData);
    this.#tree = new Tree(treeData);
    this.#render();
    this.#refreshFormValue();
  }

  toJSON() {
    return this.#tree.toRaw();
  }

  /**
   * Check or uncheck all the items in the tree
   * @param {boolean} [checked] - Whether to check (`true`) or uncheck (`false`) all the items
   */
  toggleChecked(checked) {
    if (checked === undefined) {
      checked = !!this.#shadowRoot.querySelector('[part="checkbox"]:not(:checked)');
    }
    this.#setAllChecked(checked, this.#tree.tree);
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
      const item = this.#tree.getItem(unprefixId(itemElement.id));
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
