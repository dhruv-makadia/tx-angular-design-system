import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  TemplateRef,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TxButton } from '../button/button';
import { TxIcon } from '../icon/icon';

/** Options accepted by {@link TxDialogService.open}. */
export interface TxDialogOptions<D = unknown> {
  readonly data?: D;
  /** Accessible name for the dialog. Set one unless the content supplies a heading. */
  readonly ariaLabel?: string;
  readonly width?: string;
  readonly maxWidth?: string;
  /** Clicking the scrim or pressing Escape closes. Off for destructive flows. */
  readonly dismissable?: boolean;
  readonly panelClass?: string | string[];
}

export interface TxConfirmOptions {
  readonly title: string;
  readonly message?: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Styles the confirm action as destructive and gives it the danger variant. */
  readonly danger?: boolean;
}

/**
 * Opens dialogs.
 *
 * Service-driven rather than a component the consumer places, because a dialog
 * is an event in a flow, not part of a page's structure — and placing it in the
 * template makes it that page's problem to position, trap focus in, and clean
 * up. The CDK handles the overlay, focus trap, scroll blocking and restore.
 *
 * ```ts
 * const ref = dialog.open(EditItemDialog, { data: { id }, width: '32rem' });
 * const saved = await ref.result;   // typed
 *
 * if (await dialog.confirm({ title: 'Delete this item?', danger: true })) { … }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class TxDialogService {
  private readonly cdkDialog = inject(Dialog);

  /**
   * Opens a component or template as a dialog.
   *
   * `R` is the result type; `D` the data passed in. Inject the data with
   * `inject(TX_DIALOG_DATA)` and close with `inject(TxDialogRef).close(result)`.
   */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    options: TxDialogOptions<D> = {},
  ): TxDialogRef<R> {
    const dismissable = options.dismissable ?? true;

    const ref = this.cdkDialog.open<R, D, C>(content, {
      data: options.data,
      ariaLabel: options.ariaLabel,
      width: options.width ?? '30rem',
      maxWidth: options.maxWidth ?? 'calc(100vw - 2rem)',
      disableClose: !dismissable,
      hasBackdrop: true,
      backdropClass: 'tx-dialog__scrim',
      panelClass: ['tx-dialog__panel', ...toArray(options.panelClass)],
      // The trigger is usually a button; returning focus to it is what makes
      // keyboard use bearable.
      restoreFocus: true,
      autoFocus: 'first-tabbable',
    });

    return new TxDialogRef<R>(ref as DialogRef<R, unknown>);
  }

  /**
   * A yes/no dialog. Resolves `true` only if the user confirmed — dismissing by
   * any route resolves `false`, so the caller never has to check for undefined.
   */
  async confirm(options: TxConfirmOptions): Promise<boolean> {
    const ref = this.open<boolean, TxConfirmOptions, TxConfirmDialog>(TxConfirmDialog, {
      data: options,
      ariaLabel: options.title,
      width: '26rem',
    });
    return (await ref.result) === true;
  }
}

/** Handle on an open dialog. */
export class TxDialogRef<R = unknown> {
  constructor(private readonly ref: DialogRef<R, unknown>) {}

  /** Resolves with the result, or `undefined` if the dialog was dismissed. */
  get result(): Promise<R | undefined> {
    return firstValueFrom(this.ref.closed);
  }

  close(result?: R): void {
    this.ref.close(result);
  }
}

/** Injection token for the data passed to a dialog. */
export const TX_DIALOG_DATA = DIALOG_DATA;

/**
 * Layout for dialog content: title, body, actions.
 *
 * Presentational only — put it inside your own dialog component so every
 * dialog in the app has the same shape.
 *
 * ```html
 * <tx-dialog heading="Edit item" subtitle="CB-1042">
 *   <p>…</p>
 *   <div slot="actions">
 *     <tx-button variant="text" (activated)="ref.close()">Cancel</tx-button>
 *     <tx-button variant="filled" (activated)="ref.close(value)">Save</tx-button>
 *   </div>
 * </tx-dialog>
 * ```
 */
@Component({
  selector: 'tx-dialog',
  standalone: true,
  imports: [TxIcon],
  template: `
    <div class="tx-dialog__header">
      <div class="tx-dialog__heading">
        <h2 class="tx-dialog__title">{{ heading() }}</h2>
        @if (subtitle()) {
          <p class="tx-dialog__subtitle">{{ subtitle() }}</p>
        }
      </div>
      @if (dismissable()) {
        <button
          type="button"
          class="tx-dialog__close"
          [attr.aria-label]="closeLabel"
          (click)="dismissed.emit()"
        >
          <tx-icon name="close" size="sm" />
        </button>
      }
    </div>

    <div class="tx-dialog__body"><ng-content /></div>

    <div class="tx-dialog__actions"><ng-content select="[slot=actions]" /></div>
  `,
  styleUrl: './dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tx-dialog' },
})
export class TxDialog {
  readonly heading = input.required<string>();
  readonly subtitle = input<string>('');
  readonly dismissable = input(true, { transform: booleanAttribute });
  readonly closeLabel = $localize`:@@tx.dialog.close:Close`;

  readonly dismissed = output<void>();
}

/** The dialog behind {@link TxDialogService.confirm}. */
@Component({
  standalone: true,
  imports: [TxDialog, TxButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tx-dialog [heading]="data.title" (dismissed)="ref.close(false)">
      @if (data.message) {
        <p class="tx-confirm__message">{{ data.message }}</p>
      }
      <div slot="actions">
        <tx-button variant="text" (activated)="ref.close(false)">
          {{ data.cancelLabel ?? cancelLabel }}
        </tx-button>
        <tx-button [variant]="data.danger ? 'danger' : 'filled'" (activated)="ref.close(true)">
          {{ data.confirmLabel ?? confirmLabel }}
        </tx-button>
      </div>
    </tx-dialog>
  `,
  styles: [
    `
      .tx-confirm__message {
        margin: 0;
        color: var(--tx-color-on-surface-muted);
      }
    `,
  ],
})
export class TxConfirmDialog {
  protected readonly data = inject<TxConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly confirmLabel = $localize`:@@tx.dialog.confirm:Confirm`;
  protected readonly cancelLabel = $localize`:@@tx.dialog.cancel:Cancel`;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
