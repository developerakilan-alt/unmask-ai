---
version: "alpha"
name: "Nexus — Intelligence That Scales"
description: "A cinematic AI-native landing page with animated WebGL light fields and refined product storytelling."
colors:
  primary: "#14B8A6"
  secondary: "#000000"
  tertiary: "#0F5AC8"
  neutral: "#000000"
  background: "#000000"
  surface: "#F1F5F9"
  text-primary: "#F1F5F9"
  text-secondary: "#171717"
  border: "#FFFFFF"
  accent: "#14B8A6"
typography:
  display-lg:
    fontFamily: "Geist"
    fontSize: "72px"
    fontWeight: 300
    lineHeight: "72px"
    letterSpacing: "-0.05em"
  body-md:
    fontFamily: "Geist"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: "21px"
  label-md:
    fontFamily: "Geist"
    fontSize: "10.5px"
    fontWeight: 600
    lineHeight: "15px"
rounded:
  md: "9px"
spacing:
  base: "6px"
  sm: "3px"
  md: "6px"
  lg: "12px"
  xl: "21px"
  gap: "9px"
  section-padding: "57px"
components:
  button-primary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0px"
  button-link:
    textColor: "{colors.surface}"
    rounded: "0px"
    padding: "0px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Open
  - Grid: Strong

## Colors

The color system uses dark mode with #14B8A6 as the main accent and #000000 as the neutral foundation.

- **Primary (#14B8A6):** Main accent and emphasis color.
- **Secondary (#000000):** Supporting accent for secondary emphasis.
- **Tertiary (#0F5AC8):** Reserved accent for supporting contrast moments.
- **Neutral (#000000):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #000000; Surface: #F1F5F9; Text Primary: #F1F5F9; Text Secondary: #171717; Border: #FFFFFF; Accent: #14B8A6

## Typography

Typography relies on Geist across display, body, and utility text.

- **Display (`display-lg`):** Geist, 72px, weight 300, line-height 72px, letter-spacing -0.05em.
- **Body (`body-md`):** Geist, 13.5px, weight 600, line-height 21px.
- **Labels (`label-md`):** Geist, 10.5px, weight 600, line-height 15px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 6px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 6px
- **Scale:** 3px, 6px, 12px, 21px, 24px, 30px, 36px, 66px
- **Section padding:** 57px
- **Gaps:** 9px, 12px, 15px, 30px

## Elevation & Depth

Depth is communicated through elevated, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as elevated first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Elevated
- **Borders:** 0.8px #FFFFFF
- **Shadows:** rgba(45, 212, 191, 0.1) 0px 0px 0px 1px inset, rgba(59, 130, 246, 0.18) 0px 0px 32px 0px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 0px padding and a 0px radius. Drive the shell with radial-gradient(circle at 72% 42%, rgba(220, 245, 255, 0.08), rgba(0, 0, 0, 0) 22%), linear-gradient(90deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.92) 30%, rgba(0, 0, 0, 0.48) 58%, rgba(0, 0, 0, 0.18) 100%) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 9px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 9px, 12px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles.

### Buttons
- **Primary:** background #F1F5F9, text #171717, radius 9px, padding 0px, border 0px solid rgb(229, 231, 235).
- **Links:** text #F1F5F9, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 6px rhythm.
- Do reuse the Elevated surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 9px, 12px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 300ms and 500ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on text and color changes. Scroll choreography uses GSAP ScrollTrigger for section reveals and pacing.

**Motion Level:** moderate

**Durations:** 300ms, 500ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** text, color, stroke

**Scroll Patterns:** gsap-scrolltrigger

## WebGL

Reconstruct the graphics as a full-bleed background field using alpha, dpr clamp, custom shaders. The effect should read as technical, meditative, and atmospheric: dot-matrix particle field with black and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** alpha, DPR clamp, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <body class="min-h-screen overflow-x-hidden bg-black text-slate-100 antialiased" style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <main class="relative min-h-screen overflow-hidden bg-black">
          <canvas id="field" aria-hidden="true" class="pointer-events-none absolute inset-0 h-full w-full"></canvas>

          <div aria-hidden="true" class="pointer-events-none absolute…
      ```
