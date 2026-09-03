import { InjectionToken, Provider, inject } from '@angular/core';

/** Vertical rhythm applied to controls, table rows and cell padding. */
export type TxDensity = 'compact' | 'standard' | 'comfortable';

/**
 * Application-wide defaults for the design system.
 *
 * Every field is optional; anything omitted falls back to
 * {@link TX_DEFAULT_DESIGN_SYSTEM_CONFIG}. Provide it once at bootstrap with
 * {@link provideTxDesignSystem}.
 */
export interface TxDesignSystemConfig {
  /** Default density for components that support it. */
  readonly density: TxDensity;
  /** How wide an overlay panel opens relative to its trigger. */
  readonly panelWidth: 'trigger' | 'auto';
  /** Page-size choices offered by table pagination. */
  readonly pageSizeOptions: readonly number[];
  /** Initial page size for tables. */
  readonly pageSize: number;
  /**
   * Number of options above which a select shows its filter field
   * automatically. Set to `Infinity` to never show it by default.
   */
  readonly filterThreshold: number;
  /** Chips rendered before a multi-select collapses the rest into "+N more". */
  readonly maxVisibleChips: number;
}

export const TX_DEFAULT_DESIGN_SYSTEM_CONFIG: TxDesignSystemConfig = {
  density: 'standard',
  panelWidth: 'trigger',
  pageSizeOptions: [10, 25, 50, 100],
  pageSize: 25,
  filterThreshold: 8,
  maxVisibleChips: 3,
};

export const TX_DESIGN_SYSTEM_CONFIG = new InjectionToken<TxDesignSystemConfig>(
  'TX_DESIGN_SYSTEM_CONFIG',
  { providedIn: 'root', factory: () => TX_DEFAULT_DESIGN_SYSTEM_CONFIG },
);

/**
 * Registers design-system defaults.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideTxDesignSystem({ density: 'compact' })],
 * });
 * ```
 */
export function provideTxDesignSystem(config: Partial<TxDesignSystemConfig> = {}): Provider {
  return {
    provide: TX_DESIGN_SYSTEM_CONFIG,
    useValue: { ...TX_DEFAULT_DESIGN_SYSTEM_CONFIG, ...config },
  };
}

/** Reads the merged config. For use inside component field initialisers. */
export function injectTxConfig(): TxDesignSystemConfig {
  return inject(TX_DESIGN_SYSTEM_CONFIG);
}
