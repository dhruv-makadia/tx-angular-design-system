import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxAppShell } from './app-shell';

@Component({
  standalone: true,
  imports: [TxAppShell],
  template: `
    <tx-app-shell [drawerOpen]="open()" (drawerClose)="open.set(false)" [maxWidth]="cap()">
      <nav slot="sidebar">Nav</nav>
      <header slot="header">Head</header>
      <p>Page</p>
    </tx-app-shell>
  `,
})
class Host {
  readonly open = signal(false);
  readonly cap = signal('none');
}

describe('TxAppShell', () => {
  let fixture: ComponentFixture<Host>;
  const shell = (): HTMLElement => fixture.nativeElement.querySelector('tx-app-shell');
  const scrim = (): HTMLElement => fixture.nativeElement.querySelector('.tx-app-shell__scrim');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('projects the sidebar, the header and the page into their regions', () => {
    expect(
      fixture.nativeElement.querySelector('.tx-app-shell__sidebar').textContent,
    ).toContain('Nav');
    expect(fixture.nativeElement.querySelector('.tx-app-shell__main').textContent).toContain(
      'Head',
    );
    expect(fixture.nativeElement.querySelector('.tx-app-shell__content').textContent).toContain(
      'Page',
    );
  });

  it('flags the open drawer on the host so CSS can slide the sidebar in', () => {
    expect(shell().classList).not.toContain('tx-app-shell--drawer-open');

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(shell().classList).toContain('tx-app-shell--drawer-open');
  });

  it('reports dismissal from the scrim without holding the state itself', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    scrim().click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('reports dismissal from Escape, and only while the drawer is open', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('keeps the scrim out of the accessibility tree', () => {
    expect(scrim().getAttribute('aria-hidden')).toBe('true');
  });

  it('caps the content column when asked', () => {
    fixture.componentInstance.cap.set('60rem');
    fixture.detectChanges();

    const content: HTMLElement = fixture.nativeElement.querySelector('.tx-app-shell__content');
    expect(content.style.maxWidth).toBe('60rem');
  });
});
