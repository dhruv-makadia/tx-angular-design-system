import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxAccordion, TxAccordionPanel } from './accordion';
import { TxReorderList } from '../reorder-list/reorder-list';

@Component({
  standalone: true,
  imports: [TxAccordion, TxAccordionPanel],
  template: `
    <tx-accordion [multiExpandable]="multi()">
      <tx-accordion-panel label="Delivery" hint="Ships in 2 days" [(expanded)]="first">
        <p>Delivery body</p>
      </tx-accordion-panel>
      <tx-accordion-panel label="Returns">
        <p>Returns body</p>
      </tx-accordion-panel>
      <tx-accordion-panel label="Locked" [disabled]="true">
        <p>Locked body</p>
      </tx-accordion-panel>
    </tx-accordion>
  `,
})
class Host {
  readonly multi = signal(false);
  readonly first = signal(false);
}

describe('TxAccordion', () => {
  let fixture: ComponentFixture<Host>;

  const triggers = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-accordion-panel__trigger'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders each panel behind a heading-level trigger', () => {
    expect(triggers().length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('h3').length).toBe(3);
    expect(triggers()[0].textContent).toContain('Delivery');
    expect(triggers()[0].textContent).toContain('Ships in 2 days');
  });

  it('wires each trigger to its panel with aria-controls and aria-expanded', () => {
    const trigger = triggers()[0];
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    const controls = trigger.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`#${controls}`)).not.toBeNull();
  });

  it('expands on click and reports it through the model', () => {
    triggers()[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.first()).toBe(true);
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('closes again when the same header is clicked twice', () => {
    const trigger = triggers()[0];

    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.first()).toBe(false);
  });

  it('takes a closed panel out of interaction and the a11y tree', () => {
    const bodies = (): HTMLElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('.tx-accordion-panel__body'));

    // Aria marks collapsed panels inert; the stylesheet keys the visual
    // collapse off that same attribute, so this is what "closed" means.
    expect(bodies().every((b) => b.hasAttribute('inert'))).toBe(true);

    triggers()[0].click();
    fixture.detectChanges();

    expect(bodies()[0].hasAttribute('inert')).toBe(false);
    expect(bodies()[1].hasAttribute('inert')).toBe(true);

    triggers()[0].click();
    fixture.detectChanges();
    expect(bodies()[0].hasAttribute('inert')).toBe(true);
  });

  it('collapses the open panel when another opens, in single mode', () => {
    triggers()[0].click();
    fixture.detectChanges();
    triggers()[1].click();
    fixture.detectChanges();

    expect(triggers()[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers()[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps panels open together when multiExpandable', () => {
    fixture.componentInstance.multi.set(true);
    fixture.detectChanges();

    triggers()[0].click();
    fixture.detectChanges();
    triggers()[1].click();
    fixture.detectChanges();

    expect(triggers()[0].getAttribute('aria-expanded')).toBe('true');
    expect(triggers()[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('does not open a disabled panel, but keeps it reachable', () => {
    const locked = triggers()[2];

    // Soft-disabled, per the WAI-ARIA accordion pattern: focusable so it can be
    // discovered and read, but not activatable. A native `disabled` button
    // would drop out of the tab order entirely.
    expect(locked.getAttribute('aria-disabled')).toBe('true');
    expect(locked.getAttribute('tabindex')).toBe('0');

    locked.click();
    fixture.detectChanges();
    expect(locked.getAttribute('aria-expanded')).toBe('false');
  });
});

interface Column {
  id: string;
  name: string;
  locked?: boolean;
}

@Component({
  standalone: true,
  imports: [TxReorderList],
  template: `
    <tx-reorder-list
      [(items)]="columns"
      [labelOf]="labelOf"
      [lockedOf]="lockedOf"
      [trackBy]="trackById"
      (orderChange)="lastOrder = $event"
    />
  `,
})
class ReorderHost {
  readonly columns = signal<readonly Column[]>([
    { id: 'a', name: 'Reference' },
    { id: 'b', name: 'Name' },
    { id: 'c', name: 'Status', locked: true },
  ]);
  lastOrder: readonly Column[] | null = null;

  readonly labelOf = (c: Column) => c.name;
  readonly lockedOf = (c: Column) => !!c.locked;
  readonly trackById = (c: Column) => c.id;
}

describe('TxReorderList', () => {
  let fixture: ComponentFixture<ReorderHost>;

  const handles = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-reorder-list__handle'));
  const labels = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-reorder-list__label')).map((n) =>
      (n as HTMLElement).textContent!.trim(),
    );
  const press = (index: number, key: string) => {
    handles()[index].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReorderHost] }).compileComponents();
    fixture = TestBed.createComponent(ReorderHost);
    fixture.detectChanges();
  });

  it('renders a focusable handle per row', () => {
    expect(handles().length).toBe(3);
    expect(handles()[0].tagName).toBe('BUTTON');
    expect(labels()).toEqual(['Reference', 'Name', 'Status']);
  });

  it('names each handle with the item and its position', () => {
    expect(handles()[0].getAttribute('aria-label')).toBe('Reorder: Reference, 1 of 3');
  });

  it('moves an item down with the arrow keys', () => {
    press(0, 'ArrowDown');
    expect(labels()).toEqual(['Name', 'Reference', 'Status']);
    expect(fixture.componentInstance.lastOrder?.map((c) => c.id)).toEqual(['b', 'a', 'c']);
  });

  it('moves an item up', () => {
    press(1, 'ArrowUp');
    expect(labels()).toEqual(['Name', 'Reference', 'Status']);
  });

  it('jumps to the ends with Home and End', () => {
    press(0, 'End');
    expect(labels()).toEqual(['Name', 'Status', 'Reference']);

    press(2, 'Home');
    expect(labels()).toEqual(['Reference', 'Name', 'Status']);
  });

  it('does nothing at the boundaries', () => {
    press(0, 'ArrowUp');
    expect(labels()).toEqual(['Reference', 'Name', 'Status']);
    expect(fixture.componentInstance.lastOrder).toBeNull();
  });

  it('refuses to move a locked item', () => {
    expect(handles()[2].disabled).toBe(true);
    press(2, 'ArrowUp');
    expect(labels()).toEqual(['Reference', 'Name', 'Status']);
  });

  it('never mutates the array it was given', () => {
    const original = fixture.componentInstance.columns();
    const snapshot = [...original];
    press(0, 'ArrowDown');
    expect(original).toEqual(snapshot);
  });

  it('announces the move for assistive technology', () => {
    press(0, 'ArrowDown');
    const live = fixture.nativeElement.querySelector('.tx-reorder-list__live');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toContain('Reference moved to position 2 of 3');
  });
});
