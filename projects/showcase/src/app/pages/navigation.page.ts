import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  TxButton,
  TxHeader,
  TxIcon,
  TxInput,
  TxNavSection,
  TxSidebar,
} from '@tx-angular-design-system/core';
import { ApiRow, DemoApi, DemoExample, DemoGuidance, DemoKeys, DemoPage } from '../shared/demo';

const DEMO_NAV: TxNavSection[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'info' },
      { id: 'items', label: 'Items', icon: 'menu', badge: 128 },
      { id: 'reports', label: 'Reports', icon: 'download', badge: 'new' },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: 'edit',
        children: [
          { id: 'general', label: 'General' },
          { id: 'members', label: 'Members', badge: 6 },
          { id: 'billing', label: 'Billing' },
        ],
      },
      { id: 'audit', label: 'Audit log', icon: 'filter', disabled: true },
    ],
  },
];

@Component({
  standalone: true,
  imports: [
    DemoPage,
    DemoExample,
    DemoApi,
    DemoKeys,
    DemoGuidance,
    TxSidebar,
    TxHeader,
    TxButton,
    TxIcon,
    TxInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      heading="Navigation"
      lede="A sidebar, a header and a shell that puts them together. All three are router-agnostic:
            they report what was chosen and render the state you give them."
    >
      <demo-example
        heading="Sidebar"
        note="Real links and buttons inside a nav landmark, so Tab order and open-in-new-tab behave normally. It is not a listbox."
        [code]="sidebarCode"
        column
      >
        <div class="controls">
          <tx-button variant="outlined" size="sm" (activated)="collapsed.set(!collapsed())">
            <tx-icon slot="leading" [name]="collapsed() ? 'chevron-right' : 'chevron-left'" size="sm" />
            {{ collapsed() ? 'Expand' : 'Collapse' }}
          </tx-button>
          <span class="state">active: <code>{{ active() ?? '(none)' }}</code></span>
        </div>

        <div class="frame">
          <tx-sidebar [sections]="nav" [(activeId)]="active" [(collapsed)]="collapsed" collapsible="always">
            <div slot="brand" class="brand">
              <span class="brand__mark" aria-hidden="true"></span>
              <span class="brand__name">Acme</span>
            </div>
          </tx-sidebar>
          <div class="frame__body">
            <p class="frame__hint">Content area</p>
            <p class="frame__value">{{ active() ?? 'nothing selected' }}</p>
          </div>
        </div>
      </demo-example>

      <demo-example
        heading="Header"
        note="Three regions — brand, a free middle, trailing actions. It holds no navigation state; the menu button just reports a press."
        [code]="headerCode"
        column
      >
        <div class="frame frame--header">
          <tx-header heading="Items" menu="always" [sticky]="false" (menuToggle)="toggles.set(toggles() + 1)">
            <span slot="brand" class="brand__name">Acme</span>
            <tx-input slot="middle" type="search" placeholder="Search items" [(value)]="query">
              <tx-icon slot="prefix" name="search" size="sm" />
            </tx-input>
            <div slot="actions">
              <tx-button variant="text" size="sm">Help</tx-button>
              <tx-button variant="filled" size="sm">New item</tx-button>
            </div>
          </tx-header>
        </div>
        <p class="state">menu pressed <code>{{ toggles() }}</code> times</p>
      </demo-example>

      <demo-example heading="Putting them together" [code]="shellCode" column>
        <p class="prose">
          <code>tx-app-shell</code> owns layout only: a sticky sidebar column beside a scrolling
          content column, with the header above the content. Below 48rem the sidebar becomes an
          overlay drawer — dismissible from the scrim or Escape — so the content keeps its width.
          The two navigation controls are mutually exclusive by design: the header's toggle appears
          only below that breakpoint, and the sidebar's collapse control only at or above it, so
          you never see a control that opens nothing. This page is built with it.
        </p>
      </demo-example>

      <demo-api heading="tx-sidebar" [rows]="sidebarApi" />
      <demo-api heading="tx-header" [rows]="headerApi" />
      <demo-api heading="tx-app-shell" [rows]="shellApi" />
      <demo-keys [rows]="keys" />
      <demo-guidance [dos]="dos" [donts]="donts" />
    </demo-page>
  `,
  styles: [
    `
      .controls {
        display: flex;
        align-items: center;
        gap: var(--tx-space-3);
        margin-block-end: var(--tx-space-3);
      }
      .frame {
        display: flex;
        width: 100%;
        height: 24rem;
        overflow: hidden;
        border: var(--tx-border-width) solid var(--tx-color-border);
        border-radius: var(--tx-radius-lg);
        background-color: var(--tx-color-surface-raised);
      }
      .frame--header {
        display: block;
        height: auto;
      }
      .frame__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--tx-space-1);
        background-color: var(--tx-color-canvas);
      }
      .frame__hint {
        margin: 0;
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-2xs);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        color: var(--tx-color-on-surface-subtle);
      }
      .frame__value {
        margin: 0;
        font-family: var(--tx-font-display);
        font-size: var(--tx-text-xl);
        font-weight: var(--tx-weight-semibold);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--tx-space-2);
      }
      .brand__mark {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: var(--tx-radius-sm);
        background-color: var(--tx-color-accent);
      }
      .brand__name {
        font-family: var(--tx-font-mono);
        font-size: var(--tx-text-xs);
        font-weight: var(--tx-weight-semibold);
        letter-spacing: var(--tx-tracking-label);
        text-transform: uppercase;
        white-space: nowrap;
      }
      .state,
      .prose {
        margin: 0;
        font-size: var(--tx-text-sm);
        color: var(--tx-color-on-surface-muted);
      }
      .prose {
        max-width: 62ch;
      }
      code {
        font-family: var(--tx-font-mono);
        font-size: 0.92em;
        color: var(--tx-color-on-surface);
      }
    `,
  ],
})
export class NavigationPage {
  protected readonly nav = DEMO_NAV;
  protected readonly active = signal<string | null>('items');
  protected readonly collapsed = signal(false);
  protected readonly toggles = signal(0);
  protected readonly query = signal('');

  protected readonly sidebarCode = `nav: TxNavSection[] = [
  { label: 'Workspace', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'info' },
    { id: 'items', label: 'Items', icon: 'menu', badge: 128 },
  ]},
  { label: 'Admin', items: [
    { id: 'settings', label: 'Settings', icon: 'edit', children: [
      { id: 'general', label: 'General' },
      { id: 'members', label: 'Members', badge: 6 },
    ]},
  ]},
];

