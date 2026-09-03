import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  Injector,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TxIcon } from '../icon/icon';

export type TxToastKind = 'success' | 'error' | 'warning' | 'info';
export type TxToastPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'top' | 'bottom';

export interface TxToastOptions {
  /** Milliseconds before auto-dismiss. `0` keeps it until dismissed. */
  readonly duration?: number;
  /** Label for a single action button. */
  readonly action?: string;
  /** Called when the action is pressed. */
  readonly onAction?: () => void;
  /** Overrides the default politeness for this message. */
  readonly ariaLive?: 'polite' | 'assertive';
}

export interface TxToast {
  readonly id: number;
  readonly kind: TxToastKind;
  readonly message: string;
  readonly action?: string;
  readonly onAction?: () => void;
  readonly ariaLive: 'polite' | 'assertive';
}

const ICONS: Record<TxToastKind, string> = {
  success: 'check',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const DEFAULT_DURATION: Record<TxToastKind, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  // Errors stay until dismissed: the one message you must not miss should not
  // time out while you are reading something else.
  error: 0,
};

let nextId = 0;

/**
 * Shows transient messages.
 *
 * Service-driven — the consumer never places a component. The first call
 * creates a single overlay region that every later toast stacks into, so
 * position and z-order are decided once.
 *
 * ```ts
 * toast.success('Item saved');
 * toast.error('Could not reach the server', { action: 'Retry', onAction: () => retry() });
 * ```
 *
 * ### Announcements
 * Errors are announced assertively, everything else politely. That mapping is
 * the default rather than a per-call decision because getting it wrong is how
 * screen-reader users end up interrupted by "saved" while typing.
 */
@Injectable({ providedIn: 'root' })
export class TxToastService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  private overlayRef: OverlayRef | null = null;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  /** The live stack. Read by the region component. */
  readonly toasts = signal<readonly TxToast[]>([]);
  readonly position = signal<TxToastPosition>('bottom-end');

  success(message: string, options?: TxToastOptions): number {
    return this.show('success', message, options);
  }
  error(message: string, options?: TxToastOptions): number {
    return this.show('error', message, options);
  }
  warning(message: string, options?: TxToastOptions): number {
    return this.show('warning', message, options);
  }
  info(message: string, options?: TxToastOptions): number {
    return this.show('info', message, options);
  }

  show(kind: TxToastKind, message: string, options: TxToastOptions = {}): number {
    this.ensureRegion();

    const id = nextId++;
    const toast: TxToast = {
      id,
      kind,
      message,
      action: options.action,
      onAction: options.onAction,
      ariaLive: options.ariaLive ?? (kind === 'error' ? 'assertive' : 'polite'),
    };

    this.toasts.update((current) => [...current, toast]);

    const duration = options.duration ?? DEFAULT_DURATION[kind];
    if (duration > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), duration),
      );
    }
    return id;
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.toasts.set([]);
  }

  /** Creates the overlay region once, on first use. */
  private ensureRegion(): void {
    if (this.overlayRef) return;

    this.overlayRef = this.overlay.create({
      // Toasts must not block the page: the region ignores pointer events and
      // each toast re-enables them for itself.
      hasBackdrop: false,
      positionStrategy: this.overlay.position().global(),
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      panelClass: 'tx-toast__panel',
    });

    this.overlayRef.attach(new ComponentPortal(TxToastRegion, null, this.injector));
  }
}

/** Renders the toast stack. Attached to its overlay by the service. */
@Component({
  selector: 'tx-toast-region',
  standalone: true,
  imports: [TxIcon],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tx-toast-region',
    '[attr.data-position]': 'toasts.position()',
  },
})
export class TxToastRegion {
  protected readonly toasts = inject(TxToastService);
  protected readonly dismissLabel = $localize`:@@tx.toast.dismiss:Dismiss`;

  protected readonly items = computed(() => this.toasts.toasts());

  protected icon(kind: TxToastKind): string {
    return ICONS[kind];
  }

  protected act(toast: TxToast): void {
    toast.onAction?.();
    this.toasts.dismiss(toast.id);
  }
}
