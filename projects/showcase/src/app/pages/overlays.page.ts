import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  TX_DIALOG_DATA,
  TxAccordion,
  TxAccordionPanel,
  TxButton,
  TxDialog,
  TxDialogRef,
  TxDialogService,
  TxIcon,
  TxInput,
  TxToastService,
} from '@tx-angular-design-system/core';
import { DialogRef } from '@angular/cdk/dialog';
import { ApiRow, DemoApi, DemoExample, DemoGuidance, DemoKeys, DemoPage } from '../shared/demo';

/** A dialog with its own content, opened by the service. */
@Component({
  standalone: true,
  imports: [TxDialog, TxInput, TxButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tx-dialog heading="Rename item" [subtitle]="data.sku" (dismissed)="ref.close()">
      <tx-input label="Name" [(value)]="name" clearable />
      <div slot="actions">
        <tx-button variant="text" (activated)="ref.close()">Cancel</tx-button>
        <tx-button variant="filled" [disabled]="!name().trim()" (activated)="ref.close(name())">
          Save
        </tx-button>
      </div>
    </tx-dialog>
  `,
})
export class RenameDialog {
  protected readonly data = inject<{ sku: string; name: string }>(TX_DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly name = signal(this.data.name);
}

@Component({
  standalone: true,
  imports: [
    DemoPage,
    DemoExample,
    DemoApi,
    DemoKeys,
    DemoGuidance,
    TxAccordion,
    TxAccordionPanel,
    TxButton,
    TxIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      heading="Disclosure & overlays"
      lede="An accordion for sections that fold away, and two services — dialogs and toasts — that
            you call rather than place. Both overlays are driven by the CDK, so focus trapping,
            scroll blocking and focus restore are handled."
    >
      <demo-example heading="Accordion" [code]="accordionCode" column>
        <tx-accordion class="demo-accordion" [multiExpandable]="true">
          <tx-accordion-panel label="Delivery" hint="Ships within two days" icon="download">
            <p class="prose">
              Orders placed before 15:00 are dispatched the same working day.
            </p>
          </tx-accordion-panel>
          <tx-accordion-panel label="Returns" icon="arrow-down">
            <p class="prose">Unopened items can be returned within 30 days.</p>
          </tx-accordion-panel>
          <tx-accordion-panel label="Warranty" icon="info" [disabled]="true">
            <p class="prose">Not available for this item.</p>
          </tx-accordion-panel>
        </tx-accordion>
        <p class="note">
          The disabled section stays focusable and readable — a native disabled button would drop
          out of the tab order and hide the section from keyboard users entirely.
        </p>
      </demo-example>

      <demo-example heading="Dialogs" note="Typed data in, typed result out." [code]="dialogCode">
        <tx-button variant="filled" (activated)="rename()">
          <tx-icon slot="leading" name="edit" size="sm" />
          Rename item
        </tx-button>
        <tx-button variant="danger" (activated)="remove()">
          <tx-icon slot="leading" name="trash" size="sm" />
          Delete item
        </tx-button>
        @if (lastResult()) {
          <span class="state">{{ lastResult() }}</span>
        }
      </demo-example>

      <demo-example
        heading="Toasts"
        note="Errors are announced assertively and stay until dismissed; everything else is polite and times out."
        [code]="toastCode"
      >
        <tx-button variant="outlined" (activated)="toast.success('Item saved')">Success</tx-button>
        <tx-button variant="outlined" (activated)="toast.info('Syncing with the server')">Info</tx-button>
        <tx-button variant="outlined" (activated)="toast.warning('Stock is running low')">Warning</tx-button>
        <tx-button variant="outlined" (activated)="failed()">Error with action</tx-button>
        <tx-button variant="text" (activated)="toast.dismissAll()">Dismiss all</tx-button>
      </demo-example>

      <demo-api heading="tx-accordion-panel" [rows]="accordionApi" />
      <demo-api heading="TxDialogService" [rows]="dialogApi" />
      <demo-api heading="TxToastService" [rows]="toastApi" />
      <demo-keys [rows]="keys" />
      <demo-guidance [dos]="dos" [donts]="donts" />
    </demo-page>
  `,
  styles: [
    `
      .demo-accordion {
        width: 100%;
        max-width: 34rem;
      }
      .prose {
        margin: 0;
        max-width: 62ch;
        font-size: var(--tx-text-sm);
      }
      .note,
      .state {
        margin: 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      .state {
        align-self: center;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-xs);
      }
    `,
  ],
})
export class OverlaysPage {
  private readonly dialog = inject(TxDialogService);
  protected readonly toast = inject(TxToastService);

  protected readonly lastResult = signal('');

  protected async rename(): Promise<void> {
    const ref = this.dialog.open<string, { sku: string; name: string }, RenameDialog>(RenameDialog, {
      data: { sku: 'CB-1042', name: 'Shielded twisted pair, 4-core' },
      width: '28rem',
    });

    const name = await ref.result;
    if (name) {
      this.lastResult.set(`Renamed to "${name}"`);
      this.toast.success('Item renamed');
    } else {
      this.lastResult.set('Dismissed');
    }
  }

  protected async remove(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Delete CB-1042?',
      message: 'This removes the item and its stock history. It cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });

    this.lastResult.set(confirmed ? 'Deleted' : 'Cancelled');
    if (confirmed) this.toast.success('Item deleted');
  }

  protected failed(): void {
    this.toast.error('Could not reach the server', {
      action: 'Retry',
      onAction: () => this.toast.info('Retrying…'),
    });
  }

  protected readonly accordionCode = `<tx-accordion multiExpandable>
  <tx-accordion-panel label="Delivery" hint="Ships within two days" icon="download">
    …
  </tx-accordion-panel>
  <tx-accordion-panel label="Returns">…</tx-accordion-panel>
</tx-accordion>`;

  protected readonly dialogCode = `// Your own component, typed both ways
const ref = dialog.open<string, { sku: string }, RenameDialog>(RenameDialog, {
  data: { sku: 'CB-1042' },
  width: '28rem',
});
const name = await ref.result;      // string | undefined

// Inside the dialog
protected readonly data = inject(TX_DIALOG_DATA);
protected readonly ref = inject(DialogRef);

// Or the shorthand — resolves false on any dismissal, never undefined
if (await dialog.confirm({ title: 'Delete CB-1042?', danger: true })) { … }`;

  protected readonly toastCode = `toast.success('Item saved');
toast.warning('Stock is running low');

toast.error('Could not reach the server', {
  action: 'Retry',
  onAction: () => retry(),
});

toast.dismissAll();`;

  protected readonly accordionApi: readonly ApiRow[] = [
    { name: 'label', type: 'string', description: 'Header text. Required.' },
    { name: 'hint', type: 'string', def: "''", description: 'Secondary line under the label.' },
    { name: 'icon', type: 'string', def: "''", description: 'Registered icon shown before the label.' },
    { name: 'expanded', type: 'model<boolean>', def: 'false', description: 'Two-way bindable open state.' },
    { name: 'disabled', type: 'boolean', def: 'false', description: 'Soft-disabled: focusable and readable, but not activatable.' },
    { name: 'opened / closed', type: 'output<void>', description: 'Fire when the section opens or closes.' },
  ];

  protected readonly dialogApi: readonly ApiRow[] = [
    { name: 'open(content, options)', type: 'TxDialogRef<R>', description: 'Opens a component or template. `await ref.result` for the typed result.' },
    { name: 'confirm(options)', type: 'Promise<boolean>', description: 'Yes/no. Resolves false on any dismissal, so callers never check for undefined.' },
    { name: 'options.data', type: 'D', description: 'Injected into the dialog as TX_DIALOG_DATA.' },
    { name: 'options.dismissable', type: 'boolean', def: 'true', description: 'Scrim click and Escape close. Turn off for destructive flows.' },
    { name: 'options.width', type: 'string', def: "'30rem'", description: 'Panel width.' },
  ];

  protected readonly toastApi: readonly ApiRow[] = [
    { name: 'success / info / warning / error', type: '(message, options?) => number', description: 'Shows a toast and returns its id.' },
    { name: 'options.duration', type: 'number', description: 'Milliseconds before auto-dismiss. 0 keeps it. Errors default to 0.' },
    { name: 'options.action', type: 'string', description: 'Label for a single action button.' },
    { name: 'options.ariaLive', type: "'polite' | 'assertive'", description: 'Overrides the default politeness for one message.' },
    { name: 'dismiss(id) / dismissAll()', type: 'void', description: 'Removes one toast, or all of them.' },
    { name: 'position', type: "signal<TxToastPosition>", def: "'bottom-end'", description: 'Where the stack sits.' },
  ];

  protected readonly keys = [
    { keys: 'Tab', action: 'Move between accordion headers, or within a dialog' },
    { keys: '↑ ↓', action: 'Move between accordion headers' },
    { keys: 'Enter · Space', action: 'Expand or collapse a section' },
    { keys: 'Escape', action: 'Close a dismissable dialog' },
  ];

  protected readonly dos = [
    'Use a dialog for a decision that blocks the flow, and a toast for one that does not.',
    'Let errors persist — a message you must not miss should not time out while you read.',
    'Give a toast an action when there is an obvious next step, such as retry or undo.',
    'Turn off dismissable for destructive confirms so a stray click cannot answer for the user.',
  ];

  protected readonly donts = [
    'Do not stack dialogs; if a dialog needs a dialog, the flow needs a page.',
    'Do not put a form in a toast — it disappears while being filled in.',
    'Do not announce routine successes assertively; it interrupts screen-reader users mid-sentence.',
    'Do not use an accordion to hide something everyone needs; folding it away costs a click each time.',
  ];
}
