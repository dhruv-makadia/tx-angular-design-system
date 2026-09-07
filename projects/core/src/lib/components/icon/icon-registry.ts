import {
  EnvironmentProviders,
  Injectable,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';

/**
 * An icon definition.
 *
 * Icons are stored as path geometry rather than markup, so nothing is ever
 * injected as raw HTML — there is no sanitiser in the loop, and a registered
 * icon cannot smuggle in script or external references. `viewBox` defaults to
 * a 24-unit grid.
 */
export interface TxIconDefinition {
  readonly paths: readonly string[];
  readonly viewBox?: string;
  /** Set false for solid glyphs; stroked icons inherit the line weight. */
  readonly stroked?: boolean;
}

/**
 * What you can hand the registry for one icon.
 *
 * A single `d` string covers most icons, and an array covers the rest. Reach
 * for the full {@link TxIconDefinition} only when the glyph is solid or is not
 * drawn on a 24-unit grid.
 */
export type TxIconInput = string | readonly string[] | TxIconDefinition;

/** Normalises the three shorthands onto one shape. */
export function txIconDefinition(icon: TxIconInput): TxIconDefinition {
  if (typeof icon === 'string') return { paths: [icon] };
  if (Array.isArray(icon)) return { paths: icon as readonly string[] };
  return icon as TxIconDefinition;
}

/** The set shipped with the library. Consumers register their own alongside. */
const BUILT_IN: Record<string, TxIconDefinition> = {
  check: { paths: ['M4 12.5l5 5L20 6.5'] },
  close: { paths: ['M6 6l12 12M18 6L6 18'] },
  'chevron-down': { paths: ['M6 9.5l6 6 6-6'] },
  'chevron-up': { paths: ['M6 14.5l6-6 6 6'] },
  'chevron-right': { paths: ['M9.5 6l6 6-6 6'] },
  'chevron-left': { paths: ['M14.5 6l-6 6 6 6'] },
  search: { paths: ['M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.35-4.35'] },
  plus: { paths: ['M12 5v14M5 12h14'] },
  minus: { paths: ['M5 12h14'] },
  filter: { paths: ['M3 5h18M6 12h12M10 19h4'] },
  download: { paths: ['M12 3v12M7.5 10.5L12 15l4.5-4.5M4 20h16'] },
  info: { paths: ['M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z', 'M12 11v5', 'M12 7.75v.5'] },
  warning: { paths: ['M12 3.5L22 20H2L12 3.5z', 'M12 10v4', 'M12 16.75v.5'] },
  error: { paths: ['M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z', 'M12 7.5v5.5', 'M12 16.25v.5'] },
  'arrow-up': { paths: ['M12 20V4M5.5 10.5L12 4l6.5 6.5'] },
  'arrow-down': { paths: ['M12 4v16M18.5 13.5L12 20l-6.5-6.5'] },
  trash: { paths: ['M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5'] },
  edit: { paths: ['M4 20h4L20 8l-4-4L4 16v4z'] },
  menu: { paths: ['M4 7h16M4 12h16M4 17h16'] },
  layout: { paths: ['M4 5h16v14H4z', 'M9 5v14'] },
  table: { paths: ['M4 5h16v14H4z', 'M4 10h16', 'M10 10v9'] },
  list: { paths: ['M8 6h12M8 12h12M8 18h12', 'M4 6h.01M4 12h.01M4 18h.01'] },
  sun: {
    paths: [
      'M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z',
      'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    ],
  },
  moon: { paths: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'] },
  palette: { paths: ['M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 21z', 'M7.5 12h.01M10 8.5h.01M14.5 8.5h.01'] },
  external: {
    paths: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  },
};

/**
 * Holds the icons available to `tx-icon`.
 *
 * An unknown name renders nothing rather than throwing, so a missing glyph
 * never takes down a screen.
 */
@Injectable({ providedIn: 'root' })
export class TxIconRegistry {
  private readonly icons = new Map<string, TxIconDefinition>(Object.entries(BUILT_IN));

  /**
   * Adds or replaces icons. Later registrations win, so an application can
   * override a built-in name with its own drawing.
   *
   * ```ts
   * registry.register({ rocket: 'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z' });
   * ```
   */
  register(icons: Record<string, TxIconInput>): void {
    for (const [name, icon] of Object.entries(icons)) {
      this.icons.set(name, txIconDefinition(icon));
    }
  }

  get(name: string): TxIconDefinition | undefined {
    return this.icons.get(name);
  }

  has(name: string): boolean {
    return this.icons.has(name);
  }

  /** Every registered name, sorted. Useful for building an icon gallery. */
  names(): string[] {
    return [...this.icons.keys()].sort();
  }
}

/**
 * Registers additional icons at bootstrap. Give it a path and use the name:
 *
 * ```ts
 * providers: [
 *   provideTxIcons({
 *     rocket: 'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z',
 *     logo: ['M4 12h16', 'M12 4v16'],
 *     seal: { paths: ['M12 2 …'], viewBox: '0 0 32 32', stroked: false },
 *   }),
 * ]
 * ```
 *
 * ```html
 * <tx-icon name="rocket" />
 * ```
 *
 * Call it more than once — in a feature's providers, say — and the sets merge.
 */
export function provideTxIcons(icons: Record<string, TxIconInput>): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => inject(TxIconRegistry).register(icons)),
  ]);
}
