---
version: alpha
name: CorTeX Tactical Brutalism
description: High-contrast technical defense and academic research intelligence design system for browser-native LaTeX compilation.
colors:
  primary: "#0F1318"
  secondary: "#475569"
  tertiary: "#C83214"
  neutral: "#F8FAFC"
  surface: "#181C24"
  surface-light: "#FFFFFF"
  border: "#262B33"
  accent-cyan: "#0369A1"
  text-primary: "#0F172A"
  text-light: "#F8FAFC"
  text-muted: "#64748B"
  status-success: "#15803D"
  status-error: "#B91C1C"
typography:
  h1:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Newsreader
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  h3:
    fontFamily: Space Mono
    fontSize: 1rem
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.05em"
  body-serif:
    fontFamily: Newsreader
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.65
  body-mono:
    fontFamily: Space Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.02em"
  label-mono:
    fontFamily: Space Mono
    fontSize: 0.6875rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  none: 0px
  sm: 0px
  md: 0px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  navbar-strip:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    height: 52px
    padding: 12px
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    padding: 10px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    padding: 10px
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: 10px
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    padding: 10px
  table-row:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: 12px
  status-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    padding: 4px
  math-rendered-card:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: 16px
  math-side-inspector:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: 12px
  status-success-badge:
    backgroundColor: "{colors.status-success}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    padding: 4px
  status-error-badge:
    backgroundColor: "{colors.status-error}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    padding: 4px
  telemetry-pill:
    backgroundColor: "{colors.accent-cyan}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    padding: 4px
  metadata-tag:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.none}"
    padding: 4px
  structural-border:
    backgroundColor: "{colors.border}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.none}"
    padding: 1px
---

## Overview

CorTeX Tactical Brutalism blends military-grade instrumentation with editorial academic typography. Inspired by tactical defense systems, telemetry radars, and rigorous scientific paper publishing, this design system establishes uncompromising legibility, deterministic navigation, and functional information density.

Every UI element is purposeful: no decorative fluff, zero border-radius, high contrast ratios, and instant tactile feedback. The user is treated as an expert operator controlling a browser-native WebAssembly compilation engine.

## Colors

- **Primary (`#0F1318`):** Deep obsidian chassis used for top bars, table headers, and high-contrast bounding boxes.
- **Secondary (`#475569`):** Slate gray for secondary indicators, metadata labels, and subtle division lines.
- **Tertiary (`#C83214`):** Hazard orange accent (WCAG AA compliant against white) reserved for high-priority actions (`+ NEW MANUSCRIPT`, `ADD TO BIBTEX`).
- **Neutral (`#F8FAFC`):** Off-white parchment tone preventing eye fatigue during lengthy reading and editing sessions.
- **Surface (`#181C24`):** Dark instrument panel surface for dialogs and telemetry boxes.
- **Surface Light (`#FFFFFF`):** High-clarity white background for rendered paper pages and data rows.
- **Border (`#262B33`):** Strict 1px / 1.5px structural boundaries between panes and grid modules.
- **Accent Cyan (`#0284C7`):** Technical telemetry indicator for WebAssembly runtime states, active tabs, and inline math tags.
- **Text Primary (`#0F172A`):** Deep ink black ensuring maximum contrast and legibility for manuscript reading.
- **Text Light (`#F8FAFC`):** Crisp off-white text for dark telemetry headers, buttons, and status bars.
- **Text Muted (`#64748B`):** Monospaced label text for classifications, timestamps, and secondary file paths.
- **Status Success (`#15803D`) / Status Error (`#B91C1C`):** Strict semantic indicators for compilation results and diagnostic counts.

## Typography

- **Headlines (H1, H2 — `Newsreader`):** High-gravitas editorial serif conveying scientific authority and peer-reviewed rigor.
- **H3 & Technical Labels (`Space Mono`):** Fixed-width telemetry labels with high letter-spacing (`0.05em` - `0.08em`) and uppercase styling.
- **Body Manuscript (`Newsreader` 16px, 1.65 line-height):** Ergonomically proportioned serif text replicating physical paper printing margins.
- **Data & Telemetry (`Space Mono` 13px):** Monospace precision for file paths, author names, timestamps, and engine latency meters.
- **Formulas (`KaTeX` / Latin Modern):** Authentic AMS/LaTeX mathematical rendering with proper fractions, limits, integrals, and superscripts.

## Layout

- **Zero Border-Radius (`rounded: 0px`):** Hard, industrial, zero-radius edges throughout buttons, inputs, panels, modals, and badges.
- **Split Screen Hero Architecture:**
  - *Left Grid (60%):* Mission headline, direct action triggers (`+ NEW MANUSCRIPT`, `IMPORT LATEX / ZIP`), and core synchronization accuracy metrics.
  - *Right Grid (40%):* Concentric telemetry radar displaying live engine health, memory heap allocation (64MB), and sub-second latency budget (`< 142ms`).
