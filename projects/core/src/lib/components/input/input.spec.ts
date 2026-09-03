import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TxInput } from './input';
import { TxRadioGroup } from '../radio-group/radio-group';
import { TxSelectOption } from '../../utils/types';

@Component({
  standalone: true,
  imports: [TxInput],
  template: `
    <tx-input
      label="Email"
      type="email"
      [(value)]="value"
      [clearable]="true"
      [maxLength]="maxLength()"
      hint="We never share it"
    />
  `,
})
class Host {
  readonly value = signal('');
  readonly maxLength = signal<number | null>(null);
}

@Component({
  standalone: true,
  imports: [TxInput, ReactiveFormsModule],
  template: `<tx-input label="Email" [formControl]="control" />`,
})
class FormHost {
  readonly control = new FormControl('start');
}

describe('TxInput', () => {
  let fixture: ComponentFixture<Host>;
  const field = (): HTMLInputElement => fixture.nativeElement.querySelector('.tx-input__field');

  const type = (text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('associates the label with the field', () => {
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('.tx-field__label');
    expect(label.htmlFor).toBe(field().id);
    expect(field().type).toBe('email');
  });

  it('describes the field with its hint', () => {
    const describedBy = field().getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`#${describedBy}`).textContent).toContain(
      'We never share it',
    );
  });

  it('writes through on input', () => {
    type('a@b.com');
    expect(fixture.componentInstance.value()).toBe('a@b.com');
  });

  it('shows a clear control only once there is something to clear', () => {
    expect(fixture.nativeElement.querySelector('.tx-input__clear')).toBeNull();

    type('something');
    expect(fixture.nativeElement.querySelector('.tx-input__clear')).not.toBeNull();

    fixture.nativeElement.querySelector('.tx-input__clear').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('clears on Escape', () => {
    type('something');
    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('counts characters against the limit', () => {
    fixture.componentInstance.maxLength.set(10);
    fixture.detectChanges();
    type('abc');

    expect(field().getAttribute('maxlength')).toBe('10');
    expect(fixture.nativeElement.querySelector('.tx-input__counter').textContent).toContain('3 / 10');
  });
});

describe('TxInput with reactive forms', () => {
  let fixture: ComponentFixture<FormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
  });

  it('renders the control value and propagates edits', () => {
    const field: HTMLInputElement = fixture.nativeElement.querySelector('.tx-input__field');
    expect(field.value).toBe('start');

    field.value = 'changed';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('changed');
  });

  it('disables the field when the control is disabled', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    const field: HTMLInputElement = fixture.nativeElement.querySelector('.tx-input__field');
    expect(field.disabled).toBe(true);
  });
});

const OPTIONS: TxSelectOption<string>[] = [
  { value: 'std', label: 'Standard' },
  { value: 'exp', label: 'Express' },
  { value: 'na', label: 'Unavailable', disabled: true },
];

@Component({
  standalone: true,
  imports: [TxRadioGroup],
  template: `<tx-radio-group label="Delivery" [options]="options" [(value)]="value" />`,
})
class RadioHost {
  readonly options = OPTIONS;
  readonly value = signal<string | null>(null);
}

describe('TxRadioGroup', () => {
  let fixture: ComponentFixture<RadioHost>;
  const radios = (): HTMLInputElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-radio-group__native'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RadioHost] }).compileComponents();
    fixture = TestBed.createComponent(RadioHost);
    fixture.detectChanges();
  });

  it('groups native radios under one name inside a fieldset', () => {
    expect(radios().length).toBe(3);
    expect(new Set(radios().map((r) => r.name)).size).toBe(1);
    expect(fixture.nativeElement.querySelector('fieldset legend').textContent).toContain('Delivery');
  });

  it('selects a value', () => {
    radios()[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('exp');
  });

  it('does not select a disabled option', () => {
    expect(radios()[2].disabled).toBe(true);
    radios()[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
  });
});
