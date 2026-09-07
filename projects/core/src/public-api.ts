/*
 * Public API surface of @tx-angular-design-system/core
 *
 * Everything exported here is covered by semver. Anything not exported here is
 * private and may change in any release — be deliberate about additions.
 */

/* configuration */
export {
  TX_DESIGN_SYSTEM_CONFIG,
  TX_DEFAULT_DESIGN_SYSTEM_CONFIG,
  provideTxDesignSystem,
  type TxDesignSystemConfig,
  type TxDensity,
} from './lib/tokens/design-system-config';

/* shared types */
export type {
  TxNavItem,
  TxNavSection,
  TxTreeNode,
  TxSelectOption,
  TxSortDirection,
  TxSortState,
  TxPageState,
  TxColumnVariant,
  TxTableColumn,
  TxTableAction,
  TxTableActionEvent,
} from './lib/utils/types';

/* primitives */
export { TxButton, type TxButtonVariant, type TxButtonSize } from './lib/components/button/button';
export { TxIcon, type TxIconSize } from './lib/components/icon/icon';
export {
  TxIconRegistry,
  provideTxIcons,
  txIconDefinition,
  type TxIconDefinition,
  type TxIconInput,
} from './lib/components/icon/icon-registry';
export { TxCard, type TxCardVariant } from './lib/components/card/card';

/* form controls */
export { TxInput, type TxInputType } from './lib/components/input/input';
export { TxTextarea } from './lib/components/textarea/textarea';
export { TxCheckbox } from './lib/components/checkbox/checkbox';
export { TxToggle } from './lib/components/toggle/toggle';
export { TxRadioGroup } from './lib/components/radio-group/radio-group';
export { TxSelect } from './lib/components/select/select';
export { TxMultiSelect } from './lib/components/multi-select/multi-select';

/* services */
export {
  TxDialogService,
  TxDialogRef,
  TxDialog,
  TX_DIALOG_DATA,
  type TxDialogOptions,
  type TxConfirmOptions,
} from './lib/components/dialog/dialog';
export {
  TxToastService,
  type TxToast,
  type TxToastKind,
  type TxToastOptions,
  type TxToastPosition,
} from './lib/components/toast/toast';

/* disclosure */
export { TxAccordion, TxAccordionPanel } from './lib/components/accordion/accordion';

/* layout and navigation */
export { TxAppShell } from './lib/components/app-shell/app-shell';
export { TxHeader } from './lib/components/header/header';
export { TxSidebar } from './lib/components/sidebar/sidebar';

/* data display */
export { TxTree } from './lib/components/tree/tree';
export { TxReorderList } from './lib/components/reorder-list/reorder-list';
export { TxTable } from './lib/components/table/table';
export { TxPaginator } from './lib/components/table/paginator';
