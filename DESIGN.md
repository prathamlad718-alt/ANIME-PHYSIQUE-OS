---
name: Kinetic Obsidian
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393e'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b20'
  surface-container: '#1e1f24'
  surface-container-high: '#292a2e'
  surface-container-highest: '#343439'
  on-surface: '#e3e2e8'
  on-surface-variant: '#e4beba'
  inverse-surface: '#e3e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#ab8986'
  outline-variant: '#5b403e'
  surface-tint: '#ffb3ad'
  primary: '#ffb3ad'
  on-primary: '#68000a'
  primary-container: '#ff5451'
  on-primary-container: '#5c0008'
  inverse-primary: '#b91a24'
  secondary: '#a5e7ff'
  on-secondary: '#003543'
  secondary-container: '#00d2ff'
  on-secondary-container: '#00566a'
  tertiary: '#69d8d4'
  on-tertiary: '#003736'
  tertiary-container: '#24a09d'
  on-tertiary-container: '#00302e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930013'
  secondary-fixed: '#b6ebff'
  secondary-fixed-dim: '#47d6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#87f4f0'
  tertiary-fixed-dim: '#69d8d4'
  on-tertiary-fixed: '#00201f'
  on-tertiary-fixed-variant: '#00504e'
  background: '#121318'
  on-background: '#e3e2e8'
  surface-variant: '#343439'
typography:
  display-hero:
    fontFamily: Sora
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Sora
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  metric-numeral-xl:
    fontFamily: Sora
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  metric-numeral-md:
    fontFamily: Sora
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system synthesizes high-performance athletic anime dynamism with the spatial discipline of visionOS-grade glassmorphism. It targets athletes, hyper-focused lifters, and digital-first performers pursuing peak physical transformation through a gamified, cinematic, and data-dense lens.

The experience evokes hyper-focus, technological precision, and intense physical activation. The UI avoids gimmicky tropes, relying instead on clean, aerodynamic typography, refractive glass surfaces, and intense atmospheric energy emissions.

### Design Movement: Spatial Glassmorphism & High-Energy Precision
- **Translucent Layering:** Frosted glass panels suspended in deep space, capturing dynamic light refraction without sacrificing data clarity.
- **Atmospheric Aura Blooms:** Crimson core pulses coupled with secondary ambient cyan halos, conveying explosive physical exertion, recovery states, and biomechanical precision.
- **Aerodynamic Ergonomics:** Continuous curvature and pill geometry create frictionless, thumb-first control surfaces engineered for high-intensity training sessions.

## Colors

The palette operates in high-contrast optical space, grounded by a deep obsidian void that allows luminous energetic states to cut through with absolute clarity.

### Functional Palette
- **Canvas Base (`#07080C`):** Ultra-deep spatial obsidian; absorbs visual noise to maximize perceptual contrast of suspended glass surfaces.
- **Primary — Crimson Aura (`#EF4444`):** Represents max heart rate, failure sets, peak activation, critical alerts, and primary interactive commitments.
- **Secondary — Biomechanical Cyan (`#00D2FF`):** Conveys precision tracking, cognitive equilibrium, aerobic thresholds, and secondary metrics.
- **Glass Specular (`rgba(255, 255, 255, 0.12)`): Crisp top-lit highlight simulating optical lens edges.
- **Glass Substrate (`rgba(255, 255, 255, 0.06)`): Low-density neutral frosted backdrop ensuring high text contrast against blurred background emitters.
- **Text Tiers:** Primary text utilizes crisp `#FFFFFF` (100% optical opacity), secondary data runs on `#94A3B8` (desaturated cold slate), and tertiary metadata rests at `#64748B`.

## Typography

Typography pairs aerodynamic tension with high-density legibility.

- **Headline Hierarchy (`Sora`):** Imparts futuristic, angular geometry reminiscent of athletic anime title cards and HUD instrumentation. Headlines above 24px apply negative tracking to tighten spatial volume.
- **Body & Instrumentation (`Hanken Grotesk`):** Provides razor-sharp, low-distortion clarity across high-speed mobile scanning.
- **Tabular Numerics:** All numerals within biometric panels, reps/weight counters, and clocks must enable OpenType tabular figures (`font-variant-numeric: tabular-nums;`) to prevent layout shifts during live readouts.
- **Labeling:** Micro-labels utilize upper-case formatting with generous tracking (`0.08em`) to guarantee immediate glanceability during athletic exertion.

