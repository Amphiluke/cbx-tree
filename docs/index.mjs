import {treeData, vaultData} from './tree-data.mjs';
import * as icons from './icons.mjs';

const processTree = (tree, valuePrefix = '') => {
  tree.forEach((item) => {
    const title = item.title.replace(/<[^>]+>/g, '');
    item.value = valuePrefix ? `${valuePrefix}/${title}` : title;
    if (item.children === undefined) {
      const [, extension] = title.split('.');
      item.icon = (extension in icons) ? icons[extension] : icons.file;
      return;
    }
    item.icon = item.children ? icons.folder : icons.safe;
    item.collapsed = true;
    if (item.children !== null) {
      processTree(item.children, item.value);
    }
  });
};

const fileStructure = structuredClone(treeData);
processTree(fileStructure);
const valutStructure = structuredClone(vaultData);
processTree(valutStructure, 'vault [remote]');

const form = document.getElementById('archive-form');
const tree = document.getElementById('file-tree');

customElements.whenDefined('cbx-tree').then(() => {
  tree.setData(fileStructure);
  tree.subtreeProvider = async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.round(Math.random() * 2000)));
    const [, valutSubdir] = value.split('/');
    return valutSubdir ?
      valutStructure.find(({title}) => title === valutSubdir).children :
      valutStructure.map((subdir) => ({...subdir, children: null}));
  };

  const setValidity = (isValid) => tree.setValidity({valueMissing: !isValid}, 'At least one file must be selected');
  setValidity(false);
  tree.addEventListener('cbxtreechange', () => tree.classList.add('user-interacted'), {once: true});
  tree.addEventListener('invalid', () => tree.classList.add('user-interacted'), {once: true});
  tree.addEventListener('cbxtreechange', (e) => setValidity(e.detail.has('files[]')));

  document.getElementById('toggle-all-btn').addEventListener('click', () => tree.toggle());
  document.getElementById('check-all-btn').addEventListener('click', () => {
    tree.toggleChecked();
    setValidity(tree.formData.has('files[]'));
  });
});

const theme = localStorage.getItem('cbx-tree_theme') || 'system';
form.elements.namedItem('theme').value = theme;
tree.setAttribute('data-theme', theme);
form.addEventListener('change', ({target}) => {
  if (target.name === 'theme') {
    tree.setAttribute('data-theme', target.value);
    localStorage.setItem('cbx-tree_theme', target.value);
  }
});

const files = new URLSearchParams(location.search).getAll('files[]');
if (files.length) {
  const popover = document.getElementById('archive-popover');
  popover.textContent = `Files have been successfully archived:\n\n${files.join('\n')}`;
  popover.showPopover();
  history.replaceState(null, '', location.pathname);
}
