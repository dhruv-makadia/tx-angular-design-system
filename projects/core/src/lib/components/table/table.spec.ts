import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxTable } from './table';
import {
  TxSortState,
  TxTableAction,
  TxTableActionEvent,
  TxTableColumn,
} from '../../utils/types';

interface Row {
  id: string;
  name: string;
  qty: number;
}

const ROWS: Row[] = [
  { id: 'C-3', name: 'Gamma', qty: 30 },
  { id: 'A-1', name: 'alpha', qty: 200 },
  { id: 'B-2', name: 'Beta', qty: 5 },
];

const COLUMNS: TxTableColumn<Row>[] = [
  { key: 'id', header: 'Id', sortable: true, variant: 'data' },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'qty', header: 'Qty', sortable: true, variant: 'numeric', align: 'end' },
  { key: 'hiddenCol', header: 'Hidden', hidden: true },
];

@Component({
  standalone: true,
  imports: [TxTable],
  template: `
    <tx-table
      [data]="data()"
      [columns]="columns"
      [paginated]="paginated()"
      [pageSizeOptions]="[2, 10]"
      [page]="{ pageIndex: 0, pageSize: 2 }"
      label="Test table"
      (sortChange)="lastSort = $event"
    />
  `,
})
class Host {
  readonly data = signal<Row[]>([...ROWS]);
  readonly paginated = signal(false);
  readonly columns = COLUMNS;
  lastSort: TxSortState | null = null;
}

describe('TxTable', () => {
  let fixture: ComponentFixture<Host>;

  const headerButtons = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-table__sort')) as HTMLButtonElement[];
  const bodyRows = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-table__row')) as HTMLElement[];
  const cellText = (row: HTMLElement) =>
    Array.from(row.querySelectorAll('td')).map((c) => c.textContent!.trim());
  const headerCells = () =>
    Array.from(fixture.nativeElement.querySelectorAll('th')) as HTMLElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders a row per record and skips hidden columns', () => {
    expect(bodyRows().length).toBe(3);
    expect(headerCells().length).toBe(3);
    expect(headerCells().map((h) => h.textContent!.trim())).toEqual(['Id', 'Name', 'Qty']);
  });

  it('leaves data in source order until a column is sorted', () => {
    expect(bodyRows().map((r) => cellText(r)[0])).toEqual(['C-3', 'A-1', 'B-2']);
  });

  it('cycles a column ascending, descending, then back to unsorted', () => {
    const idHeader = headerButtons()[0];

    idHeader.click();
    fixture.detectChanges();
    expect(bodyRows().map((r) => cellText(r)[0])).toEqual(['A-1', 'B-2', 'C-3']);
    expect(fixture.componentInstance.lastSort).toEqual({ column: 'id', direction: 'asc' });

    idHeader.click();
    fixture.detectChanges();
    expect(bodyRows().map((r) => cellText(r)[0])).toEqual(['C-3', 'B-2', 'A-1']);

    idHeader.click();
    fixture.detectChanges();
    // Back to the original array order, not a reversed sort.
    expect(bodyRows().map((r) => cellText(r)[0])).toEqual(['C-3', 'A-1', 'B-2']);
    expect(fixture.componentInstance.lastSort).toEqual({ column: null, direction: null });
  });

  it('sorts numbers numerically rather than lexically', () => {
    headerButtons()[2].click();
    fixture.detectChanges();
    expect(bodyRows().map((r) => cellText(r)[2])).toEqual(['5', '30', '200']);
  });

  it('sorts text case-insensitively', () => {
    headerButtons()[1].click();
    fixture.detectChanges();
    expect(bodyRows().map((r) => cellText(r)[1])).toEqual(['alpha', 'Beta', 'Gamma']);
  });

  it('never mutates the array it was given', () => {
    const original = [...fixture.componentInstance.data()];
    headerButtons()[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual(original);
  });

  it('exposes sort state through aria-sort', () => {
    expect(headerCells().map((h) => h.getAttribute('aria-sort'))).toEqual(['none', 'none', 'none']);

    headerButtons()[0].click();
    fixture.detectChanges();
    expect(headerCells()[0].getAttribute('aria-sort')).toBe('ascending');

    headerButtons()[0].click();
    fixture.detectChanges();
    expect(headerCells()[0].getAttribute('aria-sort')).toBe('descending');
  });

  it('slices to the page size when paginated', () => {
    fixture.componentInstance.paginated.set(true);
    fixture.detectChanges();
    expect(bodyRows().length).toBe(2);
  });

  it('shows the empty state when there are no rows', () => {
    fixture.componentInstance.data.set([]);
    fixture.detectChanges();
    expect(bodyRows().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.tx-table__state').textContent).toContain(
      'Nothing to show',
    );
  });
});

@Component({
  standalone: true,
  imports: [TxTable],
  template: `
    <tx-table
      [data]="data()"
      [columns]="columns"
      [actions]="actions()"
      [actionsHeader]="actionsHeader()"
      [actionsSticky]="sticky()"
      label="Actions table"
      (actionSelect)="chosen.push($event)"
      (rowClick)="rowClicks = rowClicks + 1"
    />
  `,
})
class ActionHost {
  readonly data = signal<Row[]>([...ROWS]);
  readonly columns = COLUMNS;
  readonly actionsHeader = signal('Actions');
  readonly sticky = signal(false);
  readonly actions = signal<TxTableAction<Row>[]>([
    { id: 'edit', label: 'Edit', icon: 'edit', ariaLabel: (r) => `Edit ${r.id}` },
    { id: 'delete', label: 'Delete', variant: 'danger', disabled: (r) => r.qty > 100 },
  ]);
  readonly chosen: TxTableActionEvent<Row>[] = [];
  rowClicks = 0;
}

