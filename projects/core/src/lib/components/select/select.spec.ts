import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TxSelect } from './select';
import { TxSelectOption } from '../../utils/types';

const OPTIONS: TxSelectOption<string>[] = [
  { value: 'ar', label: 'Ardent Supply' },
  { value: 'bw', label: 'Brightwater' },
  { value: 'ci', label: 'Corvid Industrial', disabled: true },
  { value: 'dc', label: 'Delta Components' },
];

@Component({
  standalone: true,
  imports: [TxSelect],
  template: `
    <tx-select
      label="Supplier"
      [options]="options"
      [(value)]="value"
      [clearable]="true"
      [filterable]="filterable()"
    />
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly value = signal<string | null>(null);
  readonly filterable = signal<boolean | 'auto'>(false);
}

@Component({
  standalone: true,
  imports: [TxSelect, ReactiveFormsModule],
  template: `<tx-select label="Supplier" [options]="options" [formControl]="control" />`,
})
class FormHost {
  readonly options = OPTIONS;
  readonly control = new FormControl<string | null>('bw');
}

describe('TxSelect', () => {
  let fixture: ComponentFixture<Host>;

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.tx-select__trigger');
  const panel = (): HTMLElement | null => document.querySelector('.tx-select__panel');
  const options = (): HTMLElement[] =>
    Array.from(document.querySelectorAll('.tx-select__option'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('shows the placeholder until something is chosen', () => {
    expect(trigger().textContent!.trim()).toBe('Select…');
  });

  it('is a combobox that reports its expanded state', () => {
    expect(trigger().getAttribute('role')).toBe('combobox');
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    trigger().click();
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('opens on click and renders every option', () => {
    trigger().click();
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
    expect(options().length).toBe(4);
  });

  it('opens when the chevron is clicked, not just the value area', () => {
    const arrow: SVGElement = fixture.nativeElement.querySelector('.tx-select__arrow');

    // The chevron must live INSIDE the trigger. As a sibling it sat over the
    // wrapper div and, being pointer-events:none, sent the click through to an
    // element with no handler — so clicking it did nothing.
    expect(arrow.closest('.tx-select__trigger')).not.toBeNull();

    trigger().click();
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
  });

  it('keeps the clear control outside the trigger so it can act on its own', () => {
    fixture.componentInstance.value.set('ar');
    fixture.detectChanges();

    const clear: HTMLButtonElement = fixture.nativeElement.querySelector('.tx-select__clear');
    expect(clear.closest('.tx-select__trigger')).toBeNull();

    clear.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeNull();
    // Clearing must not also open the panel.
    expect(panel()).toBeNull();
  });

  it('opens on ArrowDown from the trigger', () => {
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
  });

  it('marks disabled options so they cannot be chosen', () => {
    trigger().click();
    fixture.detectChanges();
    expect(options()[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('commits a choice, closes, and shows the label', () => {
    trigger().click();
    fixture.detectChanges();

    options()[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('bw');
    expect(trigger().textContent!.trim()).toBe('Brightwater');
    expect(panel()).toBeNull();
  });

  it('clears the value with the clear control', () => {
    fixture.componentInstance.value.set('ar');
    fixture.detectChanges();

    const clear: HTMLButtonElement = fixture.nativeElement.querySelector('.tx-select__clear');
    expect(clear).not.toBeNull();
    clear.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('filters options by label, case-insensitively', () => {
    fixture.componentInstance.filterable.set(true);
    fixture.detectChanges();

    trigger().click();
    fixture.detectChanges();

    const input: HTMLInputElement = document.querySelector('.tx-select__filter-input')!;
    input.value = 'brig';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(options().length).toBe(1);
    expect(options()[0].textContent).toContain('Brightwater');
  });

  it('reports no matches when the filter excludes everything', () => {
    fixture.componentInstance.filterable.set(true);
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();

    const input: HTMLInputElement = document.querySelector('.tx-select__filter-input')!;
    input.value = 'zzzz';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(options().length).toBe(0);
    expect(document.querySelector('.tx-select__status')!.textContent).toContain('No matches');
  });
});

describe('TxSelect with reactive forms', () => {
  let fixture: ComponentFixture<FormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('renders the control value through writeValue', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.tx-select__trigger');
    expect(trigger.textContent!.trim()).toBe('Brightwater');
  });

  it('propagates a choice back to the form control', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.tx-select__trigger');
    trigger.click();
    fixture.detectChanges();

    const options = Array.from(
      document.querySelectorAll('.tx-select__option'),
    ) as HTMLElement[];
    options[3].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe('dc');
  });

  it('disables the trigger when the control is disabled', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.tx-select__trigger');
    expect(trigger.disabled).toBe(true);
  });
});
