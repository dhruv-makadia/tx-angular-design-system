import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TxCheckbox,
  TxIcon,
  TxInput,
  TxRadioGroup,
  TxSelectOption,
  TxTextarea,
  TxToggle,
} from '@tx-angular-design-system/core';
import { ApiRow, DemoApi, DemoExample, DemoGuidance, DemoKeys, DemoPage } from '../shared/demo';

@Component({
  standalone: true,
  imports: [
    DemoPage,
    DemoExample,
    DemoApi,
    DemoKeys,
    DemoGuidance,
    TxInput,
    TxTextarea,
    TxCheckbox,
    TxToggle,
    TxRadioGroup,
    TxIcon,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      heading="Text & choice"
      lede="Input, textarea, checkbox, toggle and radio group. Each one works with reactive forms
            through ControlValueAccessor and with Signal Forms through its value model."
    >
      <demo-example heading="Text input" [code]="inputCode" column>
        <div class="grid">
          <tx-input label="Reference" placeholder="CB-1042" [(value)]="ref" clearable />
          <tx-input label="Email" type="email" placeholder="name@example.com" [(value)]="email" />
          <tx-input label="Password" type="password" [(value)]="secret" />
          <tx-input label="Search" type="search" placeholder="Find an item" [(value)]="query" clearable>
            <tx-icon slot="prefix" name="search" size="sm" />
          </tx-input>
        </div>
      </demo-example>

      <demo-example
        heading="Hints, errors and counters"
        note="An error replaces the hint only while invalid is set, so the guidance stays visible until it is actually wrong."
        [code]="validationCode"
        column
      >
        <div class="grid">
          <tx-input
            label="SKU"
            placeholder="CB-1042"
            hint="Two letters, a dash, four digits"
            error="That does not look like a SKU"
            [(value)]="sku"
            [invalid]="skuInvalid()"
            [maxLength]="7"
            required
          />
          <tx-input label="Disabled" [(value)]="ref" [disabled]="true" />
          <tx-input label="Read only" value="Locked by policy" [readonly]="true" />
        </div>
      </demo-example>

      <demo-example heading="Reactive forms" note="Validation state comes from the control." [code]="formCode" column>
        <div class="grid">
          <tx-input
            label="Owner"
            [formControl]="owner"
            [invalid]="owner.invalid && owner.touched"
            error="An owner is required"
            required
          />
        </div>
        <p class="state">
          value: <code>{{ owner.value || '(empty)' }}</code> · status:
          <code>{{ owner.status }}</code> · touched: <code>{{ owner.touched }}</code>
        </p>
      </demo-example>

      <demo-example heading="Textarea" note="Grows with its content, between minRows and maxRows." [code]="textareaCode" column>
        <tx-textarea
          label="Notes"
          placeholder="Anything worth recording"
          [(value)]="notes"
          [minRows]="2"
          [maxRows]="8"
          [maxLength]="240"
          hint="Grows as you type"
        />
      </demo-example>

      <demo-example heading="Checkbox and toggle" [code]="choiceCode">
        <div class="stack">
          <tx-checkbox [(checked)]="agreed" label="Details confirmed" hint="Required before saving" />
          <tx-checkbox [(checked)]="partial" [(indeterminate)]="mixed" label="Select all" />
          <tx-checkbox [checked]="true" [disabled]="true" label="Locked" />
        </div>
        <div class="stack">
          <tx-toggle [(checked)]="tracked" label="Track stock levels" hint="Warn below reorder point" />
          <tx-toggle [(checked)]="alerts" label="Email alerts" />
          <tx-toggle [checked]="false" [disabled]="true" label="Unavailable" />
        </div>
      </demo-example>

      <demo-example heading="Radio group" note="Native radios in a fieldset — the arrow keys come from the platform." [code]="radioCode">
        <tx-radio-group label="Handling" [options]="handling" [(value)]="handlingValue" />
        <tx-radio-group label="Inline" [options]="handling" [(value)]="handlingValue" [inline]="true" />
      </demo-example>

      <demo-api heading="tx-input" [rows]="inputApi" />
      <demo-api heading="tx-checkbox / tx-toggle" [rows]="choiceApi" />
      <demo-keys [rows]="keys" />
      <demo-guidance [dos]="dos" [donts]="donts" />
    </demo-page>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr));
        gap: var(--tx-space-4);
        width: 100%;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--tx-space-3);
      }
      .state {
        margin: var(--tx-space-3) 0 0;
        font-size: var(--tx-text-xs);
        color: var(--tx-color-on-surface-muted);
      }
      code {
        font-family: var(--tx-font-mono);
        font-size: 0.92em;
        color: var(--tx-color-on-surface);
      }
    `,
  ],
})
export class InputsPage {
  protected readonly ref = signal('CB-1042');
  protected readonly email = signal('');
  protected readonly secret = signal('');
  protected readonly query = signal('');
  protected readonly sku = signal('');
  protected readonly notes = signal('');
  protected readonly agreed = signal(false);
  protected readonly partial = signal(false);
  protected readonly mixed = signal(true);
  protected readonly tracked = signal(true);
  protected readonly alerts = signal(false);
  protected readonly handlingValue = signal<string | null>('standard');

  protected readonly owner = new FormControl('', { validators: [Validators.required] });

  protected readonly skuInvalid = computed(
    () => this.sku().length > 0 && !/^[A-Z]{2}-\d{4}$/.test(this.sku()),
  );

  protected readonly handling: readonly TxSelectOption<string>[] = [
    { value: 'standard', label: 'Standard', hint: 'No special handling' },
    { value: 'fragile', label: 'Fragile', hint: 'Cushioned packaging' },
    { value: 'hazmat', label: 'Hazardous', disabled: true },
  ];

  protected readonly inputCode = `<tx-input label="Reference" placeholder="CB-1042" [(value)]="ref" clearable />