describe('TxTable row actions', () => {
  let fixture: ComponentFixture<ActionHost>;

  const actionCells = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-table__td--actions')) as HTMLElement[];
  const actionsIn = (rowIndex: number) =>
    Array.from(actionCells()[rowIndex].querySelectorAll('.tx-table__action')) as HTMLButtonElement[];
  const headerCells = () =>
    Array.from(fixture.nativeElement.querySelectorAll('th')) as HTMLElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActionHost] }).compileComponents();
    fixture = TestBed.createComponent(ActionHost);
    fixture.detectChanges();
  });

  it('adds one trailing column, whatever the number of actions', () => {
    // Three visible data columns plus the action column; `hiddenCol` stays out.
    expect(headerCells().length).toBe(4);
    expect(headerCells()[3].textContent!.trim()).toBe('Actions');
    expect(actionCells().length).toBe(ROWS.length);
  });

  it('renders no column at all when there are no actions', () => {
    fixture.componentInstance.actions.set([]);
    fixture.detectChanges();

    expect(headerCells().length).toBe(3);
    expect(actionCells().length).toBe(0);
  });

  it('spans the action column in the empty state', () => {
    fixture.componentInstance.data.set([]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.tx-table__state').getAttribute('colspan'),
    ).toBe('4');
  });

  it('keeps a name for the column when the header is blank', () => {
    fixture.componentInstance.actionsHeader.set('');
    fixture.detectChanges();

    const header = headerCells()[3];
    expect(header.textContent!.trim()).toBe('Actions');
    expect(header.querySelector('.tx-table__hidden-header')).not.toBeNull();
  });

  it('reports which action was chosen and on which row', () => {
    actionsIn(0)[0].click();
    fixture.detectChanges();

    const [event] = fixture.componentInstance.chosen;
    expect(event.actionId).toBe('edit');
    expect(event.row).toBe(fixture.componentInstance.data()[0]);
    expect(event.action.label).toBe('Edit');
  });

  it('does not select the row when an action is chosen', () => {
    actionsIn(0)[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.chosen.length).toBe(1);
    expect(fixture.componentInstance.rowClicks).toBe(0);
  });

  it('still selects the row when the click is not on an action', () => {
    (fixture.nativeElement.querySelector('.tx-table__row') as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.rowClicks).toBe(1);
    expect(fixture.componentInstance.chosen.length).toBe(0);
  });

  it('disables an action per row without removing it', () => {
    // ROWS[1] is the only row over the qty threshold.
    expect(actionsIn(0)[1].disabled).toBe(false);
    expect(actionsIn(1)[1].disabled).toBe(true);
    // Disabled, not absent: the column does not reflow between rows.
    expect(actionsIn(1).length).toBe(2);
  });

  it('removes a hidden action from the rows it does not apply to', () => {
    fixture.componentInstance.actions.set([
      { id: 'edit', label: 'Edit' },
      { id: 'restock', label: 'Restock', hidden: (r) => r.qty > 100 },
    ]);
    fixture.detectChanges();

    expect(actionsIn(0).length).toBe(2);
    expect(actionsIn(1).length).toBe(1);
    expect(actionsIn(1)[0].textContent!.trim()).toBe('Edit');
  });

  it('gives an icon-only action a row-specific accessible name', () => {
    const edit = actionsIn(0)[0];
    expect(edit.querySelector('tx-icon')).not.toBeNull();
    expect(edit.getAttribute('aria-label')).toBe('Edit C-3');

    // A text action reads as its own label, so it needs no aria-label.
    expect(actionsIn(0)[1].getAttribute('aria-label')).toBeNull();
    expect(actionsIn(0)[1].textContent!.trim()).toBe('Delete');
  });

  it('lets a text action override its name per row without hiding its text', () => {
    fixture.componentInstance.actions.set([
      { id: 'delete', label: 'Delete', ariaLabel: (r) => `Delete ${r.id}` },
    ]);
    fixture.detectChanges();

    const button = actionsIn(0)[0];
    expect(button.textContent!.trim()).toBe('Delete');
    expect(button.getAttribute('aria-label')).toBe('Delete C-3');
    // A tooltip repeating visible text is noise; only icon-only actions get one.
    expect(button.getAttribute('title')).toBeNull();
  });

  it('marks a destructive action so it can read as one', () => {
    expect(actionsIn(0)[1].classList).toContain('tx-table__action--danger');
    expect(actionsIn(0)[0].classList).not.toContain('tx-table__action--danger');
  });

  it('pins the column only when asked', () => {
    expect(actionCells()[0].classList).not.toContain('tx-table__cell--pinned');

    fixture.componentInstance.sticky.set(true);
    fixture.detectChanges();

    expect(actionCells()[0].classList).toContain('tx-table__cell--pinned');
    expect(headerCells()[3].classList).toContain('tx-table__cell--pinned');
  });
});
