import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxSpinner } from './spinner';

@Component({
  standalone: true,
  imports: [TxSpinner],
  template: `
    <tx-spinner
      [value]="value()"
      [label]="label()"
      [showLabel]="showLabel()"
      [size]="size()"
    />
  `,
})
class Host {
  readonly value = signal<number | null>(null);
  readonly label = signal('Loading results');
  readonly showLabel = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
}

describe('TxSpinner', () => {
  let fixture: ComponentFixture<Host>;

  const host = (): HTMLElement => fixture.nativeElement.querySelector('tx-spinner');
  const arc = (): SVGCircleElement => fixture.nativeElement.querySelector('.tx-spinner__arc');
  const circumference = 2 * Math.PI * 9;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('is a progressbar named by its label', () => {
    expect(host().getAttribute('role')).toBe('progressbar');
    expect(host().getAttribute('aria-label')).toBe('Loading results');
  });

  it('spells indeterminate as a progressbar with no value', () => {
    expect(host().getAttribute('aria-valuenow')).toBeNull();
    expect(host().getAttribute('aria-valuemin')).toBeNull();
    expect(host().getAttribute('aria-valuemax')).toBeNull();
    expect(host().classList).not.toContain('tx-spinner--determinate');
    // No track: a track only means something next to a value.
    expect(fixture.nativeElement.querySelector('.tx-spinner__track')).toBeNull();
  });

  it('reports the value and draws a track once it has one', () => {
    fixture.componentInstance.value.set(40);
    fixture.detectChanges();

    expect(host().classList).toContain('tx-spinner--determinate');
    expect(host().getAttribute('aria-valuenow')).toBe('40');
    expect(host().getAttribute('aria-valuemin')).toBe('0');
    expect(host().getAttribute('aria-valuemax')).toBe('100');
    expect(host().getAttribute('aria-valuetext')).toBe('40%');
    expect(fixture.nativeElement.querySelector('.tx-spinner__track')).not.toBeNull();
  });

  it('draws most of the ring while indeterminate, so it reads as one', () => {
    const offset = Number(arc().getAttribute('stroke-dashoffset'));
    // A quarter-turn arc reads as a stray tick at 16px; 70% reads as a spinner.
    expect(offset).toBeCloseTo(circumference * 0.3, 5);
  });

  it('draws the arc in proportion to the value', () => {
    fixture.componentInstance.value.set(25);
    fixture.detectChanges();

    const offset = Number(arc().getAttribute('stroke-dashoffset'));
    expect(offset).toBeCloseTo(circumference * 0.75, 5);

    fixture.componentInstance.value.set(100);
    fixture.detectChanges();
    expect(Number(arc().getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 5);
  });

  it('clamps a value outside 0-100 rather than drawing past the ring', () => {
    fixture.componentInstance.value.set(140);
    fixture.detectChanges();
    expect(host().getAttribute('aria-valuenow')).toBe('100');

    fixture.componentInstance.value.set(-20);
    fixture.detectChanges();
    expect(host().getAttribute('aria-valuenow')).toBe('0');
  });

  it('falls back to indeterminate for a value that is not a number', () => {
    fixture.componentInstance.value.set(Number.NaN);
    fixture.detectChanges();
    expect(host().getAttribute('aria-valuenow')).toBeNull();
  });

  it('drops aria-label when the label is on screen, so it is not read twice', () => {
    fixture.componentInstance.showLabel.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.tx-spinner__label').textContent.trim()).toBe(
      'Loading results',
    );
    expect(host().getAttribute('aria-label')).toBeNull();
  });

  it('marks its size on the host so CSS can pick the diameter', () => {
    expect(host().getAttribute('data-size')).toBe('md');

    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(host().getAttribute('data-size')).toBe('lg');
  });
});
