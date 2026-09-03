import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TxCheckbox } from './checkbox';
import { TxToggle } from '../toggle/toggle';

@Component({
  standalone: true,
  imports: [TxCheckbox],
  template: `
    <tx-checkbox [(checked)]="checked" [(indeterminate)]="indeterminate" label="Accept" />
  `,
})
class CheckboxHost {
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
}

@Component({
  standalone: true,
  imports: [TxCheckbox, ReactiveFormsModule],
  template: `<tx-checkbox [formControl]="control" label="Accept" />`,
})
class FormHost {
  readonly control = new FormControl(false);
}

describe('TxCheckbox', () => {
  let fixture: ComponentFixture<CheckboxHost>;
  const native = (): HTMLInputElement => fixture.nativeElement.querySelector('.tx-checkbox__native');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CheckboxHost] }).compileComponents();
    fixture = TestBed.createComponent(CheckboxHost);
    fixture.detectChanges();
  });

  it('uses a native checkbox so platform behaviour is preserved', () => {
    expect(native().type).toBe('checkbox');
    expect(native().labels?.length).toBe(1);
  });

  it('toggles on change', () => {
    native().click();
    fixture.detectChanges();
    expect(fixture.componentInstance.checked()).toBe(true);
  });

  it('exposes the mixed state through aria-checked', () => {
    fixture.componentInstance.indeterminate.set(true);
    fixture.detectChanges();
    expect(native().getAttribute('aria-checked')).toBe('mixed');
  });

  it('clears indeterminate once the user commits a choice', () => {
    fixture.componentInstance.indeterminate.set(true);
    fixture.detectChanges();

    native().click();
    fixture.detectChanges();

    expect(fixture.componentInstance.indeterminate()).toBe(false);
    expect(native().getAttribute('aria-checked')).toBe('true');
  });
});

describe('TxCheckbox with reactive forms', () => {
  let fixture: ComponentFixture<FormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
  });

  it('writes and reads through the control', () => {
    const native: HTMLInputElement = fixture.nativeElement.querySelector('.tx-checkbox__native');

    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();
    expect(native.checked).toBe(true);

    native.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(false);
  });

  it('disables the native input when the control is disabled', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    const native: HTMLInputElement = fixture.nativeElement.querySelector('.tx-checkbox__native');
    expect(native.disabled).toBe(true);
  });
});

@Component({
  standalone: true,
  imports: [TxToggle],
  template: `<tx-toggle [(checked)]="on" label="Notifications" />`,
})
class ToggleHost {
  readonly on = signal(false);
}

describe('TxToggle', () => {
  let fixture: ComponentFixture<ToggleHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToggleHost] }).compileComponents();
    fixture = TestBed.createComponent(ToggleHost);
    fixture.detectChanges();
  });

  it('announces itself as a switch, not a checkbox', () => {
    const native: HTMLInputElement = fixture.nativeElement.querySelector('.tx-toggle__native');
    expect(native.getAttribute('role')).toBe('switch');
  });

  it('toggles', () => {
    const native: HTMLInputElement = fixture.nativeElement.querySelector('.tx-toggle__native');
    native.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.on()).toBe(true);
  });
});
