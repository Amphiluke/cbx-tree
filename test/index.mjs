const createItem = () => {
  const value = String(Math.random()).slice(2);
  const path = ['M0 0L16 8 0 16z', 'M0 0L16 0 16 16 0 16z', 'M0 8a8 8 0 1 1 0 .01z'][Math.floor(Math.random() * 3)];
  const color = `rgb(${Math.floor(Math.random() * 256)} ${Math.floor(Math.random() * 256)} ${Math.floor(Math.random() * 256)})`;
  return {
    value,
    title: `Item “${value}”`,
    checked: Math.random() > 0.5,
    icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path d='${path}' fill='${color}'/></svg>`,
    children: Math.random() > 0.5 ? null : undefined,
  };
};

const subtreeProvider = async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return [createItem(), createItem(), createItem()];
};

customElements.whenDefined('cbx-tree').then(() => {
  const cbxTree = document.querySelector('[name="tree[]"]');
  cbxTree.setData([createItem(), {...createItem(), children: [createItem(), createItem()]}, createItem()]);
  cbxTree.insertAdjacentHTML('afterend', `
    <cbx-tree name="tree2[]">
      <script type="application/json">
        ${JSON.stringify([createItem(), createItem(), {...createItem(), children: [createItem(), createItem()]}])}
      <\/script>
    </cbx-tree>
  `);
  cbxTree.subtreeProvider = document.querySelector('[name="tree2[]"]').subtreeProvider = subtreeProvider;
});
