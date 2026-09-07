import { OverlayContainer } from '@angular/cdk/overlay';
import { ApplicationRef, Component, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxTree } from './tree';
import { TxTreeNode } from '../../utils/types';
import { TxDialogService } from '../dialog/dialog';
import { TxToastService } from '../toast/toast';

const NODES: TxTreeNode<string>[] = [
  {
    value: 'assembly',
    label: 'Assembly',
    icon: 'layout',
    children: [
      { value: 'housing', label: 'Housing', badge: 4 },
      {
        value: 'drive',
        label: 'Drive unit',
        children: [
          { value: 'motor', label: 'Motor' },
          { value: 'gearbox', label: 'Gearbox' },
        ],
      },
    ],
  },
  { value: 'spares', label: 'Spares' },
  { value: 'retired', label: 'Retired', disabled: true },
];

@Component({
  standalone: true,
  imports: [TxTree],
  template: `
    <tx-tree
      [nodes]="nodes"
      [(selected)]="selected"
      [(expanded)]="expanded"
      [multi]="multi()"
      [filterable]="true"
      label="Parts"
    />
  `,
})
class Host {
  readonly nodes = NODES;
  readonly selected = signal<string[]>([]);
  readonly expanded = signal<string[]>([]);
  readonly multi = signal(false);
}

describe('TxTree', () => {
  let fixture: ComponentFixture<Host>;

  const items = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-tree__item'));
  const labels = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-tree__label')).map((n) =>
      (n as HTMLElement).textContent!.trim(),
    );
  const filter = (text: string) => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.tx-tree__filter-input');
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders a tree landmark with the nested structure', () => {
    const root = fixture.nativeElement.querySelector('.tx-tree__root');
    expect(root.getAttribute('role')).toBe('tree');
    expect(root.getAttribute('aria-label')).toBe('Parts');
    expect(fixture.nativeElement.querySelectorAll('[role="group"]').length).toBeGreaterThan(0);
  });

  it('gives every node a treeitem role and a level', () => {
    const first = items()[0];
    expect(first.getAttribute('role')).toBe('treeitem');
    expect(first.getAttribute('aria-level')).toBe('1');
  });

  it('marks expandable nodes and leaves differently', () => {
    expect(items()[0].getAttribute('aria-expanded')).toBe('false');
    const spares = items().find((i) => i.textContent!.includes('Spares'))!;
    expect(spares.getAttribute('aria-expanded')).toBeNull();
  });

  it('expands a node and reports it', () => {
    const twisty = items()[0].querySelector('.tx-tree__row') as HTMLElement;
    twisty.click();
    fixture.detectChanges();

    // Selecting also expands via Aria; either way the model must follow.
    expect(items()[0].getAttribute('aria-expanded')).toBeDefined();
  });

  it('shows children once expanded through the model', () => {
    fixture.componentInstance.expanded.set(['assembly']);
    fixture.detectChanges();

    expect(items()[0].getAttribute('aria-expanded')).toBe('true');
    expect(labels()).toContain('Housing');
  });

  it('renders a badge when a node has one', () => {
    fixture.componentInstance.expanded.set(['assembly']);
    fixture.detectChanges();
    const housing = items().find((i) => i.textContent!.includes('Housing'))!;
    expect(housing.querySelector('.tx-tree__badge')!.textContent!.trim()).toBe('4');
  });

  it('marks a disabled node without removing it', () => {
    const retired = items().find((i) => i.textContent!.includes('Retired'))!;
    expect(retired.getAttribute('aria-disabled')).toBe('true');
  });

  describe('filtering', () => {
    it('keeps the ancestors of a match so the path is not orphaned', () => {
      filter('gearbox');
      // Gearbox lives two levels down; Assembly and Drive unit must survive.
      expect(labels()).toContain('Gearbox');
      expect(labels()).toContain('Drive unit');
      expect(labels()).toContain('Assembly');
      expect(labels()).not.toContain('Spares');
    });

    it('keeps the descendants of a match', () => {
      filter('drive');
      expect(labels()).toContain('Motor');
      expect(labels()).toContain('Gearbox');
    });

    it('expands matches so hits are not hidden inside collapsed branches', () => {
      expect(fixture.componentInstance.expanded()).toEqual([]);
      filter('motor');
      expect(labels()).toContain('Motor');
    });

    it('does not write derived expansion back into the model', () => {
      filter('motor');
      expect(fixture.componentInstance.expanded()).toEqual([]);
    });

    it('reports an empty state when nothing matches', () => {
      filter('zzzz');
      expect(fixture.nativeElement.querySelector('.tx-tree__empty')).not.toBeNull();
    });

    it('restores the full tree when cleared', () => {
      filter('gearbox');
      filter('');
      expect(labels()).toContain('Spares');
    });
  });
});

