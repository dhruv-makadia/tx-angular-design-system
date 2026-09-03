import { strings } from '@angular-devkit/core';
import {
  Rule,
  SchematicsException,
  Tree,
  apply,
  applyTemplates,
  chain,
  filter,
  mergeWith,
  move,
  noop,
  url,
} from '@angular-devkit/schematics';
import { createDefaultPath } from '@schematics/angular/utility/workspace';

export interface ComponentOptions {
  name: string;
  path?: string;
  project?: string;
  prefix?: string;
  skipTests?: boolean;
}

/**
 * Generates a component wired to the design system's conventions: standalone,
 * OnPush, signal inputs, `host` metadata rather than decorators, and a stylesheet
 * that reads design tokens instead of literals.
 */
export function component(options: ComponentOptions): Rule {
  return async (tree: Tree) => {
    if (!options.name) {
      throw new SchematicsException('Option "name" is required.');
    }

    const path = options.path ?? (await createDefaultPath(tree, options.project as string));
    const prefix = options.prefix || 'tx';

    const templates = apply(url('./files'), [
      options.skipTests ? filter((p) => !p.endsWith('.spec.ts.template')) : noop(),
      applyTemplates({
        ...strings,
        name: options.name,
        prefix,
        selector: `${prefix}-${strings.dasherize(options.name)}`,
        classify: strings.classify,
        dasherize: strings.dasherize,
      }),
      move(`${path}/${strings.dasherize(options.name)}`),
    ]);

    return chain([mergeWith(templates)]);
  };
}
