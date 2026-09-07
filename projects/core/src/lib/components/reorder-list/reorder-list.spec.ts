import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxReorderList } from './reorder-list';
import { TxItemAction, TxReorderActionEvent } from '../../utils/types';

interface Entry {
  id: string;
  name: string;
  retired: boolean;
}

const ENTRIES: Entry[] = [
  { id: 'a', name: 'Return to stock', retired: false },
  { id: 'b', name: 'Rework', retired: false },
  { id: 'c', name: 'Scrap', retired: true },
];

const ACTIONS: TxItemAction<Entry>[] = [
  { id: 'edit', label: 'Edit', icon: 'edit', ariaLabel: (item) => `Edit ${item.name}` },
  { id: 'retire', label: 'Retire', icon: 'close', variant: 'danger', hidden: (i) => i.retired },
  { id: 'reinstate', label: 'Reinstate', icon: 'check', hidden: (i) => !i.retired },
];

@Component({
  standalone: true,
  imports: [TxReorderList],
  template: `
    <tx-reorder-list
      [items]="items()"
      [labelOf]="labelOf"
      [actions]="actions()"
      [disabled]="disabled()"
      label="Test list"
      (actionSelect)="last = $event"
    />
  `,
})
class Host {
  readonly items = signal<readonly Entry[]>(ENTRIES);
  readonly disabled = signal(false);
  readonly actions = signal<readonly TxItemAction<Entry>[]>(ACTIONS);
  labelOf = (item: Entry) => item.name;
  last: TxReorderActionEvent<Entry> | null = null;
}

describe('TxReorderList actions', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const actionButtons = (): HTMLButtonElement[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.tx-reorder-list__actions button'),
    ) as HTMLButtonElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders only the actions that apply to each item', () => {
    // Two visible per row: edit, plus whichever of retire/reinstate fits.
    expect(actionButtons()).toHaveLength(ENTRIES.length * 2);
  });

  it('reports which action was chosen and on which item', () => {
    actionButtons()[0].click();

    expect(host.last?.actionId).toBe('edit');
    expect(host.last?.item).toEqual(ENTRIES[0]);
  });

  it('names the item on the button so buttons stay distinguishable out of context', () => {
    expect(actionButtons()[0].getAttribute('aria-label')).toBe('Edit Return to stock');
  });

  it('disables the actions when the whole list is disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(actionButtons().every((button) => button.disabled)).toBe(true);
  });

  it('renders no action group when none are given', () => {
    host.actions.set([]);
    fixture.detectChanges();

    expect(actionButtons()).toHaveLength(0);
  });
});
