import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxIcon } from './icon';
import { TxIconInput, TxIconRegistry, provideTxIcons, txIconDefinition } from './icon-registry';

const STAR = 'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z';

@Component({
  standalone: true,
  imports: [TxIcon],
  template: `
    <tx-icon
      [name]="name()"
      [path]="path()"
      [viewBox]="viewBox()"
      [filled]="filled()"
      [label]="label()"
    />
  `,
})
class Host {
  readonly name = signal('');
  readonly path = signal<TxIconInput>('');
  readonly viewBox = signal('');
  readonly filled = signal(false);
  readonly label = signal('');
}

describe('TxIcon', () => {
  let fixture: ComponentFixture<Host>;

  const svg = (): SVGElement | null => fixture.nativeElement.querySelector('svg');
  const paths = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('path')).map((p) =>
      (p as SVGPathElement).getAttribute('d')!,
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders a registered icon by name', () => {
    fixture.componentInstance.name.set('check');
    fixture.detectChanges();

    expect(paths().length).toBe(1);
    expect(svg()!.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('renders nothing for an unknown name rather than throwing', () => {
    fixture.componentInstance.name.set('not-an-icon');
    fixture.detectChanges();
    expect(svg()).toBeNull();
  });

  it('draws a path given inline, with nothing registered', () => {
    fixture.componentInstance.path.set(STAR);
    fixture.detectChanges();

    expect(paths()).toEqual([STAR]);
    expect(TestBed.inject(TxIconRegistry).has('star')).toBe(false);
  });

  it('accepts several inline paths', () => {
    fixture.componentInstance.path.set(['M4 12h16', 'M12 4v16']);
    fixture.detectChanges();
    expect(paths()).toEqual(['M4 12h16', 'M12 4v16']);
  });

  it('prefers an inline path over a name, so a one-off can override', () => {
    fixture.componentInstance.name.set('check');
    fixture.componentInstance.path.set(STAR);
    fixture.detectChanges();
    expect(paths()).toEqual([STAR]);
  });

  it('treats an empty path as nothing supplied, not as an empty drawing', () => {
    fixture.componentInstance.name.set('check');
    fixture.componentInstance.path.set([]);
    fixture.detectChanges();
    expect(paths().length).toBe(1);
  });

  it('strokes by default and fills on request', () => {
    fixture.componentInstance.path.set(STAR);
    fixture.detectChanges();
    expect(svg()!.getAttribute('stroke')).toBe('currentColor');
    expect(svg()!.getAttribute('fill')).toBe('none');

    fixture.componentInstance.filled.set(true);
    fixture.detectChanges();
    expect(svg()!.getAttribute('fill')).toBe('currentColor');
    expect(svg()!.getAttribute('stroke')).toBe('none');
  });

  it('lets filled override a registered definition', () => {
    TestBed.inject(TxIconRegistry).register({
      solid: { paths: [STAR], stroked: false },
    });
    fixture.componentInstance.name.set('solid');
    fixture.detectChanges();
    expect(svg()!.getAttribute('fill')).toBe('currentColor');
  });

  it('overrides the grid when a viewBox is given', () => {
    fixture.componentInstance.path.set(STAR);
    fixture.componentInstance.viewBox.set('0 0 32 32');
    fixture.detectChanges();
    expect(svg()!.getAttribute('viewBox')).toBe('0 0 32 32');
  });

  it('is decorative until it is given a label', () => {
    fixture.componentInstance.path.set(STAR);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('tx-icon');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('role')).toBeNull();

    fixture.componentInstance.label.set('Favourite');
    fixture.detectChanges();

    expect(host.getAttribute('role')).toBe('img');
    expect(host.getAttribute('aria-label')).toBe('Favourite');
    expect(host.getAttribute('aria-hidden')).toBeNull();
  });
});

describe('TxIconRegistry', () => {
  it('normalises the three shorthands onto one shape', () => {
    expect(txIconDefinition(STAR)).toEqual({ paths: [STAR] });
    expect(txIconDefinition(['a', 'b'])).toEqual({ paths: ['a', 'b'] });
    expect(txIconDefinition({ paths: [STAR], stroked: false })).toEqual({
      paths: [STAR],
      stroked: false,
    });
  });

  it('registers a bare path string and renders it by name', async () => {
    await TestBed.configureTestingModule({
      imports: [TxIcon],
      providers: [provideTxIcons({ star: STAR, cross: ['M4 4l16 16', 'M20 4L4 20'] })],
    }).compileComponents();

    @Component({ standalone: true, imports: [TxIcon], template: `<tx-icon name="star" />` })
    class Star {}

    const fixture = TestBed.createComponent(Star);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('path').getAttribute('d')).toBe(STAR);
    const registry = TestBed.inject(TxIconRegistry);
    expect(registry.get('cross')!.paths.length).toBe(2);
    expect(registry.names()).toContain('star');
  });

  it('lets a later registration replace a built-in', () => {
    const registry = TestBed.inject(TxIconRegistry);
    expect(registry.get('check')!.paths).not.toEqual([STAR]);

    registry.register({ check: STAR });
    expect(registry.get('check')!.paths).toEqual([STAR]);
  });
});