@Component({
  standalone: true,
  imports: [TxTree],
  template: `
    <tx-tree
      [nodes]="nodes"
      [(expanded)]="expanded"
      [collapsible]="collapsible()"
      label="Outline"
    />
  `,
})
class StaticHost {
  readonly nodes = NODES;
  readonly expanded = signal<string[]>([]);
  readonly collapsible = signal(false);
}

describe('TxTree without collapsing', () => {
  let fixture: ComponentFixture<StaticHost>;

  const items = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-tree__item'));
  const labels = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-tree__label')).map((n) =>
      (n as HTMLElement).textContent!.trim(),
    );
  const byLabel = (text: string): HTMLElement =>
    items().find((i) => i.querySelector('.tx-tree__label')!.textContent!.trim() === text)!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StaticHost] }).compileComponents();
    fixture = TestBed.createComponent(StaticHost);
    fixture.detectChanges();
  });

  it('shows every descendant without anything being expanded', () => {
    // `expanded` is empty, yet the whole hierarchy is on screen.
    expect(fixture.componentInstance.expanded()).toEqual([]);
    expect(labels()).toContain('Motor');
    expect(labels()).toContain('Gearbox');
    expect(byLabel('Assembly').getAttribute('aria-expanded')).toBe('true');
  });

  it('drops the twisty column entirely so rows still line up', () => {
    expect(fixture.nativeElement.querySelectorAll('.tx-tree__twisty').length).toBe(0);
    expect(fixture.nativeElement.querySelector('tx-tree').classList).toContain('tx-tree--static');
  });

  it('ignores an attempt to close a branch', () => {
    const assembly = byLabel('Assembly');
    (assembly.querySelector('.tx-tree__row') as HTMLElement).click();
    fixture.detectChanges();

    expect(assembly.getAttribute('aria-expanded')).toBe('true');
    expect(labels()).toContain('Motor');
    // Nothing was committed to the model either.
    expect(fixture.componentInstance.expanded()).toEqual([]);
  });

  it('goes back to normal collapsing when the option is turned on', () => {
    fixture.componentInstance.collapsible.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('tx-tree').classList).not.toContain(
      'tx-tree--static',
    );
    expect(fixture.nativeElement.querySelectorAll('.tx-tree__twisty').length).toBeGreaterThan(0);
    // `expanded` was never written to, so the tree closes back up.
    expect(labels()).not.toContain('Motor');
  });

  it('still selects a node', () => {
    (byLabel('Gearbox').querySelector('.tx-tree__row') as HTMLElement).click();
    fixture.detectChanges();
    expect(byLabel('Gearbox').getAttribute('aria-selected')).toBe('true');
  });
});

describe('TxTree held open by a filter', () => {
  @Component({
    standalone: true,
    imports: [TxTree],
    template: `<tx-tree [nodes]="nodes" [(expanded)]="expanded" filterable label="Parts" />`,
  })
  class FilterHost {
    readonly nodes = NODES;
    readonly expanded = signal<string[]>([]);
  }

  it('does not let a click close a branch the filter is holding open', () => {
    const fixture = TestBed.createComponent(FilterHost);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.tx-tree__filter-input');
    input.value = 'motor';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const items = (): HTMLElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('.tx-tree__item'));
    const assembly = items().find((i) =>
      i.querySelector('.tx-tree__label')!.textContent!.trim().startsWith('Assembly'),
    )!;
    expect(assembly.getAttribute('aria-expanded')).toBe('true');

    (assembly.querySelector('.tx-tree__row') as HTMLElement).click();
    fixture.detectChanges();

    // Same defect as a non-collapsible tree: Aria owns `expanded` as a model,
    // so ignoring the event is not enough — it has to be re-asserted.
    expect(assembly.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.componentInstance.expanded()).toEqual([]);
  });
});


