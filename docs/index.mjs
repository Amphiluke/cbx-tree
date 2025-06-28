import {treeData} from './tree-data.mjs';
import * as icons from './icons.mjs';

const processTree = (tree, valuePrefix = '') => {
  tree.forEach((item) => {
    item.value = valuePrefix ? `${valuePrefix} / ${item.title}` : item.title;
    if (item.children === undefined) {
      const [, extension] = item.title.split('.');
      item.icon = (extension in icons) ? icons[extension] : icons.file;
      return;
    }
    item.icon = icons.folder;
    item.collapsed = true;
    processTree(item.children, item.value);
  });
};

const fileStructure = structuredClone(treeData);
processTree(fileStructure);

customElements.whenDefined('cbx-tree').then(() => {
  const tree = document.getElementById('file-tree');
  tree.setData(fileStructure);

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

const files = new URLSearchParams(location.search).getAll('files[]');
if (files.length) {
  const popover = document.getElementById('archive-popover');
  popover.textContent = `Files have been successfully archived:\n\n${files.join('\n')}`;
  popover.showPopover();
}
