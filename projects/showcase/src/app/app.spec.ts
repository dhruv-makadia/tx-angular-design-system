import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';
import { ThemeService } from './theme.service';
import { CATALOGUE } from './catalogue-data';
import { CataloguePage } from './pages/catalogue.page';

describe('Showcase shell', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  const navLinks = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-sidebar__link'));
  const byText = (text: string) => navLinks().find((l) => l.textContent!.trim().startsWith(text))!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [...appConfig.providers],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
    await router.navigateByUrl('/overview');
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('renders the shell with a sidebar and a header', () => {
    expect(fixture.nativeElement.querySelector('tx-app-shell')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tx-sidebar nav')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tx-header')).not.toBeNull();
  });

  it('marks the current route in the sidebar', () => {
    expect(byText('Overview').getAttribute('aria-current')).toBe('page');
  });

  it('derives the active item from the URL rather than click state', async () => {
    await router.navigateByUrl('/tokens');
    fixture.detectChanges();

    expect(byText('Tokens').getAttribute('aria-current')).toBe('page');
    expect(byText('Overview').getAttribute('aria-current')).toBeNull();
  });

  it('shows the current page name in the header', async () => {
    await router.navigateByUrl('/table');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tx-header__heading').textContent.trim()).toBe(
      'Table',
    );
  });

  it('navigates when a sidebar item is chosen', async () => {
    byText('Getting started').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/getting-started');
  });

  it('toggles the theme through the shared service', () => {
    const theme = TestBed.inject(ThemeService);
    expect(theme.mode()).toBe('light');

    fixture.nativeElement.querySelector('.tx-header__actions tx-button .tx-button__el').click();
    fixture.detectChanges();

    expect(theme.mode()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('redirects an unknown route to the overview', async () => {
    await router.navigateByUrl('/nope');
    fixture.detectChanges();
    expect(router.url).toBe('/overview');
  });
});

describe('Composition page', () => {
  let fixture: ComponentFixture<CataloguePage>;

  const rows = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.tx-table__row'));
  const filterTriggers = (): HTMLButtonElement[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll(
        '.filters .tx-select__trigger, .filters .tx-multi-select__trigger',
      ),
    );
  const summary = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.summary dd')).map((n) =>
      (n as HTMLElement).textContent!.trim(),
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CataloguePage],
      providers: [...appConfig.providers],
    }).compileComponents();
    fixture = TestBed.createComponent(CataloguePage);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('composes filters, a table and a form from library components only', () => {
    expect(filterTriggers().length).toBe(3);
    expect(fixture.nativeElement.querySelector('tx-table')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('tx-input').length).toBe(2);
    expect(fixture.nativeElement.querySelector('tx-textarea')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tx-radio-group')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tx-toggle')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tx-checkbox')).not.toBeNull();
  });

  it('paginates rather than rendering the whole catalogue', () => {
    expect(CATALOGUE.length).toBeGreaterThan(10);
    expect(rows().length).toBe(10);
    expect(summary()[0]).toBe(String(CATALOGUE.length));
  });

  it('narrows the table when a category is chosen', () => {
    const expected = CATALOGUE.filter((i) => i.category === 'Cabling').length;

    filterTriggers()[0].click();
    fixture.detectChanges();

    const option: HTMLElement = document.querySelector('.tx-select__option')!;
    expect(option.textContent).toContain('Cabling');
    option.click();
    fixture.detectChanges();

    expect(summary()[0]).toBe(String(expected));
    expect(rows().length).toBe(Math.min(expected, 10));
  });

  it('sorts without losing the page size', () => {
    const header: HTMLButtonElement = fixture.nativeElement.querySelector('.tx-table__sort');
    header.click();
    fixture.detectChanges();

    const skus = rows().map((r) => r.querySelector('td')!.textContent!.trim());
    expect(skus).toEqual([...skus].sort((a, b) => a.localeCompare(b)));
    expect(rows().length).toBe(10);
  });

  it('opens a detail panel when a row is clicked', () => {
    expect(fixture.nativeElement.querySelectorAll('tx-card').length).toBe(2);

    rows()[0].click();
    fixture.detectChanges();

    // Filters, detail, form.
    expect(fixture.nativeElement.querySelectorAll('tx-card').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.detail')).not.toBeNull();
  });

  it('keeps save disabled until the draft is valid and confirmed', () => {
    const save = (): HTMLButtonElement =>
      fixture.nativeElement.querySelector('.actions .tx-button__el');
    expect(save().disabled).toBe(true);

    const fields: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.form .tx-input__field'),
    );
    fields[0].value = 'CB-1042';
    fields[0].dispatchEvent(new Event('input'));
    fields[1].value = 'Cable gland';
    fields[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(save().disabled).toBe(true); // not confirmed yet

    fixture.nativeElement.querySelector('.form .tx-checkbox__native').click();
    fixture.detectChanges();
    expect(save().disabled).toBe(false);
  });

  it('flags a malformed SKU without blocking typing', () => {
    const sku: HTMLInputElement = fixture.nativeElement.querySelector('.form .tx-input__field');
    sku.value = 'nope';
    sku.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const field = fixture.nativeElement.querySelector('.form tx-input');
    expect(field.classList).toContain('tx-input--invalid');
    expect(field.textContent).toContain('That does not look like a SKU');
  });
});
