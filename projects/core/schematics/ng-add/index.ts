import { Rule, SchematicContext, SchematicsException, Tree, chain } from '@angular-devkit/schematics';
import {
  DependencyType,
  ExistingBehavior,
  InstallBehavior,
  addDependency,
} from '@schematics/angular/utility/dependency';
import { getWorkspace, updateWorkspace } from '@schematics/angular/utility/workspace';
import { workspaces } from '@angular-devkit/core';

export interface NgAddOptions {
  project?: string;
  brandColor?: string;
  darkMode?: 'light' | 'dark' | 'both';
  typography?: 'bundled' | 'system';
  tailwind?: boolean;
  skipInstall?: boolean;
}

const PKG = '@tx-angular-design-system/core';

/** Marker used to find our block on a re-run, so the schematic stays idempotent. */
const BLOCK_START = '/* --- @tx-angular-design-system/core --- */';
const BLOCK_END = '/* --- end @tx-angular-design-system/core --- */';

const TAILWIND_VERSION = '^4.3.0';
const LOCALIZE_POLYFILL = '@angular/localize/init';
const OVERRIDES_PATH_FROM_STYLES = './styles/_tx-overrides.css';

export function ngAdd(options: NgAddOptions): Rule {
  return chain([
    addDependencies(options),
    registerLocalizePolyfill(options),
    setupTailwindPostcss(options),
    updateGlobalStylesheet(options),
    createOverridesStub(options),
    logNextSteps(options),
  ]);
}

/**
 * Registers `@angular/localize/init`.
 *
 * The library's built-in strings are `$localize` tagged templates. Without the
 * polyfill the tag is never defined and every component that has one throws
 * `$localize is not defined` at construction — the app renders nothing. The
 * package alone is not enough; it has to be in the build's `polyfills`.
 */
function registerLocalizePolyfill(options: NgAddOptions): Rule {
  return updateWorkspace((workspace) => {
    const project = resolveProject(workspace, options.project);
    if (!project) return;

    for (const target of ['build', 'test']) {
      const definition = project.targets.get(target);
      if (!definition) continue;

      const current = definition.options?.['polyfills'];
      const polyfills = Array.isArray(current)
        ? [...(current as string[])]
        : typeof current === 'string'
          ? [current]
          : [];

      if (polyfills.includes(LOCALIZE_POLYFILL)) continue;

      // Must run before application code, so it goes first.
      polyfills.unshift(LOCALIZE_POLYFILL);
      definition.options = { ...definition.options, polyfills };
    }
  });
}

/**
 * Adds peer dependencies at versions compatible with the host's Angular.
 *
 * The Angular major is read from the host `package.json` rather than hardcoded, so
 * `ng add` keeps working across Angular releases.
 */
function addDependencies(options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const angularRange = readDependency(tree, '@angular/core');
    if (!angularRange) {
      throw new SchematicsException(
        'Could not find @angular/core in package.json. Run this inside an Angular workspace.',
      );
    }

    const major = majorOf(angularRange);
    const angularPeer = major ? `^${major}.0.0` : angularRange;
    const install = options.skipInstall ? InstallBehavior.None : InstallBehavior.Auto;

    const rules: Rule[] = [
      addDependency('@angular/cdk', angularPeer, {
        type: DependencyType.Default,
        existing: ExistingBehavior.Skip,
        install,
      }),
      addDependency('@angular/aria', angularPeer, {
        type: DependencyType.Default,
        existing: ExistingBehavior.Skip,
        install,
      }),
      addDependency('@angular/localize', angularPeer, {
        type: DependencyType.Default,
        existing: ExistingBehavior.Skip,
        install,
      }),
    ];

    if (options.tailwind !== false) {
      rules.push(
        addDependency('tailwindcss', TAILWIND_VERSION, {
          type: DependencyType.Dev,
          existing: ExistingBehavior.Skip,
          install,
        }),
        addDependency('@tailwindcss/postcss', TAILWIND_VERSION, {
          type: DependencyType.Dev,
          existing: ExistingBehavior.Skip,
          install,
        }),
      );
    }

    context.logger.info(`Adding peer dependencies for Angular ${major ?? '(unknown major)'}.`);
    return chain(rules);
  };
}