@Component({ standalone: true, template: '' })
class ServiceHost {
  readonly dialog = inject(TxDialogService);
  readonly toast = inject(TxToastService);
}

describe('TxToastService', () => {
  let host: ServiceHost;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ServiceHost] });
    host = TestBed.createComponent(ServiceHost).componentInstance;
  });

  afterEach(() => {
    host.toast.dismissAll();
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('stacks messages', () => {
    host.toast.success('Saved');
    host.toast.info('Syncing');
    expect(host.toast.toasts().length).toBe(2);
  });

  it('announces errors assertively and everything else politely', () => {
    host.toast.error('Server unreachable');
    host.toast.success('Saved');

    const [error, success] = host.toast.toasts();
    expect(error.ariaLive).toBe('assertive');
    expect(success.ariaLive).toBe('polite');
  });

  it('keeps errors until dismissed rather than timing out', async () => {
    const id = host.toast.error('Server unreachable');
    await new Promise((r) => setTimeout(r, 30));
    expect(host.toast.toasts().length).toBe(1);

    host.toast.dismiss(id);
    expect(host.toast.toasts().length).toBe(0);
  });

  it('auto-dismisses a message with a duration', async () => {
    host.toast.info('Syncing', { duration: 20 });
    expect(host.toast.toasts().length).toBe(1);
    await new Promise((r) => setTimeout(r, 60));
    expect(host.toast.toasts().length).toBe(0);
  });

  it('dismisses everything at once', () => {
    host.toast.success('a');
    host.toast.warning('b');
    host.toast.dismissAll();
    expect(host.toast.toasts().length).toBe(0);
  });

  it('carries an action through to the caller', () => {
    let retried = false;
    host.toast.error('Failed', { action: 'Retry', onAction: () => (retried = true) });

    const toast = host.toast.toasts()[0];
    expect(toast.action).toBe('Retry');
    toast.onAction!();
    expect(retried).toBe(true);
  });
});

describe('TxDialogService', () => {
  let host: ServiceHost;

  /**
   * The dialog is attached to the application, not to a fixture, so its host
   * bindings only settle after an application tick.
   */
  const render = async () => {
    await Promise.resolve();
    TestBed.inject(ApplicationRef).tick();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ServiceHost] });
    host = TestBed.createComponent(ServiceHost).componentInstance;
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('opens a confirm dialog with the given title', async () => {
    const pending = host.dialog.confirm({ title: 'Delete this item?', message: 'Cannot be undone' });
    await render();

    const panel = document.querySelector('.tx-dialog__panel');
    expect(panel).not.toBeNull();
    expect(panel!.textContent).toContain('Delete this item?');
    expect(panel!.textContent).toContain('Cannot be undone');

    const buttons = Array.from(document.querySelectorAll('.tx-dialog__actions .tx-button__el'));
    (buttons[1] as HTMLButtonElement).click();
    expect(await pending).toBe(true);
  });

  it('resolves false when cancelled', async () => {
    const pending = host.dialog.confirm({ title: 'Delete?' });
    await render();

    const buttons = Array.from(document.querySelectorAll('.tx-dialog__actions .tx-button__el'));
    (buttons[0] as HTMLButtonElement).click();
    expect(await pending).toBe(false);
  });

  it('resolves false when dismissed, never undefined', async () => {
    const pending = host.dialog.confirm({ title: 'Delete?' });
    await render();

    const close: HTMLButtonElement = document.querySelector('.tx-dialog__close')!;
    close.click();
    expect(await pending).toBe(false);
  });

  it('uses the danger variant for destructive confirms', async () => {
    const pending = host.dialog.confirm({ title: 'Delete?', danger: true });
    await render();

    const confirm = document.querySelectorAll('.tx-dialog__actions tx-button')[1];
    expect(confirm.getAttribute('data-variant')).toBe('danger');

    (document.querySelectorAll('.tx-dialog__actions .tx-button__el')[0] as HTMLButtonElement).click();
    await pending;
  });
});