## Layout & Spacing

The layout is built upon an 8pt modular grid with fluid column adaptations:
- **Mobile (< 768px):** 4-column layout with `1rem` margins and `1rem` gutters. Floating primary controls anchor cleanly to the bottom safe area.
- **Tablet (768px - 1024px):** 8-column layout with `2rem` margins and `1.25rem` gutters.
- **Desktop (> 1024px):** 12-column layout with max-width container set to `1280px` with `3rem` margins to emulate expansive floating spatial canvases.

Component spacing scales strictly from internal pill paddings (`space-xs`, `space-sm`) to structural card groupings (`space-md`, `space-lg`), ensuring negative space allows the deep obsidian background and luminous energy glows to breathe.

## Elevation & Depth

Visual hierarchy is maintained through optical transmission, refractive boundaries, and chromatic back-glows rather than traditional drop shadows.

### Glassmorphism & Tonal Levels
- **Level 0 (Atmospheric Void):** Pure `#07080C` backplane featuring ambient Radial Gradients (`blur(120px)`) emitting Crimson (`#EF4444` at 18% opacity) and Cyan (`#00D2FF` at 15% opacity).
- **Level 1 (Structural Cards):** Backplate of `rgba(255, 255, 255, 0.06)` with backdrop blur `24px`. Rimmed by a 1px border gradient transitioning from `rgba(255, 255, 255, 0.16)` at the top edge to `rgba(255, 255, 255, 0.04)` at the bottom edge.
- **Level 2 (Active Plates & Overlays):** Backplate of `rgba(255, 255, 255, 0.10)` with backdrop blur `32px`, bordered by `rgba(255, 255, 255, 0.22)`.
- **Level 3 (Floating HUD / Pill Dock):** Suspended above all content with backdrop blur `40px`, saturated specular perimeter border, and a subtle ground drop shadow: `0 20px 40px rgba(0, 0, 0, 0.60), 0 0 24px rgba(239, 68, 68, 0.12)`.

## Shapes

The shape vocabulary uses smooth, continuous curvature (squircle geometry) that bridges tactile physical glass with futuristic vehicle cockpit surfaces.

- **Micro Elements & Pills:** Badges, chips, buttons, and bottom control docks use full pill geometry (`roundedness: 3` / `9999px` border radius).
- **Data Volumes & Containers:** Large cards, HUD meters, and workout metrics panels use `rounded-lg` (equivalent to `1.25rem` to `1.375rem` / `20px - 22px`) to maintain physical glass coherence without clipping high-density typography.

## Components

### Buttons
- **Primary Pill (Ignition / Max Effort):** Solid Crimson gradient fill (`linear-gradient(135deg, #EF4444, #DC2626)`) with `1px` inner specular white edge. Shadow: `0 0 20px rgba(239, 68, 68, 0.45)`. Text is pure bold white Sora.
- **Secondary Glass Pill:** Frosted glass (`rgba(255, 255, 255, 0.08)`), backdrop blur `20px`, `1px` border `rgba(255, 255, 255, 0.14)`. Hover initiates a cyan border glow (`rgba(0, 210, 255, 0.40)`).

### Chips & Stat Badges
- Pill-shaped badges (`roundedness: 3`) with compact padding (`0.25rem 0.75rem`).
- State-driven: Recovery mode utilizes secondary Cyan glow (`rgba(0, 210, 255, 0.12)` fill with cyan text); Overdrive mode utilizes primary Crimson glow (`rgba(239, 68, 68, 0.15)` fill with crimson text).

### Floating Frosted Bottom Dock
- Anchored 16px above the device home indicator. Pill silhouette (`border-radius: 9999px`), frosted glass backplate (`backdrop-filter: blur(36px)`), specular edge border `rgba(255, 255, 255, 0.15)`.
- Houses primary tactile navigation icons that pulse with Crimson aura upon active selection.

### Cards & Workout Trackers
- Glassmorphic panels with `20px` corner radii.
- Specular top border highlighting mimicking Apple visionOS window fixtures. 
- Integrated tabular metrics display with clear hierarchy: large display numbers in Sora with micro uppercase category descriptors in Hanken Grotesk.

### Inputs & Sliders
- Input fields use inset pill styling with a darker frosted trench (`rgba(0, 0, 0, 0.40)`), illuminated by a crisp `1px` focus ring in Crimson or Cyan.
- Sliders feature glowing circular or pill thumbs radiating soft ambient blur across the track.