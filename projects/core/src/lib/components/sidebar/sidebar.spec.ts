import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxSidebar } from './sidebar';
import { TxHeader } from '../header/header';
import { TxNavSection } from '../../utils/types';

const NAV: TxNavSection[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: 'info' },
      { id: 'items', label: 'Items', icon: 'menu', badge: 12 },
      { id: 'archive', label: 'Archive', disabled: true },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        id: 'config',
        label: 'Configuration',
        icon: 'edit',
        children: [
          { id: 'general', label: 'General' },
          { id: 'access', label: 'Access', href: '/access' },
        ],
      },
    ],
  },
];

@Component({
  standalone: true,
  imports: [TxSidebar],
  template: `
    <tx-sidebar [sections]="nav" [(activeId)]="active" [(collapsed)]="collapsed" />
  `,
})
class Host {
  readonly nav = NAV;
  readonly active = signal<string | null>('overview');
  readonly collapsed = signal(false);
}

describe('TxSidebar', () => {
  let fixture: ComponentFixture<Host>;

  const links = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-sidebar__link'));
  const byText = (text: string): HTMLElement =>
    links().find((l) => l.textContent!.trim().startsWith(text))!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders a navigation landmark with sectioned lists', () => {
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Main navigation');
    expect(fixture.nativeElement.querySelectorAll('.tx-sidebar__section').length).toBe(2);
  });

  it('marks the active item with aria-current', () => {
    expect(byText('Overview').getAttribute('aria-current')).toBe('page');
    expect(byText('Items').getAttribute('aria-current')).toBeNull();
  });

  it('selects an item and reports it', () => {
    byText('Items').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.active()).toBe('items');
    expect(byText('Items').getAttribute('aria-current')).toBe('page');
  });

  it('does not select a disabled item', () => {
    const archive = byText('Archive') as HTMLButtonElement;
    expect(archive.disabled).toBe(true);
    archive.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('overview');
  });

  it('renders a badge when the item has one', () => {
    expect(byText('Items').querySelector('.tx-sidebar__badge')!.textContent!.trim()).toBe('12');
  });

  it('expands a group rather than selecting it', () => {
    const group = byText('Configuration');
    expect(group.getAttribute('aria-expanded')).toBe('false');

    group.click();
    fixture.detectChanges();

    expect(group.getAttribute('aria-expanded')).toBe('true');
    // The group itself is not a destination.
    expect(fixture.componentInstance.active()).toBe('overview');
    expect(byText('General')).toBeTruthy();
  });

  it('opens the group that contains the active item', () => {
    fixture.componentInstance.active.set('general');
    fixture.detectChanges();

    expect(byText('Configuration').getAttribute('aria-expanded')).toBe('true');
    expect(byText('Configuration').classList).toContain('tx-sidebar__link--active');
  });

  it('renders a child with an href as a real anchor', () => {
    byText('Configuration').click();
    fixture.detectChanges();

    const access = byText('Access');
    expect(access.tagName).toBe('A');
    expect(access.getAttribute('href')).toBe('/access');
  });

  it('collapses to a rail without losing accessible names', () => {
    fixture.componentInstance.collapsed.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('tx-sidebar');
    expect(host.classList).toContain('tx-sidebar--collapsed');
    // Labels are clipped, not removed — the item keeps its accessible name.
    expect(byText('Overview').textContent).toContain('Overview');
  });

  it('toggles collapsed state from its own control', () => {
    const toggle: HTMLButtonElement =
      fixture.nativeElement.querySelector('.tx-sidebar__collapse');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.collapsed()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});

@Component({
  standalone: true,
  imports: [TxHeader],
  template: `
    <tx-header heading="Catalogue" menu="always" (menuToggle)="toggles = toggles + 1">
      <span slot="brand">Acme</span>
      <div slot="actions"><button type="button">Sign out</button></div>
    </tx-header>
  `,
})
class HeaderHost {
  toggles = 0;
}

describe('TxHeader', () => {
  let fixture: ComponentFixture<HeaderHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeaderHost] }).compileComponents();
    fixture = TestBed.createComponent(HeaderHost);
    fixture.detectChanges();
  });

  it('is a header landmark with a heading', () => {
    expect(fixture.nativeElement.querySelector('.tx-header__heading').textContent.trim()).toBe(
      'Catalogue',
    );
  });

  it('projects brand and action content', () => {
    expect(fixture.nativeElement.querySelector('.tx-header__brand').textContent).toContain('Acme');
    expect(fixture.nativeElement.querySelector('.tx-header__actions').textContent).toContain(
      'Sign out',
    );
  });

  it('reports the menu toggle without holding navigation state', () => {
    const menu: HTMLButtonElement = fixture.nativeElement.querySelector('.tx-header__menu');
    expect(menu.getAttribute('aria-label')).toBe('Toggle navigation');

    menu.click();
    expect(fixture.componentInstance.toggles).toBe(1);
  });

  it('hides the menu button unless asked for', async () => {
    @Component({ standalone: true, imports: [TxHeader], template: `<tx-header heading="X" />` })
    class Plain {}

    const plain = TestBed.createComponent(Plain);
    plain.detectChanges();
    expect(plain.nativeElement.querySelector('.tx-header__menu')).toBeNull();
  });

  it('marks the menu mode on the host so CSS can make it responsive', () => {
    const header: HTMLElement = fixture.nativeElement.querySelector('tx-header');
    expect(header.getAttribute('data-menu')).toBe('always');

    // `auto` still renders the button; a media query hides it above the
    // shell's breakpoint, where the sidebar is permanently on screen.
    @Component({
      standalone: true,
      imports: [TxHeader],
      template: `<tx-header heading="X" menu="auto" />`,
    })
    class Auto {}

    const auto = TestBed.createComponent(Auto);
    auto.detectChanges();
    expect(auto.nativeElement.querySelector('tx-header').getAttribute('data-menu')).toBe('auto');
    expect(auto.nativeElement.querySelector('.tx-header__menu')).not.toBeNull();
  });
});
