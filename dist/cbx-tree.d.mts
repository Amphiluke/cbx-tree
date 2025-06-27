export interface CbxRawTreeItem {
  title: string;
  value: string;
  icon?: string;
  checked?: boolean;
  collapsed?: boolean;
  children?: CbxRawTreeItem[] | null;
}

export default class CbxTree extends HTMLElement {
  #private;

  static get formAssociated(): true;
  subtreeProvider: ((parentValue: string) => Promise<CbxRawTreeItem[]>) | null;
  get formData(): FormData;
  get form(): HTMLFormElement | null;
  get name(): string | null;
  set name(value: string);
  get disabled(): boolean;
  set disabled(value: boolean);
  get type(): string;

  constructor();

  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string, mode: string): void;

  setData(treeData: CbxRawTreeItem[]): void;
  toJSON(): CbxRawTreeItem[];
  toggle(isExpanding: boolean): void;

  get validity(): ValidityState;
  get validationMessage(): string;
  get willValidate(): boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setValidity(flags?: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
}
