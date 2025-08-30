const tree = document.getElementById('file-tree');

const textNodes = [];
export const collectTextNodes = () => {
  textNodes.length = 0;
  const treeWalker = document.createTreeWalker(tree.shadowRoot.firstElementChild, NodeFilter.SHOW_TEXT);
  let currentNode = treeWalker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = treeWalker.nextNode();
  }
};

const addHighlightCSS = () => {
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync('::highlight(filter-results){background-color:#ff0066;color:#fff;}');
  tree.shadowRoot.adoptedStyleSheets.push(stylesheet);
};

// https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API#highlighting_search_results
const highlightMatches = (query) => {
  if (!CSS.highlights) {
    return;
  }
  CSS.highlights.clear();
  if (!query) {
    return;
  }
  const ranges = textNodes.map((textNode) => {
    const text = textNode.textContent.toLowerCase();
    const indices = [];
    let startPos = 0;
    while (startPos < text.length) {
      const index = text.indexOf(query, startPos);
      if (index === -1) break;
      indices.push(index);
      startPos = index + query.length;
    }
    return indices.map((index) => {
      const range = new Range();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + query.length);
      return range;
    });
  });
  CSS.highlights.set('filter-results', new Highlight(...ranges.flat()));
};

customElements.whenDefined('cbx-tree').then(() => {
  addHighlightCSS();
  collectTextNodes();
  const {subtreeProvider} = tree;
  if (subtreeProvider) {
    tree.subtreeProvider = (...args) => subtreeProvider(...args).finally(() => setTimeout(collectTextNodes, 0));
  }
});

let timer = null;
document.getElementById('filter').addEventListener('input', ({target}) => {
  if (timer) {
    return;
  }
  timer = setTimeout(() => {
    timer = null;
    const query = target.value.trim().toLocaleLowerCase();
    const predicate = query.length ? ({title}) => title.toLocaleLowerCase().includes(query) : () => true;
    tree.filter(predicate);
    if (query.length) {
      tree.toggle(true);
    }
    highlightMatches(query);
  }, 250);
});
