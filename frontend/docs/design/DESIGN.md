---
name: Serena Cuidados
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#3e4947'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0d766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#7fd5cc'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#7d4200'
  on-tertiary: '#ffffff'
  tertiary-container: '#a05600'
  on-tertiary-container: '#ffe5d3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9bf2e8'
  primary-fixed-dim: '#7fd5cc'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  time-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for primary family caregivers navigating chronic care, medication routines, and elder support under emotional and cognitive load. The personality balances deep clinical reliability with domestic warmth, empathy, and clarity. It replaces clinical anxiety with grounded reassurance.

The visual direction blends **Warm Human Minimalism** with **Tactile Clarity**:
- **Tone:** Reassuring, patient, protective, clear, and dignified.
- **Atmosphere:** Clean, open spaces reminiscent of serene morning light, removing visual clutter to reduce error rates during critical dosing tasks.
- **Language & Culture:** Natural Argentine and Latin American Spanish phrasing ("Hoy", "Medicación de Elsa", "Tomas del día", "Ficha médica", "Registrar toma") crafted to sound companionable rather than cold or institutional.
- **Cognitive Ergonomics:** Generous padding, unambiguous states, and prominent confirmation cues designed specifically for users managing urgent or tiring eldercare routines.

## Colors

The palette establishes an emotional sanctuary: restful herbal teals, soft earthen foundations, and unambiguous functional markers.

- **Primary (`#0D766E`) & Primary Interactive (`#14B8A6`):** Deep oceanic sage and calm teal. Conveys steady medical rigor, precision, and emotional calm without the stark chill of hospital cyan.
- **Canvas & Surfaces:**
  - Base background: `#FBFBFA` (warm porcelain cream) preventing eye strain during nocturnal or dawn medication checks.
  - Secondary containers: `#F4F6F4` (subtle moss-tinted cream) providing soft contrast against the pure white interactive cards (`#FFFFFF`).
- **Typography & Neutrals (`#1E293B`, `#334155`):** Deep charcoal slate yielding optimal contrast ratios (> 7:1) over cream surfaces for fatigue-free reading. Muted labels rest at `#64748B`.
- **Status & Feedback Accents:**
  - *Tomado / Confirmado:* Soft Emerald (`#059669` text on `#ECFDF5` container).
  - *Pendiente / Próximo:* Warm Amber (`#D97706` text on `#FEF3C7` container).
  - *Omitido / Alerta / Urgente:* Soft Coral (`#E11D48` text on `#FFF1F2` container).
- **Printable Medical Sheet Mode:** Retains pure monochromatic borders (`#CBD5E1`) and high-density ink slate (`#0F172A`) for reliable clinical printing and doctor visits.

## Typography

`Plus Jakarta Sans` is selected for its humanist geometry, open counter spaces, and distinct letterforms, preventing misread numerals during critical medication dosing.

- **Generous Vertical Metrics:** Line heights exceed standard web baselines by 10-15% to safeguard reading ease for caregivers under stress or with age-related presbyopia.
- **Numerals & Time Indicators:** Time markings (e.g., "08:00 hs", "1 comprimido") employ tabular formatting and prominent semi-bold/bold weights to guarantee immediate recognition at an arm's distance.
- **Hierarchy Rules:** Section headings are conversational and direct (e.g., "Mañana", "Tarde", "Noche"). Prescription details, dosages, and contraindications avoid uppercase or compressed styles, ensuring no detail is obscured.

## Layout & Spacing

A mobile-first fluid container model ensures effortless one-handed thumb interaction when holding prescriptions or water glasses in the other hand.

- **Grid Architecture:**
  - **Mobile (<640px):** Single column flow with `1rem` edge gutters. All primary action zones (e.g., "Registrar toma") fall within the lower 40% thumb zone.
  - **Tablet (641px–1024px):** 6-column grid with `1.25rem` gutters, segregating chronological daily timeline logs from patient overview cards.
  - **Desktop / Printable Sheet (>1024px):** 12-column structured view with max-width `1120px`. The daily intake timeline rests comfortably in an 8-column main region, while care notes, contacts, and quick-call doctors occupy a 4-column side pane.
