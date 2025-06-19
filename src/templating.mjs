/** @import {CbxTreeItem, CbxTreeMap} from './cbx-tree.mjs' */

const sanitize = (unsafeStr) => ['&', '"'].reduce((str, char) => str.replaceAll(char, `&#${char.charCodeAt(0)};`), unsafeStr);

/**
 * Render a tree
 * @param {CbxTreeMap} tree - Tree data
 * @returns {string}
 */
export const treeTemplate = (tree) => `
<ul part="tree">
  ${[...tree.values()].reduce((html, item) => html + itemTemplate(item), '')}
</ul>`;

/**
 * Render a tree item
 * @param {CbxTreeItem} item - Tree item data
 * @returns {string}
 */
export const itemTemplate = ({id, value, title, icon, children}) => `
<li part="item">
  ${(children?.size > 0) ? '<button type="button" part="toggle"></button>' : ''}
  <label part="label">
    <input type="checkbox" id="cbx_${id}" value="${sanitize(value)}" part="checkbox">
    ${icon ? `<img src="${sanitize(icon)}" alt="" part="icon">` : ''}
    <span part="title">${title}</span>
  </label>
  ${(children?.size > 0) ? treeTemplate(children) : ''}
</li>`;
