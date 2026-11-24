import { NavLink, Outlet } from 'react-router-dom';
import { firstName, useCurrentPersona } from '../context/CurrentPersonaContext';

const tabBase =
  'whitespace-nowrap rounded-lg px-space-md py-space-sm font-label-lg text-label-lg transition-colors';
const tabActive = 'bg-primary-container text-on-primary font-bold';
const tabIdle = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';

const navClass = ({ isActive }) => `${tabBase} ${isActive ? tabActive : tabIdle}`;

function PersonaSelector() {
  const { personas, currentPersona, setCurrentPersonaId, loading } = useCurrentPersona();

  if (loading || personas.length === 0) return null;

  return (
    <label className="flex min-w-0 items-center gap-space-xs rounded-full bg-surface-container py-space-xs pl-space-md pr-space-sm shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
        favorite
      </span>
      <span className="hidden font-label-md text-label-md text-on-surface-variant sm:inline">
        Cuidando a:
      </span>
      <select
        aria-label="Persona a cargo"
        value={currentPersona?.id ?? ''}
        onChange={(event) => setCurrentPersonaId(event.target.value)}
        className="min-w-0 max-w-48 cursor-pointer truncate rounded-full bg-transparent py-1 font-label-md text-label-md text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/40 sm:max-w-64"
      >
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.nombre_completo} ({persona.edad} años)
          </option>
        ))}
      </select>
    </label>
  );
}

function Layout() {
  const { currentPersona } = useCurrentPersona();
  const fichaLabel = currentPersona ? `Ficha de ${firstName(currentPersona)}` : 'Ficha de la persona';

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body-md text-body-md text-on-surface print:bg-white">
      <header className="sticky top-0 z-50 w-full bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-20 w-full max-w-[1120px] items-center justify-between gap-space-md px-gutter sm:px-gutter-desktop">
          <div className="flex shrink-0 items-center gap-space-sm">
            <span className="material-symbols-outlined text-[28px] text-primary" aria-hidden="true">
              spa
            </span>
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary">CuidAR</span>
          </div>
          <PersonaSelector />
        </div>
        <div className="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="mx-auto max-w-[1120px] px-gutter sm:px-gutter-desktop">
            <nav aria-label="Secciones" className="flex items-center gap-space-xs overflow-x-auto py-space-xs">
              <NavLink to="/hoy" className={navClass}>
                Hoy
              </NavLink>
              <NavLink to="/medicaciones" className={navClass}>
                Vademécum
              </NavLink>
              <NavLink to="/ficha-medica" className={navClass}>
                Ficha para el Médico
              </NavLink>
              <NavLink to="/personas" className={navClass}>
                {fichaLabel}
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-gutter py-space-xl sm:px-gutter-desktop print:max-w-none print:p-0">
        <Outlet />
      </main>

      <footer className="w-full bg-surface-container-low py-space-lg print:hidden">
        <div className="mx-auto flex max-w-[1120px] items-center justify-center gap-space-sm px-gutter text-center sm:justify-start sm:px-gutter-desktop">
          <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
            spa
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Cuidando con amor y tranquilidad. Cada toma a su debido tiempo.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
