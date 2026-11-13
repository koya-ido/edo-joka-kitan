---
trigger: always_on
---

# Design System Standards & UI Styling Guardrails

This document establishes the project-wide design system, styling architecture, and accessibility (a11y) constraints.
AI agents and developers MUST strictly adhere to these rules whenever authoring components, applying styles, or adjusting layouts.

> [!IMPORTANT]
> **Language & Output Rule**:
> All interactive communication, questions, explanations, and styling review reports **MUST always be delivered in Japanese**.

---

## 1. Universal Design System & Accessibility Principles (Stack-Independent)

### 1.1 Prohibition of Hardcoded Colors & Semantic Token Standard

- **No Raw Colors**: Hardcoding arbitrary hex codes (`#3b82f6`), RGB/HSL values, or raw utility palette classes (e.g., `blue-500`, `zinc-900`) directly in component markup is **STRICTLY PROHIBITED**.
- **Mandatory Semantic Tokens**: All surfaces, text, borders, and interactive states MUST use semantic tokens backed by CSS custom properties.
- **Core Semantic Token Taxonomy**:
  - `background` / `foreground`: Base canvas background and standard readable text color.
  - `card` / `card-foreground`: Surface containers, panels, and cards with elevation.
  - `popover` / `popover-foreground`: Floating dropdowns, dialogs, tooltips, and floating sheets.
  - `primary` / `primary-foreground`: Primary action buttons (CTA), active state indicators, key highlights.
  - `secondary` / `secondary-foreground`: Secondary actions, chips, low-emphasis buttons.
  - `muted` / `muted-foreground`: Disabled elements, captions, placeholders, subdued labels.
  - `accent` / `accent-foreground`: Subtle hover states, active list selections, pill badges.
  - `destructive` / `destructive-foreground`: Deletion actions, irreversible operations, error banners.
  - `success` / `warning` / `info` (and foregrounds): Status feedback badges, completion alerts, warning callouts, and informational notices.
  - `border` / `input` / `ring`: Structural divider lines, form input borders, focus outlines.

### 1.2 Spacing, Typography & Responsive Layout Defense

- **8-Point Spacing Grid (4px Sub-Grid)**: All margins, paddings, gaps, and dimensions MUST adhere to multiples of 4px/8px (e.g., `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`). Arbitrary magic numbers (e.g., `13px`, `27px`) are forbidden.
- **Typography Governance**: Maintain a strict typographical hierarchy (Heading 1 to 4 and Body text). Heading levels MUST represent sequential semantic outline depths (`h1 -> h2 -> h3`, no skipped levels), with font size and line height bound to defined tokens.
- **Responsive Overflow & Z-Index Governance**: Prevent unintended horizontal page overflow across mobile (`375px+`), tablet (`768px+`), and desktop (`1024px+`) viewports. Wide data tables MUST be wrapped in horizontal scroll containers (`overflow-x-auto`), and stacking order (`z-index` for sticky headers, dropdowns, modals, toasts) MUST follow a controlled scale rather than arbitrary magic values (`z-[9999]`).

### 1.3 Mobile Usability & Accessibility (WCAG AA Compliance)

- **Contrast Ratio (4.5:1)**: Text against its immediate background container MUST satisfy at least **4.5:1** contrast ratio (3:1 for large text) across both Light and Dark themes.
- **Touch Target (44x44px)**: All interactive controls (buttons, icon links, tabs, input fields) MUST provide a minimum touch/click target area of **44x44px** on mobile viewports.
- **Visible Keyboard Focus Ring**: Never suppress `:focus` or `:focus-visible` without providing a distinct high-contrast outline (using the `ring` token).

### 1.4 Separation of Concerns: Skeletons vs Cosmetics

- **Phase 4 Implementation**: Focus exclusively on DOM semantics, grid/flex structure, component layout, and the 5-State UI (Empty, Loading, Success, Error, Disabled).
- **Phase 5 Implementation**: Apply final aesthetic cosmetics, subtle shadow elevations, and transition/animation curves.

### 1.5 Component Procurement Traceability & Compound Component Standard

- **Traceability to `specs/components.md`**: All UI controls and interactive blocks authored in views MUST strictly conform to the procurement strategy in `specs/components.md`.
- **Prohibition of Shallow Native Tag Fallbacks**: Replacing cataloged complex primitives (e.g., Select, DatePicker, Dialog, Popover) with bare native HTML elements (`<select>`, `<input type="date">`) is strictly prohibited.
- **Compound Component Integrity**: Procured interactive primitives MUST adhere to accessible Compound Component architectures (Root, Trigger, Value, Content, Item), maintaining proper keyboard navigation and ARIA attributes.

---

## 2. Project-Specific Tone & Manner and CSS Architecture (Phase 3 Customization)

> [!NOTE]
> When generating `.agents/rules/design-rules.md` during **Phase 3 (Global Architecture & Specs)**, **Section 1 above MUST be preserved verbatim without summarization or deletion**. Populate the slotted sections below (`2.1` to `2.3`) based on the selected framework, CSS stack (e.g., Tailwind CSS v4, CSS Modules, Styled Components), and UI library policy.

### 2.1 CSS & Theme Architecture

<!-- SLOTTED: Concrete styling framework configuration (e.g., Tailwind CSS v4 @theme inline, CSS variables in globals.css, theme provider) -->

- Define root CSS variables and dark-mode override strategy.
- Detail the chosen CSS build mechanism or import pipeline.

### 2.2 Brand Tone & Manner (Color Palettes & Typography Scale)

<!-- SLOTTED: Concrete palette definitions (OKLCH / HSL values), font family pairings (Google Fonts / local webfonts), and radius settings -->

- Primary Brand Color Palette: Define values for Light & Dark modes.
- Typography Font Stacks: Define primary sans-serif and monospace fonts.
- Corner Radius Tokens: Define small, medium, large, and full pill radius values.

### 2.3 UI Component Procurement & Governance Policy

<!-- SLOTTED: Library component procurement strategy (e.g., shadcn/ui vs custom primitives) -->

- Complex accessible primitives (Dialog, DropdownMenu, Select, Form, Popover): Procure from verified UI library adhering to Compound Component architecture.
- Simple presentation components (Badge, Container, Divider): Build as lightweight custom primitives.
- Placement conventions: Define directory layout for UI primitives.
- Traceability: Verify all view components against `specs/components.md`, prohibiting bare HTML shortcuts.
