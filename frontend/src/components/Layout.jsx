import { NavLink, Outlet } from 'react-router-dom';

const tabBase =
  'whitespace-nowrap rounded-lg px-space-md py-space-sm font-label-lg text-label-lg transition-colors';
const tabActive = 'bg-primary-container text-on-primary font-bold';
const tabIdle = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';

const navClass = ({ isActive }) => `${tabBase} ${isActive ? tabActive : tabIdle}`;

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-body-md text-body-md text-on-surface">
      <header className="sticky top-0 z-50 w-full bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-[1120px] items-center gap-space-sm px-gutter sm:px-gutter-desktop">
          <span className="material-symbols-outlined text-[28px] text-primary" aria-hidden="true">
            spa
          </span>
          <span className="font-headline-sm text-headline-sm tracking-tight text-primary">CuidAR</span>
        </div>
        <div className="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="mx-auto max-w-[1120px] px-gutter sm:px-gutter-desktop">
            <nav aria-label="Secciones" className="flex items-center gap-space-xs overflow-x-auto py-space-xs">
              <NavLink to="/medicaciones" className={navClass}>
                Vademécum
              </NavLink>
              <NavLink to="/personas" className={navClass}>
                Ficha de Elsa
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-gutter py-space-xl sm:px-gutter-desktop">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
