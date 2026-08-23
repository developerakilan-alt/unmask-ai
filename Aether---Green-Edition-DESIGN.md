---
version: "alpha"
name: "Aether - Green Edition"
description: "Aether Green Onboarding Section is designed for building reusable UI components in modern web projects. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for component libraries and responsive product interfaces."
colors:
  primary: "#6EE7B7"
  secondary: "#D1FAE5"
  tertiary: "#10B981"
  neutral: "#000000"
  surface: "#000000"
  text-primary: "#ECFDF5"
  text-secondary: "#D1FAE5"
  border: "#000000"
  accent: "#6EE7B7"
typography:
  display-lg:
    fontFamily: "System Font"
    fontSize: "54px"
    fontWeight: 500
    lineHeight: "54px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "System Font"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: "17.0625px"
  label-md:
    fontFamily: "System Font"
    fontSize: "10.5px"
    fontWeight: 500
    lineHeight: "15px"
rounded:
  full: "9999px"
spacing:
  base: "6px"
  sm: "1px"
  md: "6px"
  lg: "9px"
  xl: "12px"
  gap: "6px"
  card-padding: "9px"
  section-padding: "42px"
components:
  button-primary:
    textColor: "#010804"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "9px"
  card:
    rounded: "12px"
    padding: "18px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Bounded
  - Framing: Open
  - Grid: Strong

## Colors

The color system uses dark mode with #6EE7B7 as the main accent and #000000 as the neutral foundation.

- **Primary (#6EE7B7):** Main accent and emphasis color.
- **Secondary (#D1FAE5):** Supporting accent for secondary emphasis.
- **Tertiary (#10B981):** Reserved accent for supporting contrast moments.
- **Neutral (#000000):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Surface: #000000; Text Primary: #ECFDF5; Text Secondary: #D1FAE5; Border: #000000; Accent: #6EE7B7

- **Gradients:** bg-gradient-to-b from-[#0a1f10] to-[#040d07], bg-gradient-to-b from-[#08170c] to-[#020804], bg-gradient-to-b from-emerald-500/30 to-transparent via-emerald-900/10, bg-gradient-to-b from-[#06140a] to-[#010402]

## Typography

Typography relies on System Font across display, body, and utility text.

- **Display (`display-lg`):** System Font, 54px, weight 500, line-height 54px, letter-spacing -0.025em.
- **Body (`body-md`):** System Font, 10.5px, weight 400, line-height 17.0625px.
- **Labels (`label-md`):** System Font, 10.5px, weight 500, line-height 15px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, bounded structural frame before changing ornament or component styling. Use 6px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / bounded composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Bounded
- **Base unit:** 6px
- **Scale:** 1px, 6px, 9px, 12px, 18px, 21px, 30px, 42px
- **Section padding:** 42px
- **Card padding:** 9px, 18px, 42px
- **Gaps:** 6px, 9px, 12px, 18px

## Elevation & Depth

Depth is communicated through elevated, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as elevated first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Elevated
- **Borders:** 0.8px #000000; 1.6px #040D07; 0.8px #6EE7B7
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.9) 0px 2px 6px 0px inset, rgba(255, 255, 255, 0.05) 0px 1px 1px 0px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.5) 0px 2px 3px -1px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 1px -0.5px, rgba(0, 0, 0, 0.06) 0px 3px 3px -1.5px, rgba(0, 0, 0, 0.06) 0px 6px 6px -3px, rgba(0, 0, 0, 0.06) 0px 12px 12px -6px, rgba(0, 0, 0, 0.06) 0px 24px 24px -12px, rgba(255, 255, 255, 0.04) 0px 1px 1px 0px inset

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 30px radius. Drive the shell with linear-gradient(rgba(16, 185, 129, 0.3), rgba(6, 78, 59, 0.1), rgba(0, 0, 0, 0)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 12px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 12px, 29px, 30px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Primary:** text #010804, radius 9999px, padding 9px, border 0.8px solid rgba(110, 231, 183, 0.4).

### Cards and Surfaces
- **Card surface:** border 0.8px solid rgb(0, 0, 0), radius 12px, padding 18px, shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 1px -0.5px, rgba(0, 0, 0, 0.06) 0px 3px 3px -1.5px, rgba(0, 0, 0, 0.06) 0px 6px 6px -3px, rgba(0, 0, 0, 0.06) 0px 12px 12px -6px, rgba(0, 0, 0, 0.06) 0px 24px 24px -12px, rgba(255, 255, 255, 0.04) 0px 1px 1px 0px inset.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 6px rhythm.
- Do reuse the Elevated surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 12px, 29px, 30px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 300ms and 150ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on color changes. Scroll choreography uses GSAP ScrollTrigger for section reveals and pacing.

**Motion Level:** moderate

**Durations:** 300ms, 150ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** color

**Scroll Patterns:** gsap-scrolltrigger

## WebGL

Reconstruct the graphics as a full-bleed background field using webgl, custom shaders. The effect should read as technical, meditative, and atmospheric: dot-matrix particle field with black and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

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
    - **Value:** WebGL, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Canvas Background (Green Tinted) -->
      <canvas id="glcanvas" class="absolute inset-0 w-full h-full pointer-events-none opacity-80 mix-blend-screen"></canvas>

      <!-- Bottom Gradient Fade for legibility -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      }
      });

      // WebGL Setup for the glowing green wireframe effect
      const canvas = document.getElementById('glcanvas');
      const gl = canvas.getContext('webgl');

      if (!gl) {
      …
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      });

      // WebGL Setup for the glowing green wireframe effect
      const canvas = document.getElementById('glcanvas');
      const gl = canvas.getContext('webgl');

      if (!gl) {
          console.error('WebGL not supported');
      …
      ```
