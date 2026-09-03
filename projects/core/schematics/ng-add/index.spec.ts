import { HostTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

/**
 * These run against the COMPILED schematics in dist/, so they exercise exactly
 * what gets published. Run `npm run build:schematics` first.
 */
const COLLECTION = path.join(__dirname, '../../../../dist/core/schematics/collection.json');

const PKG = '@tx-angular-design-system/core';

function createHostApp(): UnitTestTree {
  const tree = new UnitTestTree(new HostTree());

  tree.create(
    '/package.json',
    JSON.stringify({
      name: 'host-app',
      dependencies: { '@angular/core': '^22.1.0', '@angular/common': '^22.1.0' },
      devDependencies: { '@angular/cli': '^22.1.0' },
    }),
  );

  tree.create(
    '/angular.json',
    JSON.stringify({
      version: 1,
      projects: {
        app: {
          projectType: 'application',
          root: '',
          sourceRoot: 'src',
          architect: {
            build: {
              builder: '@angular/build:application',
              options: { styles: ['src/styles.css'] },
            },
          },
        },
      },
    }),
  );

  tree.create('/src/styles.css', 'body { margin: 0; }\n');
  return tree;
}

describe('ng-add', () => {
  let runner: SchematicTestRunner;
  let host: UnitTestTree;

  beforeEach(() => {
    runner = new SchematicTestRunner('tx', COLLECTION);
    host = createHostApp();
  });

  const run = (options: Record<string, unknown> = {}) =>
    runner.runSchematic('ng-add', { skipInstall: true, ...options }, host);

  it('adds the runtime peer dependencies at the host Angular major', async () => {
    const tree = await run();
    const pkg = JSON.parse(tree.readContent('/package.json'));

    expect(pkg.dependencies['@angular/cdk']).toBe('^22.0.0');
    expect(pkg.dependencies['@angular/aria']).toBe('^22.0.0');
    expect(pkg.dependencies['@angular/localize']).toBe('^22.0.0');
  });

  it('derives the version from the host rather than hardcoding it', async () => {
    host.overwrite(
      '/package.json',
      JSON.stringify({ dependencies: { '@angular/core': '^23.0.0-next.1' } }),
    );
    const tree = await run();
    const pkg = JSON.parse(tree.readContent('/package.json'));

    expect(pkg.dependencies['@angular/cdk']).toBe('^23.0.0');
  });

  it('registers the $localize polyfill', async () => {
    const tree = await run();
    const workspace = JSON.parse(tree.readContent('/angular.json'));
    const polyfills = workspace.projects.app.architect.build.options.polyfills;

    // Without this the library's $localize strings throw at construction and
    // the app renders nothing — installing the package alone is not enough.
    expect(polyfills).toContain('@angular/localize/init');
  });

  it('does not duplicate the polyfill on a second run', async () => {
    const once = await run();
    const twice = await runner.runSchematic('ng-add', { skipInstall: true }, once);
    const polyfills: string[] =
      JSON.parse(twice.readContent('/angular.json')).projects.app.architect.build.options.polyfills;

    expect(polyfills.filter((p) => p === '@angular/localize/init').length).toBe(1);
  });

  it('preserves polyfills the host already had', async () => {
    const workspace = JSON.parse(host.readContent('/angular.json'));
    workspace.projects.app.architect.build.options.polyfills = ['zone.js'];
    host.overwrite('/angular.json', JSON.stringify(workspace));

    const tree = await run();
    const polyfills =
      JSON.parse(tree.readContent('/angular.json')).projects.app.architect.build.options.polyfills;

    expect(polyfills).toContain('zone.js');
    expect(polyfills).toContain('@angular/localize/init');
  });

  it('adds Tailwind and a PostCSS config by default', async () => {
    const tree = await run();
    const pkg = JSON.parse(tree.readContent('/package.json'));

    expect(pkg.devDependencies['tailwindcss']).toBeDefined();
    expect(pkg.devDependencies['@tailwindcss/postcss']).toBeDefined();
    expect(JSON.parse(tree.readContent('/.postcssrc.json')).plugins).toHaveProperty(
      '@tailwindcss/postcss',
    );
  });

  it('skips Tailwind entirely when asked', async () => {
    const tree = await run({ tailwind: false });
    const pkg = JSON.parse(tree.readContent('/package.json'));

    expect(pkg.devDependencies?.['tailwindcss']).toBeUndefined();
    expect(tree.exists('/.postcssrc.json')).toBe(false);
    expect(tree.readContent('/src/styles.css')).not.toContain(`@import 'tailwindcss'`);
  });

  it('writes the imports in cascade order and keeps existing styles', async () => {
    const tree = await run();
    const css = tree.readContent('/src/styles.css');

    const tailwind = css.indexOf(`@import 'tailwindcss'`);
    const theme = css.indexOf(`${PKG}/styles/theme.css`);
    const bridge = css.indexOf(`${PKG}/styles/tailwind.css`);
    const overrides = css.indexOf('_tx-overrides.css');

    expect(tailwind).toBeGreaterThan(-1);
    expect(tailwind).toBeLessThan(theme);
    expect(theme).toBeLessThan(bridge);
    expect(bridge).toBeLessThan(overrides);
    expect(css).toContain('body { margin: 0; }');
  });

  it('is idempotent — a second run does not duplicate anything', async () => {
    const once = await run();
    const twice = await runner.runSchematic('ng-add', { skipInstall: true }, once);
    const css = twice.readContent('/src/styles.css');

    const occurrences = css.split(`${PKG}/styles/theme.css`).length - 1;
    expect(occurrences).toBe(1);
    expect(css.split('body { margin: 0; }').length - 1).toBe(1);
  });

  it('creates an overrides stub and never overwrites it', async () => {
    const once = await run();
    expect(once.exists('/src/styles/_tx-overrides.css')).toBe(true);

    once.overwrite('/src/styles/_tx-overrides.css', '/* mine */');
    const twice = await runner.runSchematic('ng-add', { skipInstall: true }, once);
    expect(twice.readContent('/src/styles/_tx-overrides.css')).toBe('/* mine */');
  });

  it('seeds the brand colour into the overrides stub', async () => {
    const tree = await run({ brandColor: '#0d47a1' });
    const stub = tree.readContent('/src/styles/_tx-overrides.css');

    expect(stub).toContain('--tx-color-accent: #0d47a1;');
    expect(stub).toContain('--tx-color-focus: #0d47a1;');
  });

  it('leaves the accent commented out when no brand colour is given', async () => {
    const tree = await run();
    const stub = tree.readContent('/src/styles/_tx-overrides.css');
    expect(stub).toContain('/* --tx-color-accent:');
  });

  it('pins the colour scheme when only one theme is wanted', async () => {
    const tree = await run({ darkMode: 'dark' });
    expect(tree.readContent('/src/styles.css')).toContain('color-scheme: dark;');
  });

  it('follows the OS when both themes are wanted', async () => {
    const tree = await run({ darkMode: 'both' });
    expect(tree.readContent('/src/styles.css')).toContain('color-scheme: light dark;');
  });

  it('imports tokens only, not the font-bearing theme, for system typography', async () => {
    const tree = await run({ typography: 'system' });
    const css = tree.readContent('/src/styles.css');

    expect(css).toContain(`${PKG}/styles/tokens.css`);
    expect(css).not.toContain(`${PKG}/styles/theme.css`);
  });

  it('fails clearly outside an Angular workspace', async () => {
    const bare = new UnitTestTree(new HostTree());
    bare.create('/package.json', JSON.stringify({ dependencies: {} }));

    await expect(
      runner.runSchematic('ng-add', { skipInstall: true }, bare),
    ).rejects.toThrow(/@angular\/core/);
  });
});

describe('ng-generate component', () => {
  let runner: SchematicTestRunner;
  let host: UnitTestTree;

  beforeEach(() => {
    runner = new SchematicTestRunner('tx', COLLECTION);
    host = createHostApp();
  });

  it('generates a component, template, styles and spec', async () => {
    const tree = await runner.runSchematic('component', { name: 'status pill', path: 'src/app' }, host);

    expect(tree.files).toEqual(
      expect.arrayContaining([
        '/src/app/status-pill/status-pill.ts',
        '/src/app/status-pill/status-pill.html',
        '/src/app/status-pill/status-pill.css',
        '/src/app/status-pill/status-pill.spec.ts',
      ]),
    );
  });

  it('applies the design system conventions', async () => {
    const tree = await runner.runSchematic('component', { name: 'status pill', path: 'src/app' }, host);
    const source = tree.readContent('/src/app/status-pill/status-pill.ts');

    expect(source).toContain("selector: 'tx-status-pill'");
    expect(source).toContain('export class TxStatusPill');
    expect(source).toContain('ChangeDetectionStrategy.OnPush');
    expect(source).toContain('standalone: true');
    expect(source).toContain('input(');
    expect(source).toContain('host: {');
    // Decorator-based IO is the thing these conventions exist to avoid.
    expect(source).not.toContain('@Input(');
    expect(source).not.toContain('@HostBinding');
  });

  it('styles against tokens rather than literal colours', async () => {
    const tree = await runner.runSchematic('component', { name: 'badge', path: 'src/app' }, host);
    const css = tree.readContent('/src/app/badge/badge.css');

    expect(css).toContain('var(--tx-color-on-surface)');
    expect(css).not.toMatch(/#[0-9a-f]{6}/i);
  });

  it('honours a custom prefix', async () => {
    const tree = await runner.runSchematic(
      'component',
      { name: 'badge', path: 'src/app', prefix: 'acme' },
      host,
    );
    const source = tree.readContent('/src/app/badge/badge.ts');

    expect(source).toContain("selector: 'acme-badge'");
    expect(source).toContain('export class AcmeBadge');
  });

  it('omits the spec when skipTests is set', async () => {
    const tree = await runner.runSchematic(
      'component',
      { name: 'badge', path: 'src/app', skipTests: true },
      host,
    );
    expect(tree.files).not.toContain('/src/app/badge/badge.spec.ts');
  });
});
