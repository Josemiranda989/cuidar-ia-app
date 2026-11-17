/**
 * Spinner hecho con CSS (no con la fuente de íconos): se ve aunque Material Symbols
 * todavía no haya cargado. Hereda el color del texto (border-current).
 * Es decorativo: el texto que lo acompaña es el que comunica el estado.
 */
function Spinner({ className = 'size-4' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none ${className}`}
    />
  );
}

export default Spinner;
