# `<cbx-tree>`: The Checkbox Tree element

The `<cbx-tree>` element is a web component for building tree-like hierarchic lists with checkable items. Tree items in the `<cbx-tree>` element are collapsible if they have nested subtrees. Every item is equipped with a checkbox which can be in one of the following states:

* *checked*: the item and all its children are checked,
* *unchecked*: the item and all its children are unchecked,
* *indeterminate*: the item is technically unchecked but some its children are checked.

... demo image here ...

## Installation and import

If you use a bundler in your project, install cbx-tree as a dependency:

```shell
npm install cbx-tree
```

Now you may import it wherever it’s needed:

```javascript
import 'cbx-tree';
```

If you don’t use bundlers, just import the component as a module in your HTML files:

```html
<script type="module" src="https://esm.run/cbx-tree"></script>
```

or in ES modules:

```javascript
import "https://esm.run/cbx-tree";
```

## Usage notes

There are two ways to feed initial tree data to the `<cbx-tree>` component.

The first way is to provide tree data directly in HTML by adding JSON content as follows:

```html
<cbx-tree name="reading-list[]">
  <script type="application/json">
    [
      {
        "title": "Epic poetry",
        "value": "category-123",
        "icon": "/icons/epic-icon.svg",
        "children": [
          {
            "title": "Ancient Greek poems",
            "value": "category-179",
            "icon": "/icons/greek-icon.svg",
            "children": [
              {
                "title": "Iliad",
                "value": "book-10",
                "icon": "/icons/manuscript-icon.svg",
                "checked": true
              },
              {
                "title": "Odyssey",
                "value": "book-11",
                "icon": "/icons/manuscript-icon.svg",
                "checked": true
              }
            ]
          },
          {
            "title": "Ancient Mesopotamian poems",
            "value": "category-151",
            "icon": "/icons/mesopotamian-icon.svg",
            "children": [
              {
                "title": "Epic of Gilgamesh",
                "value": "book-8",
                "icon": "/icons/clay-tablet-icon.svg"
              }
            ]
          }
        ]
      }
    ]
  </script>
</cbx-tree>
```

> [!NOTE]
> Similarly to the `<textarea>` content, the data you provide in HTML is only used as a *default value*. In other words, dynamic updates of the HTML content don’t affect the current tree. To update the tree dynamically, one should use the [JavaScript API](#setdata) provided by the component.

The second option is to fill the initial tree programmatically using the [`setData()`](#setdata) method.

**HTML:**

```html
<cbx-tree name="reading-list[]"></cbx-tree>
```

**JavaScript:**

```javascript
customElements.whenDefined('cbx-tree').then(() => {
  const readingList = document.querySelector('[name="reading-list[]"]');
  readingList.setData([
    {
      title: 'Epic poetry',
      value: 'category-123',
      icon: '/icons/epic-icon.svg',
      children: [
        {
          title: 'Ancient Greek poems',
          value: 'category-179',
          icon: '/icons/greek-icon.svg',
          children: [
            {
              title: 'Iliad',
              value: 'book-10',
              icon: '/icons/manuscript-icon.svg',
              checked: true,
            },
            {
              title: 'Odyssey',
              value: 'book-11',
              icon: '/icons/manuscript-icon.svg',
              checked: true,
            },
          ],
        },
        {
          title: 'Ancient Mesopotamian poems',
          value: 'category-151',
          icon: '/icons/mesopotamian-icon.svg',
          children: [
            {
              title: 'Epic of Gilgamesh',
              value: 'book-8',
              icon: '/icons/clay-tablet-icon.svg',
            },
          ],
        },
      ],
    },
  ]);
});
```

> [!NOTE]
> JavaScript API of the `<cbx-tree>` component becomes fully functional as soon as the element is registered and defined. To stay on the safe side, it’s worth using the [`whenDefined()`](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/whenDefined) guard as shown in the example above.

## Tree data structure

As shown in the examples above, the tree is initialised with an array of objects representing the tree’s root items. Each item can have children forming a nested subtree. The table below provides information about the properties that can be specified for tree items at any nesting level.

| Property   | Type            | Required | Description                                                       |
| ---------- | --------------- | -------- | ----------------------------------------------------------------- |
| `title`    | string          | yes      | Text label of the tree item                                       |
| `value`    | string          | yes      | Internal value identifying the checked item in the submitted data |
| `checked`  | boolean         | no       | Initial state of the item selection                               |
| `icon`     | string          | no       | Item icons’s URL                                                  |
| `children` | array or `null` | no       | Nested subtree items                                              |

The value `null` of the `children` property is used for [on-demand loading of the subtree](#subtreeprovider).

## Attributes

This element includes the [global attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes).

### `name`

A mandatory attribute `name` is used by the `<cbx-tree>` component to construct data to be submitted with the form. Since the widget contains multiple checkable items, it may be a good idea to use a name with square brackets appended. This notation allows some server-side frameworks treat submitted data as an array.

```html
<cbx-tree name="reading-list[]"></cbx-tree>
```

### `disabled`

Applying this Boolean attribute turns all interactive controls within the tree into the disabled state. Items in the disabled tree cannot be collapsed or expanded by the user, and states of the checkboxes cannot be changed via the GUI.

## Events

### `cbxtreechange`

The `cbxtreechange` custom event is fired when the user changes the state of a checkbox in the tree. A complete information on the tree selection state is available as a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object through the [`detail`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail) property of the event instance.

```javascript
const readingList = document.querySelector('[name="reading-list[]"]');
readingList.addEventListener('cbxtreechange', (e) => {
  const selectionData = e.detail; // FormData instance
  console.log('Selected books & categories:', ...selectionData.values());
});
```

### `cbxtreetoggle`

The `cbxtreetoggle` custom event is fired when the user clicks a toggle button to expand or collapse a subtree under one of the tree items. The `detail` property of the event instance provides additional information about the target item:

| Property   | Description                                              |
| ---------- | -------------------------------------------------------- |
| `title`    | Title of the target item                                 |
| `value`    | Value of the target item                                 |
| `newState` | New state of the target item (either `open` or `closed`) |

```javascript
const readingList = document.querySelector('[name="reading-list[]"]');
readingList.addEventListener('cbxtreetoggle', (e) => {
  const {title, value, newState} = e.detail;
  console.log(`Item “${title}” (${value}) is now ${newState}`);
});
```
