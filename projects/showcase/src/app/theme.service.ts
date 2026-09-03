import { Injectable, computed, effect, signal } from '@angular/core';
import { TxDensity } from '@tx-angular-design-system/core';

export type ThemeMode = 'light' | 'dark';

/** A token the theme editor can rewrite at runtime. */
export interface EditableToken {
  readonly name: string;
  readonly label: string;
  readonly kind: 'color' | 'length' | 'text';
  readonly initial: string;
  readonly hint?: string;
  /** Also needs a dark value; a light-theme colour will not read on near-black. */
  readonly themed?: boolean;
}

export const EDITABLE_TOKENS: readonly EditableToken[] = [
  {
    name: '--tx-color-accent',
    label: 'Accent',
    kind: 'color',
    initial: '#3c7700',
    hint: 'Primary action colour',
    themed: true,
  },
  { name: '--tx-color-focus', label: 'Focus ring', kind: 'color', initial: '#4e9200', themed: true },
  // Surfaces and text are theme-dependent too; the editor writes them into the
  // light scope only, which is why they carry the note.
  { name: '--tx-color-canvas', label: 'Canvas', kind: 'color', initial: '#f7f4ee', hint: 'Light theme' },
  { name: '--tx-color-surface-raised', label: 'Raised surface', kind: 'color', initial: '#ffffff', hint: 'Light theme' },
  { name: '--tx-color-on-surface', label: 'Body text', kind: 'color', initial: '#27231c', hint: 'Light theme' },
  { name: '--tx-color-border-strong', label: 'Control border', kind: 'color', initial: '#8f887c', hint: 'Must clear 3:1' },
  { name: '--tx-radius-md', label: 'Control radius', kind: 'length', initial: '0.4375rem' },
  { name: '--tx-radius-lg', label: 'Panel radius', kind: 'length', initial: '0.625rem' },
  { name: '--tx-font-sans', label: 'Body font', kind: 'text', initial: "'TX Sans', 'IBM Plex Sans', system-ui, sans-serif" },
];

const NL = '\n';

/**
 * App-wide appearance state.
 *
 * Theme and density live here rather than in a component because the header,
 * the sidebar and every page need them.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('light');
  readonly density = signal<TxDensity>('standard');

  /** Token → value for the light theme. Empty means "use the shipped value". */
  readonly overrides = signal<Record<string, string>>({});
  /** Token → value applied only under the dark theme. */
  readonly darkOverrides = signal<Record<string, string>>({});

  private styleEl: HTMLStyleElement | null = null;
  private readonly emitted = signal('');

  /** The CSS a consumer would paste into their own stylesheet. */
  readonly css = computed(() => this.emitted());

  constructor() {
    effect(() => {
      document.documentElement.dataset['theme'] = this.mode();
    });

    /*
     * Overrides are emitted as a stylesheet with two scopes, not as inline
     * styles on :root.
     *
     * An inline :root style beats the dark-theme block, so one accent value
     * would apply to both themes — and a colour chosen to read on white will
     * not read on near-black. This is the shape a consuming app would write, so
     * the editor teaches the right pattern rather than a shortcut that breaks
     * the moment someone switches theme.
     */
    effect(() => {
      const decls = (map: Record<string, string>) =>
        Object.entries(map)
          .filter(([, value]) => !!value)
          .map(([token, value]) => `  ${token}: ${value};`)
          .join(NL);

      const blocks: string[] = [];

      const light = decls(this.overrides());
      if (light) blocks.push(`:root {${NL}${light}${NL}}`);

      const dark = decls(this.darkOverrides());
      if (dark) blocks.push(`:root[data-theme='dark'],${NL}.tx-theme-dark {${NL}${dark}${NL}}`);

      const css = blocks.join(NL + NL);
      this.styleEl ??= document.head.appendChild(document.createElement('style'));
      this.styleEl.textContent = css;
      this.emitted.set(css);
    });
  }

  toggleMode(): void {
    this.mode.update((m) => (m === 'light' ? 'dark' : 'light'));
  }

  setOverride(name: string, value: string): void {
    this.overrides.update((current) => ({ ...current, [name]: value }));
  }

  setDarkOverride(name: string, value: string): void {
    this.darkOverrides.update((current) => ({ ...current, [name]: value }));
  }

  resetOverrides(): void {
    this.overrides.set({});
    this.darkOverrides.set({});
  }

  get hasOverrides(): boolean {
    return (
      Object.values(this.overrides()).some(Boolean) ||
      Object.values(this.darkOverrides()).some(Boolean)
    );
  }
}