- **Rhythm & Touch Standards:** Touch targets maintain a minimum dimension of `48px` (preferred `56px` for primary toggles). Spacing between grouped doses uses `space-md` (`1rem`), while separate day sections (Mañana, Tarde, Noche) breathe with `space-xl` (`2rem`).

## Elevation & Depth

To preserve an organic, soothing feel, visual elevation relies on subtle tonal layering supplemented by warm, extra-diffused ambient shadows rather than harsh drop shadows.

- **Level 0 (Base Canvas):** `#FBFBFA` flat background.
- **Level 1 (Card Surfaces):** Solid `#FFFFFF` card containers bordered with a 1px hairline stroke (`#E2E8F0` at 70% opacity) coupled with an ambient shadow: `box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Active / Focus Dose Card):** Subtle lift using teal-tinted ambient depth: `box-shadow: 0 10px 25px -4px rgba(13, 118, 110, 0.08), 0 4px 10px -2px rgba(13, 118, 110, 0.03)` with a soft teal accent bar on the left edge.
- **Level 3 (Modals, Action Drawers & Bottom Sheets):** `box-shadow: 0 20px 35px -5px rgba(15, 23, 42, 0.12)` over a warm blurred scrim (`rgba(30, 41, 59, 0.35)` with `backdrop-filter: blur(4px)`).
- **Print / Ficha Médica Override:** In printable formats, all shadows collapse to 0 and borders render as crisp 1px solid slate lines (`#CBD5E1`) for high-contrast paper clarity.

## Shapes

The interface embraces organic, friendly contours (`roundedness: 2` with extended curves on primary cards), projecting approachability and physical safety.

- **Dose & Medication Cards:** Feature `1.25rem` (`rounded-2xl`) corners to soften layout geometry.
- **Interactive Buttons:** `rounded-xl` (`0.75rem` to `1rem`) providing comfortable tap boundaries.
- **Badges, Status Chips & Pill Counters:** Full pill shapes (`rounded-full` / `9999px`) highlighting temporal status ("8:00 hs", "Antes del desayuno", "Tomada").
- **Sheet Modal & Bottom Drawers:** Top edges curve with a welcoming `1.5rem` radius.

## Components

### Buttons & Quick Actions
- **Primary ("Registrar toma"):** Full-width on mobile (`56px` height), background `#0D766E`, text `#FFFFFF`, font weight semi-bold (`16px`). Hover/active states transition to `#115E59`.
- **Secondary ("Posponer 15 min"):** Soft background `#F0FDFA`, text `#0D766E`, border `1px solid #CCFBF1`.
- **Destructive / Alert ("Omitir dosis"):** Soft rose background `#FFF1F2`, text `#E11D48`.

### Medication & Timeline Cards
- **Structure:** White card container housing a left-aligned vertical status pill, prominent time indicator (`time-display`), medication brand name, generic chemical name, and dose metric (e.g., "Losartán 50 mg • 1 comprimido").
- **Dose Confirmation Mechanism:** Dual interaction featuring a prominent tap button ("Confirmar toma") and an expansive toggle checkbox for rapid daily validation.

### Chips & Badges
- **Pill Badges:** Composed of an icon paired with micro-copy:
  - *Tomada:* Green check icon, `#ECFDF5` background, `#047857` label.
  - *Pendiente:* Clock icon, `#FEF3C7` background, `#B45309` label.
  - *Omitida:* Exclamation circle icon, `#FFF1F2` background, `#BE123C` label.

### Form Inputs & Selectors
- **Field Ergonomics:** Minimum height `52px`, background `#FFFFFF`, border `1.5px solid #CBD5E1`. On focus: `border-color: #0D766E` with a subtle focus halo (`rgba(20, 184, 166, 0.2)`).
- **Labels & Helper Text:** Prominent persistent label above the field in `#1E293B` (`label-md`), with humanized placeholder copy (e.g., "Ej. Gotas con el almuerzo").

### Printable Clinical Sheet ("Ficha Médica para el Doctor")
- **Layout:** High-density, high-contrast, black-and-white optimized view displaying patient metadata (Elsa, 81 años), emergency contacts, active diagnoses, and a matrix of current medications, schedules, and prescriber notes.
- **Visuals:** Clean rules (`1px solid #94A3B8`), devoid of background fills, ensuring legibility on home inkjet and laser printers.