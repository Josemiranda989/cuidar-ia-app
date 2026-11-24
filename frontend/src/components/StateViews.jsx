import { Link } from 'react-router-dom';
import Spinner from './Spinner';

// Piezas compartidas por las páginas para los estados de carga, error y "falta una persona".

export function PageLoading({ label }) {
  return (
    <div
      role="status"
      className="flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-lg font-body-md text-body-md text-on-surface-variant"
    >
      <Spinner className="size-4 text-primary" />
      {label}
    </div>
  );
}

export function PageError({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-space-md rounded-xl bg-error-container p-space-lg font-body-md text-body-md text-on-error-container sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-space-sm">
        <span className="material-symbols-outlined shrink-0 text-[22px] text-error" aria-hidden="true">
          error
        </span>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-12 shrink-0 items-center gap-space-xs rounded-lg bg-error px-space-lg font-label-lg text-label-lg text-on-error transition-colors hover:bg-error/90"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            refresh
          </span>
          Reintentar
        </button>
      )}
    </div>
  );
}

// Hoy, Vademécum y la Ficha médica necesitan una persona seleccionada.
export function NoPersona() {
  return (
    <div className="flex flex-col items-center gap-space-md rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-space-xl text-center font-body-md text-body-md text-on-surface-variant">
      <span className="material-symbols-outlined text-[36px] text-outline" aria-hidden="true">
        person_add
      </span>
      <p>Todavía no hay personas a cargo. Cargá la primera para empezar.</p>
      <Link
        to="/personas"
        className="inline-flex min-h-12 items-center gap-space-xs rounded-lg bg-primary px-space-lg font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container"
      >
        Cargar persona a cargo
      </Link>
    </div>
  );
}
