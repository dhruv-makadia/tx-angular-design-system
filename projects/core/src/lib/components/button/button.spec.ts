import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxButton } from './button';

@Component({
  standalone: true,
  imports: [TxButton],
  template: `
    <tx-button
      [variant]="variant()"
      [size]="size()"
      [disabled]="disabled()"
      [loading]="loading()"
      (activated)="clicks = clicks + 1"
    >
      Save
    </tx-button>
  `,
})
class Host {
  readonly variant = signal<'filled' | 'outlined' | 'text'>('filled');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly disabled = signal(false);
  readonly loading = signal(false);
  clicks = 0;
}

describe('TxButton', () => {
  let fixture: ComponentFixture<Host>;
  const el = (): HTMLButtonElement => fixture.nativeElement.querySelector('.tx-button__el');
  const host = (): HTMLElement => fixture.nativeElement.querySelector('tx-button');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders a real button element with the projected label', () => {
    expect(el().tagName).toBe('BUTTON');
    expect(el().textContent!.trim()).toBe('Save');
    expect(el().type).toBe('button');
  });

  it('emits on activation', () => {
    el().click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('reflects variant and size as data attributes for styling', () => {
    fixture.componentInstance.variant.set('outlined');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();

    expect(host().getAttribute('data-variant')).toBe('outlined');
    expect(host().getAttribute('data-size')).toBe('lg');
  });

  it('does not emit while disabled', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(el().disabled).toBe(true);
    el().click();
    expect(fixture.componentInstance.clicks).toBe(0);
  });

  it('disables itself and announces busy while loading', () => {
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    expect(el().disabled).toBe(true);
    expect(el().getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.tx-button__spinner')).not.toBeNull();

    el().click();
    expect(fixture.componentInstance.clicks).toBe(0);
  });
});