- **Above-The-Fold Archive Table:** Compact hero vertical dimensions (~340px) ensure the research archive and project files are immediately visible on standard 1080p and laptop screens without excessive scrolling.
- **Hierarchical Sidebar Tree:** Folders render as discrete header blocks (`📁 chapters/`) with indented child files (`  📄 ch1.tex`) to eliminate path ambiguity.

## Elevation & Depth

- **No Blurred Drop Shadows:** Soft drop shadows are strictly prohibited. Depth is achieved via crisp hard-edged offset borders (`box-shadow: 4px 4px 0px var(--border-color)`).
- **Z-Index Layering:**
  - *Layer 0 (Canvas):* Neutral background and editor scroll viewport.
  - *Layer 10 (Panels):* Sidebars, file tree, and outline panes.
  - *Layer 20 (Navigation):* Sticky topbars and status indicators.
  - *Layer 50 (Modals):* Dialog backdrop (`rgba(0, 0, 0, 0.75)` with 2px blur) and bracket-cornered modal frames.

## Shapes

- **Corner Brackets:** Interactive primary triggers feature tactical corner tick marks (`tl`, `tr`, `bl`, `br`) invoking target reticles and military spec instrumentation.
- **Square Chips:** Filter tags (`[ ALL ]`, `[ TUTORIAL ]`, `[ DEEP LEARNING ]`) use square monospaced brackets.
- **Dividers:** 1px dashed or solid technical reticle lines between information modules.

## Components

- **`tactical-navbar`:** 52px high obsidian topbar housing brand logo, filter views (`ALL PROJECTS`, `RESEARCH LIBRARY`, `ARCHIVED`, `TRASH`), Cloudflare R2 backup trigger, light/dark mode switch, and operator identity.
- **`button-primary`:** Hazard orange background with corner brackets for primary actions.
- **`button-secondary`:** Neutral bordered button for file imports and secondary tools.
- **`table-row`:** Crisp 1.5px bordered rows with hover highlight, document classification glyph, author, timestamp, and action buttons.
- **`math-container`:** Split-view formula box combining rendered KaTeX typography on the left and an equation inspector side preview (`[ EQUATION ]`, raw LaTeX code, `✎ Edit` button) on the right.
- **`status-bar`:** 26px monospaced bottom ribbon reporting engine readiness, diagnostic errors, and TeX Live distribution year.

## Information Architecture & UX Navigation

To prevent operator disorientation ("tidak pusing") and guarantee every area serves a clear, actionable purpose:

### 1. Unified Dashboard Workflow
1. **Primary Navigation Bar:** Clear 4-state switcher at top center:
   - `[ ALL PROJECTS ]`: Access active research documents.
   - `[ 📚 RESEARCH LIBRARY ]`: Browse literature references and add citations to project `refs.bib`.
   - `[ ARCHIVED ]`: Long-term preserved manuscripts.
   - `[ TRASH ]`: Recoverable deleted files.
2. **Hero Telemetry:** Provides immediate visual feedback on WebAssembly engine status, heap capacity, and compile latency.
3. **Action Hub:** Exactly two primary entry paths: create new document (`+ NEW MANUSCRIPT`) or import archive (`⬆ IMPORT LATEX / ZIP` with auto-unzip).
4. **Research Library Integration:** Every literature entry features a single-click `[ 📥 ADD TO BIBTEX ]` button with target project selection and automatic duplicate prevention.

### 2. Workspace Editor Workflow
1. **Top Navigation:** Breadcrumb return button `← Projects`, editable document title, and view toggle (`Visual`, `Code`, `Split`).
2. **Left Sidebar:** Split into `FILES` (hierarchical tree with folder creation and upload) and `OUTLINE` (clickable section headings).
3. **Center Canvas:** Distraction-free writing in Visual WYSIWYG mode with live KaTeX formulas, or Monaco Code Editor with LaTeX Language Service (LSP).
4. **Right Panel:** Live synchronized PDF preview with SyncTeX forward/inverse jump.
5. **Bottom Ribbon:** Real-time diagnostics LED (`Ready` / `X Errors`) with 1-click diagnostic drawer.

## Do's and Don'ts

### Do
- Use sharp 90-degree zero-radius corners on all cards, buttons, and modals.
- Enforce strict contrast ratios (minimum 4.5:1 WCAG AA) for all text and interactive controls.
- Provide clear monospaced labels and purpose descriptions for every section.
- Render equations visually via KaTeX while preserving direct access to raw LaTeX source.
- Maintain persistent client-side state across IndexedDB and `localStorage`.

### Don't
- Never use rounded corners (`border-radius: 8px` / `16px`).
- Never introduce saturated cyan or bright backgrounds that cause screen glare.
- Never place non-functional decorative elements that confuse user navigation.
- Never hide primary actions behind nested submenus.
- Never escape mathematical operators like `<` or `>` into raw HTML entities inside formula previews.