<tx-sidebar
  [sections]="nav"
  [(activeId)]="active"
  [(collapsed)]="collapsed"
  (itemSelect)="router.navigate([$event.id])" />`;

  protected readonly headerCode = `<tx-header heading="Items" menu="auto" (menuToggle)="drawer.set(!drawer())">
  <span slot="brand">Acme</span>
  <tx-input slot="middle" type="search" placeholder="Search items" [(value)]="query" />
  <div slot="actions">
    <tx-button variant="filled" size="sm">New item</tx-button>
  </div>
</tx-header>`;

  protected readonly shellCode = `<tx-app-shell [drawerOpen]="drawer()" (drawerClose)="drawer.set(false)">
  <tx-sidebar slot="sidebar" [sections]="nav" [activeId]="activeId()" (itemSelect)="go($event.id)" />
  <tx-header slot="header" [heading]="pageTitle()" menu="auto" (menuToggle)="drawer.set(!drawer())" />
  <router-outlet />
</tx-app-shell>`;

  protected readonly sidebarApi: readonly ApiRow[] = [
    { name: 'sections', type: 'TxNavSection[]', description: 'Titled runs of items. Items take id, label, icon, badge, href, disabled and one level of children.' },
    { name: 'activeId', type: 'model<string | null>', def: 'null', description: 'Which item is current. Sets aria-current and opens its parent group.' },
    { name: 'collapsed', type: 'model<boolean>', def: 'false', description: 'Icon rail. Labels are clipped, not removed, so accessible names survive.' },
    { name: 'collapsible', type: "'auto' | 'always' | 'never'", def: "'auto'", description: 'When the collapse control is offered. auto = only at or above the shell breakpoint.' },
    { name: 'label', type: 'string', def: "'Main navigation'", description: 'Accessible name for the nav landmark.' },
    { name: 'itemSelect', type: 'output<TxNavItem>', description: 'Fires when a leaf item is chosen. Groups toggle instead.' },
  ];

  protected readonly headerApi: readonly ApiRow[] = [
    { name: 'heading', type: 'string', def: "''", description: 'Page title beside the brand.' },
    { name: 'menu', type: "'auto' | 'always' | 'never'", def: "'never'", description: 'When the navigation toggle shows. auto = only below the shell breakpoint, where the sidebar is a drawer.' },
    { name: 'sticky', type: 'boolean', def: 'true', description: 'Pins the header to the top of its scroll container.' },
    { name: 'bordered', type: 'boolean', def: 'true', description: 'Hairline along the bottom edge.' },
    { name: 'menuToggle', type: 'output<void>', description: 'The menu button was pressed. The header holds no state itself.' },
  ];

  protected readonly shellApi: readonly ApiRow[] = [
    { name: 'drawerOpen', type: 'boolean', def: 'false', description: 'On narrow screens, whether the sidebar drawer is showing.' },
    { name: 'maxWidth', type: 'string', def: "'none'", description: 'Caps the content column so long text does not run edge to edge.' },
    { name: 'drawerClose', type: 'output<void>', description: 'The drawer was dismissed — scrim or Escape. The shell holds no state, so clear drawerOpen yourself.' },
  ];

  protected readonly keys = [
    { keys: 'Tab', action: 'Move between navigation items' },
    { keys: 'Enter', action: 'Activate an item, or expand a group' },
    { keys: 'Space', action: 'Toggle a group' },
  ];

  protected readonly dos = [
    'Keep the sidebar to one level of nesting; deeper hierarchies belong on the page.',
    'Derive activeId from the URL so a refresh or a deep link stays correct.',
    'Use badges for counts that change what someone would do next.',
    'Let the shell decide which navigation control to show: menu="auto" and the default collapsible="auto" never appear together.',
  ];

  protected readonly donts = [
    'Do not make a group heading a destination as well as a toggle — pick one.',
    'Do not hide labels with display:none when collapsing; the accessible name goes with them.',
    'Do not put more than about seven items in a section without grouping them.',
    'Do not duplicate the sidebar in the header; one primary navigation is enough.',
  ];
}