/**
 * Registers the Tailwind v4 PostCSS plugin.
 *
 * Idempotent: an existing config that already references the plugin is left alone rather than
 * rewritten, because the host may have other plugins configured alongside it.
 */
function setupTailwindPostcss(options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.tailwind === false) return;

    const candidates = [
      '/postcss.config.json',
      '/.postcssrc.json',
      '/postcss.config.js',
      '/postcss.config.mjs',
    ];
    const existing = candidates.find((path) => tree.exists(path));

    if (existing) {
      const content = tree.readText(existing);
      if (content.includes('@tailwindcss/postcss')) {
        context.logger.info(`Tailwind already configured in ${existing}; leaving it alone.`);
      } else {
        context.logger.warn(
          `Found ${existing} without the Tailwind plugin. Add "@tailwindcss/postcss" to it manually.`,
        );
      }
      return;
    }

    tree.create(
      '/.postcssrc.json',
      JSON.stringify({ plugins: { '@tailwindcss/postcss': {} } }, null, 2) + '\n',
    );
    context.logger.info('Created .postcssrc.json with the Tailwind v4 plugin.');
  };
}

/**
 * Appends our imports to the project's global stylesheet, in the order the cascade needs:
 * Tailwind, then the theme, then the Tailwind bridge, then the app's own overrides.
 *
 * Running twice replaces the existing block rather than duplicating it.
 */
function updateGlobalStylesheet(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const stylesheet = await findGlobalStylesheet(tree, options.project);
    if (!stylesheet) {
      context.logger.warn(
        'Could not find a global stylesheet. Add the theme import to your styles file manually:\n' +
          `  @import "${PKG}/styles/theme.css";`,
      );
      return;
    }

    const original = tree.readText(stylesheet);
    const block = buildImportBlock(options);
    const next = replaceBlock(original, block);

    if (next === original) {
      context.logger.info(`${stylesheet} is already up to date.`);
      return;
    }

    tree.overwrite(stylesheet, next);
    context.logger.info(`Wired the design system into ${stylesheet}.`);
  };
}

function buildImportBlock(options: NgAddOptions): string {
  const lines: string[] = [BLOCK_START];

  if (options.tailwind !== false) {
    lines.push(`@import 'tailwindcss';`);
  }

  lines.push(
    options.typography === 'system'
      ? `@import '${PKG}/styles/tokens.css';`
      : `@import '${PKG}/styles/theme.css';`,
  );

  if (options.tailwind !== false) {
    lines.push(`@import '${PKG}/styles/tailwind.css';`);
  }

  lines.push(`@import '${OVERRIDES_PATH_FROM_STYLES}';`);

  if (options.darkMode === 'light' || options.darkMode === 'dark') {
    lines.push('', `/* Colour scheme pinned by ng add --dark-mode=${options.darkMode}. */`);
    lines.push(`html { color-scheme: ${options.darkMode}; }`);
  } else {
    lines.push('', `html { color-scheme: light dark; }`);
  }

  lines.push(BLOCK_END);
  return lines.join('\n');
}

/** Replaces a previously written block, or prepends a new one. */
function replaceBlock(content: string, block: string): string {
  const start = content.indexOf(BLOCK_START);
  const end = content.indexOf(BLOCK_END);

  if (start !== -1 && end !== -1 && end > start) {
    const before = content.slice(0, start);
    const after = content.slice(end + BLOCK_END.length);
    const next = `${before}${block}${after}`;
    return next === content ? content : next;
  }

  return `${block}\n\n${content}`;
}

/** Writes the overrides stub. Never overwrites: it is the user's file after the first run. */
function createOverridesStub(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const stylesheet = await findGlobalStylesheet(tree, options.project);
    const dir = stylesheet ? stylesheet.slice(0, stylesheet.lastIndexOf('/')) : '/src';
    const path = `${dir}/styles/_tx-overrides.css`;

    if (tree.exists(path)) {
      context.logger.info(`${path} already exists; leaving your overrides untouched.`);
      return;
    }

    tree.create(path, overridesTemplate(options));
    context.logger.info(`Created ${path}.`);
  };
}

