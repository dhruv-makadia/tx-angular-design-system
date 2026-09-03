import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxTable } from './table';
import { TxSortState, TxTableColumn } from '../../utils/types';

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