<tx-input label="Search" type="search" [(value)]="query" clearable>
  <tx-icon slot="prefix" name="search" size="sm" />
</tx-input>`;

  protected readonly validationCode = `<tx-input
  label="SKU"
  hint="Two letters, a dash, four digits"
  error="That does not look like a SKU"
  [(value)]="sku"
  [invalid]="skuInvalid()"
  [maxLength]="7"
  required />`;

  protected readonly formCode = `owner = new FormControl('', { validators: [Validators.required] });

<tx-input
  label="Owner"
  [formControl]="owner"
  [invalid]="owner.invalid && owner.touched"
  error="An owner is required"
  required />`;

  protected readonly textareaCode = `<tx-textarea
  label="Notes"
  [(value)]="notes"
  [minRows]="2"
  [maxRows]="8"
  [maxLength]="240" />`;

  protected readonly choiceCode = `<tx-checkbox [(checked)]="agreed" label="Details confirmed" />
<tx-checkbox [(checked)]="all" [(indeterminate)]="some" label="Select all" />

<!-- role="switch": applies immediately, not on submit -->
<tx-toggle [(checked)]="tracked" label="Track stock levels" />`;

  protected readonly radioCode = `<tx-radio-group label="Handling" [options]="handling" [(value)]="value" />`;

  protected readonly inputApi: readonly ApiRow[] = [
    { name: 'value', type: 'model<string>', def: "''", description: 'Two-way bindable. Emits valueChange.' },
    { name: 'type', type: "'text' | 'number' | 'email' | 'password' | 'search' | 'tel' | 'url'", def: "'text'", description: 'Native input type.' },
    { name: 'label', type: 'string', def: "''", description: 'Visible label, associated with the field.' },
    { name: 'hint', type: 'string', def: "''", description: 'Helper text below the field.' },
    { name: 'error', type: 'string', def: "''", description: 'Replaces the hint while invalid is set.' },
    { name: 'invalid', type: 'boolean', def: 'false', description: 'Marks the field invalid and shows the error.' },
    { name: 'clearable', type: 'boolean', def: 'false', description: 'Adds a clear control once there is a value. Escape also clears.' },
    { name: 'maxLength', type: 'number | null', def: 'null', description: 'Caps input and shows a live counter.' },
    { name: 'readonly', type: 'boolean', def: 'false', description: 'Value is visible but not editable.' },
  ];

  protected readonly choiceApi: readonly ApiRow[] = [
    { name: 'checked', type: 'model<boolean>', def: 'false', description: 'Two-way bindable state.' },
    { name: 'indeterminate', type: 'model<boolean>', def: 'false', description: 'Checkbox only. Cleared as soon as the user toggles.' },
    { name: 'label', type: 'string', def: "''", description: 'Label text. Content projection also works.' },
    { name: 'hint', type: 'string', def: "''", description: 'Secondary line under the label.' },
    { name: 'labelFirst', type: 'boolean', def: 'true', description: 'Toggle only. Puts the switch after the label.' },
  ];

  protected readonly keys = [
    { keys: 'Tab', action: 'Move between controls' },
    { keys: 'Space', action: 'Toggle a checkbox, switch or radio' },
    { keys: '↑ ↓ ← →', action: 'Move and select within a radio group' },
    { keys: 'Escape', action: 'Clear a clearable input' },
  ];

  protected readonly dos = [
    'Write labels that say what the value is, not what to do.',
    'Keep the hint visible; show an error only once the field is actually wrong.',
    'Use a toggle for settings that take effect immediately, a checkbox for form values.',
    'Set maxLength when there is a real limit, so the counter can warn early.',
  ];

  protected readonly donts = [
    'Do not use a placeholder as the label — it disappears as soon as someone types.',
    'Do not validate on every keystroke before the field has been left.',
    'Do not use a radio group for more than about seven options; use a select.',
    'Do not mark everything required; mark the optional ones instead when most are required.',
  ];
}
