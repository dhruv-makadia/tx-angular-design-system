import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxMultiSelect } from './multi-select';
import { TxSelectOption } from '../../utils/types';

const OPTIONS: TxSelectOption<string>[] = [
  { value: 'ar', label: 'Ardent Supply', group: 'Active' },
  { value: 'bw', label: 'Brightwater', group: 'Active' },
  { value: 'ci', label: 'Corvid Industrial', group: 'Active' },
  { value: 'dc', label: 'Delta Components', group: 'Inactive', disabled: true },
];

@Component({
  standalone: true,
  imports: [TxMultiSelect],
  template: `
    <tx-multi-select
      label="Supplier"
      [options]="options"
      [(value)]="value"
      [maxVisibleChips]="2"
      [filterable]="false"
    />
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly value = signal<string[]>([]);
}

describe('TxMultiSelect', () => {
  let fixture: ComponentFixture<Host>;

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.tx-multi-select__trigger');
  const chips = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.tx-chip'));
  const options = (): HTMLElement[] =>
    Array.from(document.querySelectorAll('.tx-multi-select__option'));
  const open = () => {
    trigger().click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('opens and renders group headings alongside options', () => {
    open();
    expect(options().length).toBe(4);
    expect(document.querySelectorAll('.tx-multi-select__group').length).toBe(2);
  });

  it('keeps the panel open while selecting several options', () => {
    open();
    options()[0].click();
    fixture.detectChanges();
    options()[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(['ar', 'bw']);
    expect(document.querySelector('.tx-multi-select__panel')).not.toBeNull();
  });

  it('does not select an option merely by focusing it', () => {
    open();
    options()[0].focus();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([]);
  });

  it('collapses chips past maxVisibleChips into a summary', () => {
    fixture.componentInstance.value.set(['ar', 'bw', 'ci']);
    fixture.detectChanges();

    expect(chips().length).toBe(3); // two labels + one overflow chip
    expect(chips()[2].textContent).toContain('+1 more');
  });

  it('shows no overflow chip when the selection fits', () => {
    fixture.componentInstance.value.set(['ar', 'bw']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tx-chip--overflow')).toBeNull();
  });

  it('removes a single value from its chip', () => {
    fixture.componentInstance.value.set(['ar', 'bw']);
    fixture.detectChanges();

    const remove: HTMLElement = fixture.nativeElement.querySelector('.tx-chip__remove');
    remove.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(['bw']);
  });

  it('selects every enabled option, then clears them', () => {
    open();
    const toggleAll: HTMLButtonElement = document.querySelector('.tx-multi-select__all')!;

    toggleAll.click();
    fixture.detectChanges();
    // 'dc' is disabled and must be left out.
    expect(fixture.componentInstance.value()).toEqual(['ar', 'bw', 'ci']);

    toggleAll.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([]);
  });

  it('removes the last value on Backspace from the trigger', () => {
    fixture.componentInstance.value.set(['ar', 'bw']);
    fixture.detectChanges();

    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(['ar']);
  });
});
