import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxPaginator } from './paginator';
import { TxPageState } from '../../utils/types';

@Component({
  standalone: true,
  imports: [TxPaginator],
  template: `
    <tx-paginator [length]="length()" [pageSizeOptions]="[10, 25, 50]" [(page)]="page" />
  `,
})
class Host {
  readonly length = signal(95);
  readonly page = signal<TxPageState>({ pageIndex: 0, pageSize: 10 });
}

describe('TxPaginator', () => {
  let fixture: ComponentFixture<Host>;

  const buttons = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-paginator__btn'));
  const [first, prev, next, last] = [0, 1, 2, 3];
  const range = (): string =>
    fixture.nativeElement.querySelector('.tx-paginator__range').textContent.trim();
  const pageField = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.tx-paginator__page-input');
  const total = (): string =>
    fixture.nativeElement.querySelector('.tx-paginator__total').textContent.trim();

  const typePage = (text: string) => {
    pageField().value = text;
    pageField().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const key = (name: string) => {
    pageField().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
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

  it('reports the visible range and page count', () => {
    expect(range()).toBe('1 – 10 of 95');
    expect(pageField().value).toBe('1');
    expect(total()).toBe('10');
  });

  it('disables backward controls on the first page', () => {
    expect(buttons()[first].disabled).toBe(true);
    expect(buttons()[prev].disabled).toBe(true);
    expect(buttons()[next].disabled).toBe(false);
  });

  it('advances a page', () => {
    buttons()[next].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.page().pageIndex).toBe(1);
    expect(range()).toBe('11 – 20 of 95');
  });

  it('clamps the final page to the remainder', () => {
    buttons()[last].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.page().pageIndex).toBe(9);
    expect(range()).toBe('91 – 95 of 95');
    expect(buttons()[next].disabled).toBe(true);
  });

  describe('page number entry', () => {
    it('jumps to a typed page on Enter', () => {
      typePage('7');
      key('Enter');
      expect(fixture.componentInstance.page().pageIndex).toBe(6);
      expect(range()).toBe('61 – 70 of 95');
    });

    it('jumps on blur as well', () => {
      typePage('4');
      pageField().dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(fixture.componentInstance.page().pageIndex).toBe(3);
    });

    it('clamps a page beyond the end rather than showing an empty table', () => {
      typePage('999');
      key('Enter');
      expect(fixture.componentInstance.page().pageIndex).toBe(9);
      expect(pageField().value).toBe('10');
    });

    it('clamps zero and negative entries to the first page', () => {
      buttons()[next].click();
      fixture.detectChanges();

      typePage('0');
      key('Enter');
      expect(fixture.componentInstance.page().pageIndex).toBe(0);
    });

    it('ignores non-numeric characters instead of producing NaN', () => {
      typePage('1a2b');
      expect(pageField().value).toBe('12');
      key('Enter');
      expect(fixture.componentInstance.page().pageIndex).toBe(9); // clamped from 12
    });

    it('abandons the edit on Escape', () => {
      typePage('8');
      key('Escape');
      expect(fixture.componentInstance.page().pageIndex).toBe(0);
      expect(pageField().value).toBe('1');
    });

    it('steps a page with the arrow keys', () => {
      key('ArrowUp');
      expect(fixture.componentInstance.page().pageIndex).toBe(1);
      key('ArrowDown');
      expect(fixture.componentInstance.page().pageIndex).toBe(0);
    });

    it('snaps back to the live page when the field is emptied', () => {
      typePage('');
      pageField().dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(pageField().value).toBe('1');
    });
  });

  describe('page size', () => {
    it('uses the design system select, not a native one', () => {
      expect(fixture.nativeElement.querySelector('select')).toBeNull();
      expect(fixture.nativeElement.querySelector('tx-select')).not.toBeNull();
    });

    it('names the control for assistive technology', () => {
      const trigger: HTMLButtonElement =
        fixture.nativeElement.querySelector('tx-select .tx-select__trigger');
      expect(trigger.getAttribute('aria-label')).toBe('Rows per page');
    });

    it('keeps the first visible row on screen when the size changes', () => {
      buttons()[next].click();
      buttons()[next].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.page().pageIndex).toBe(2); // rows 21–30

      const trigger: HTMLButtonElement =
        fixture.nativeElement.querySelector('tx-select .tx-select__trigger');
      trigger.click();
      fixture.detectChanges();

      const options = Array.from(
        document.querySelectorAll('.tx-select__option'),
      ) as HTMLElement[];
      options[1].click(); // 25
      fixture.detectChanges();

      // Row 21 must still be visible: page 0 of size 25 covers rows 1–25.
      expect(fixture.componentInstance.page()).toEqual({ pageIndex: 0, pageSize: 25 });
    });
  });

  it('handles an empty result set without dividing by zero', () => {
    fixture.componentInstance.length.set(0);
    fixture.detectChanges();
    expect(range()).toBe('0 – 0 of 0');
    expect(total()).toBe('1');
  });
});
