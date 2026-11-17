import { useEffect, useId, useRef } from 'react';

const TONES = {
  danger: {
    icon: 'warning',
    iconWrap: 'bg-error-container text-error',
    confirm: 'bg-error text-on-error hover:bg-error/90',
  },
  primary: {
    icon: 'help',
    iconWrap: 'bg-primary/10 text-primary',
    confirm: 'bg-primary text-on-primary hover:bg-primary-container',
  },
};

/**
 * Modal de confirmación sobre <dialog> nativo.
 * showModal() ya resuelve: foco atrapado, Esc, fondo inerte y top layer (sin z-index).
 * Lo que agregamos a mano: foco inicial en "Cancelar", devolver el foco al cerrar
 * y cerrar con click en el fondo.
 */
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const styles = TONES[tone] ?? TONES.primary;

  // El estado de React manda: open=true abre el modal, open=false lo cierra.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement;
      dialog.showModal();
      // Foco inicial en la opción segura: un Enter apurado no ejecuta la acción destructiva.
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    returnFocusRef.current?.focus?.();
    returnFocusRef.current = null;
  };

  // Esc dispara "cancel": lo frenamos y dejamos que el estado cierre el modal.
  const handleNativeCancel = (event) => {
    event.preventDefault();
    onCancel();
  };

  // El click en el fondo llega al <dialog> mismo; el contenido está en un div interno.
  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleNativeCancel}
      onClose={handleClose}
      onClick={handleBackdropClick}
      className="m-0 mt-auto w-full max-w-full rounded-t-xl bg-surface-container-lowest p-0 text-on-surface shadow-[0_20px_35px_-5px_rgba(15,23,42,0.12)] transition-[opacity,translate] duration-200 backdrop:bg-inverse-surface/35 backdrop:backdrop-blur-[4px] starting:open:translate-y-4 starting:open:opacity-0 motion-reduce:transition-none sm:m-auto sm:max-w-md sm:rounded-xl"
    >
      <div className="flex flex-col gap-space-lg p-space-lg font-body-md text-body-md sm:p-space-xl">
        <div className="flex items-start gap-space-md">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-[24px]">{styles.icon}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-space-xs">
            <h2 id={titleId} className="font-headline-sm text-headline-sm text-on-surface">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="font-body-md text-body-md text-on-surface-variant">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-lg px-space-lg font-label-lg text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-12 rounded-lg px-space-xl font-label-lg text-label-lg shadow-xs transition-colors ${styles.confirm}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