function overridesTemplate(options: NgAddOptions): string {
  const seed = options.brandColor?.trim();
  const brand = seed
    ? [
        '  /* Brand seed supplied to `ng add`. */',
        `  --tx-color-accent: ${seed};`,
        `  --tx-color-focus: ${seed};`,
      ].join('\n')
    : [
        '  /* Uncomment to reseed the accent. Keep contrast at 4.5:1 against the surface. */',
        '  /* --tx-color-accent: #0d47a1; */',
        '  /* --tx-color-focus: #0d47a1; */',
      ].join('\n');

  return `/*
 * Design system overrides.
 *
 * Everything in ${PKG}/styles/tokens.css is public API: redeclare any token
 * here and it cascades to every component and Tailwind utility.
 *
 * This file is imported after the theme, so these values win.
 */

:root {
${brand}

  /* Typography */
  /* --tx-font-sans: 'Inter', system-ui, sans-serif; */
  /* --tx-font-mono: 'JetBrains Mono', ui-monospace, monospace; */

  /* Shape and density */
  /* --tx-radius-md: 0.25rem; */
  /* --tx-density-row-height: 2.125rem; */
}

/* Dark-theme overrides go here. Applies to the OS setting, the [data-theme]
   attribute and the .tx-theme-dark subtree class alike. */
/*
:root[data-theme='dark'],
.tx-theme-dark {
  --tx-color-accent: #7ac43b;
}
*/
`;
}

function logNextSteps(options: NgAddOptions): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info(
      [
        '',
        `${PKG} is installed.`,
        '',
        'Next steps:',
        "  1. Register defaults:  providers: [provideTxDesignSystem({ density: 'standard' })]",
        '  2. Import a component: import { TxSelect } from ' + `'${PKG}'`,
        '  3. Adjust tokens in src/styles/_tx-overrides.css',
        options.typography === 'system'
          ? '  Note: you chose system fonts, so no faces are bundled. Set --tx-font-sans yourself.'
          : '  Fonts are self-hosted from the package — no network fetch, works offline.',
        '',
      ].join('\n'),
    );
  };
}

// --- helpers ---------------------------------------------------------------

function readDependency(tree: Tree, name: string): string | undefined {
  if (!tree.exists('/package.json')) return undefined;
  const pkg = JSON.parse(tree.readText('/package.json')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
}

/** Extracts the major from a range such as `^22.1.0`, `~22.0.0` or `22.1.5`. */
function majorOf(range: string): number | undefined {
  const match = /(\d+)\./.exec(range);
  return match ? Number(match[1]) : undefined;
}

/** The named project, or the first application in the workspace. */
function resolveProject(
  workspace: workspaces.WorkspaceDefinition,
  projectName?: string,
): workspaces.ProjectDefinition | undefined {
  return (
    (projectName ? workspace.projects.get(projectName) : undefined) ??
    [...workspace.projects.values()].find((p) => p.extensions['projectType'] === 'application')
  );
}

/** Resolves the first global stylesheet of the project's build target. */
async function findGlobalStylesheet(tree: Tree, projectName?: string): Promise<string | undefined> {
  const workspace = await getWorkspace(tree);
  const project = resolveProject(workspace, projectName);

  if (!project) return undefined;

  const build = project.targets.get('build');
  const styles = build?.options?.['styles'];
  if (!Array.isArray(styles)) return undefined;

  for (const entry of styles) {
    const path = typeof entry === 'string' ? entry : (entry as { input?: string })?.input;
    if (typeof path === 'string' && /\.(css|scss|sass|less)$/.test(path)) {
      const normalized = path.startsWith('/') ? path : `/${path}`;
      if (tree.exists(normalized)) return normalized;
    }
  }

  return undefined;
}
