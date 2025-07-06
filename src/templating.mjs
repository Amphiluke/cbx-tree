/** @import {CbxTreeItem, CbxTreeMap} from './cbx-tree.mjs' */

const sanitize = (unsafeStr) => ['&', '"'].reduce((str, char) => str.replaceAll(char, `&#${char.charCodeAt(0)};`), unsafeStr);

/**
 * Render a tree
 * @param {CbxTreeMap} tree - Tree data
 * @param {boolean} isRoot - Marker of a root level
 * @returns {string}
 */
export const treeTemplate = (tree, isRoot = true) => `
<ul part="tree" role="${isRoot ? 'tree' : 'group'}">
  ${[...tree.values()].reduce((html, item) => html + itemTemplate(item), '')}
</ul>`;

/**
 * Render a tree item
 * @param {CbxTreeItem} item - Tree item data
 * @returns {string}
 */
export const itemTemplate = ({id, title, icon, collapsed, children}) => `
<li id="item_${id}" part="item" role="treeitem" aria-expanded="${collapsed === undefined ? 'undefined' : !collapsed}">
  ${(children !== undefined) ? '<button type="button" part="toggle" tabindex="-1"></button>' : ''}
  <label part="label">
    <input type="checkbox" id="cbx_${id}" part="checkbox" tabindex="-1">
    ${iconTemplate(icon)}
    <span part="title">${title}</span>
  </label>
  ${(children?.size > 0) ? treeTemplate(children, false) : ''}
</li>`;

const iconTemplate = (icon) => {
  if (!icon) {
    return '';
  }
  if (icon.startsWith('<svg ') && icon.endsWith('</svg>')) {
    return '<svg part="icon"' + icon.slice(4);
  }
  return `<img src="${sanitize(icon)}" alt="" part="icon">`;
};
