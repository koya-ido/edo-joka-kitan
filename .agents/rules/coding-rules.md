---
trigger: always_on
---

# Core Coding Standards & Architectural Guardrails

This document establishes the project-wide coding standards, architectural guardrails, and quality constraints.
AI agents and developers MUST strictly enforce these standards whenever generating, modifying, or reviewing code.

> [!IMPORTANT]
> **Language & Output Rule**:
> All interactive communication, questions, explanations, and commit reports to the user **MUST always be delivered in Japanese**.

---

## 1. Universal Quality & Architectural Guardrails (Stack-Independent)

### 1.1 Single Responsibility & 200-Line File Size Limit

- **200-Line Limit**: Every source file MUST be kept under **200 lines** (hard ceiling: 250 lines). If a file approaches 200 lines, split it into smaller sub-modules (hooks, components, schemas, utils, or separate service layers).
  - _Exemptions_: Auto-generated files, database migration files, declarative schema definitions, and comprehensive test files (`*.test.*` / `*.spec.*`, allowed up to 350 lines) are exempt from the 200-line split rule.
- **One Primary Component / Entity per File**: Avoid co-locating multiple large classes, components, or disparate utilities in a single file. Keep files laser-focused.
- **Page / Entrypoint Purity**: Route entrypoints and pages MUST remain pure composition shells, delegating business logic, state, and complex UI to feature modules.
- **3-Layer Separation for Complex UI & Forms**: Multi-input modal/dialog forms or complex view containers approaching the 200-line limit MUST be decomposed into a clean 3-layer architecture:
  1. `types/`: Pure schema, prop, and form value type definitions (< 50 lines)
  2. `hooks/` (or Presenter/Controller): State transitions, async queries/mutations, validation, and pending states (< 150 lines)
  3. `Component`: Pure presentational JSX/markup composition (< 180 lines)
- **Sub-domain Splitting for Server Actions & Handlers**: When server actions, RPCs, or API handlers approach the file size limit, physically split them by use-case or sub-domain (e.g., `{subdomain}.actions.*`), and re-export them via a central barrel file (`actions/index.*`) to preserve transparent, single-path caller imports.
- **Single Trailing Newline (POSIX Hygiene)**: Every generated or modified file MUST terminate with strictly a single newline (`\n`). Consecutive blank lines at the end of a file (`\n\n+`) are strictly forbidden.

### 1.2 Type Safety & Schema Standards

- **Zero `any` Policy**: The use of `any` is strictly prohibited. Use explicit type aliases, interfaces, generics, or `unknown` with type narrowing.
- **Strict Schema-Driven Validation**: All external inputs (request payloads, query parameters, route params, third-party API responses, environment variables) MUST be validated using schemas (e.g., Zod, Pydantic, OpenAPI, Validator structs) before processing.
- **Standalone Type Imports**: When applicable in typed languages (e.g., TypeScript), always use standalone type imports (e.g., `import type { ... }`).

### 1.3 Security, Authorization, Database Hygiene & Error Handling

- **Cross-Cutting Authorization Guard**: Every protected endpoint, action, and route MUST verify authentication and role/tenant permissions at the entrypoint. Never assume client authorization.
- **Hierarchical Entity Tenant Inheritance (BOLA Defense)**: When creating or modifying nested child entities (e.g., subtasks, child comments under a parent entity), NEVER accept client-supplied tenant/workspace IDs in the request payload. The server action/handler MUST independently authenticate access to the parent entity, forcefully derive the tenant ID directly from the authenticated parent record, and assign it internally to the child entity.
- **Mandatory 401/403 Tests (No Hollow Mocks)**: For every secure action or endpoint, automated tests verifying rejection of unauthenticated (401) and unauthorized (403) requests are mandatory. Tests MUST execute the actual authorization guard and validation logic — mocking the target business logic or authorization guard itself to force a fake pass is strictly forbidden.
- **Database & Query Hygiene (No SQLi / No N+1 / Bounded Lists)**: Always use parameterized queries or ORM methods (raw SQL string concatenation is forbidden). Prohibit N+1 query loops (use eager loading/joins/batching), enforce pagination or explicit `LIMIT` on list queries (unbounded `SELECT *` is forbidden), and wrap multi-step writes in transactions.
- **No Swallowed Errors**: Catch blocks that swallow exceptions silently or empty handlers are strictly forbidden. Always log errors with contextual details or bubble them up via structured error responses without leaking internal stack traces to clients.
- **Zero Hardcoded Secrets & `.env.example` Sync**: Secrets, credentials, and API keys MUST NEVER be hardcoded. Always retrieve them via schema-validated environment configs, and synchronize `.env.example` whenever adding or changing environment variables.

### 1.4 UI, Form UX & State Standardization (For Frontend & Full-Stack Apps)

- **5-State Standard**: Every data-driven screen and UI container MUST explicitly account for the 5 core states:
  1. `Empty`: Friendly guidance and onboarding CTA when data collections are empty
  2. `Loading`: Clear loading indicators or skeletons without layout shift
  3. `Success`: Smooth display of loaded data
  4. `Error`: Recoverable error view with retry action
  5. `Disabled / Unauthorized`: Inactive controls with explanation, clean login redirect (401), or forbidden view (403)
- **Form UX & Interactive Defense**:
  - **Double-Submit Prevention**: Async submit/mutation buttons MUST be disabled (`disabled` / pending state) while a request is in flight.
  - **Error Feedback Routing**: Field-level validation errors MUST be rendered inline adjacent to the corresponding input field; global/system/authorization errors MUST be surfaced via toast notifications or alert banners.
  - **Form Reset & Dirty Guard**: Modal and edit forms MUST reset stale state upon reopening or switching target entities, and guard against accidental dismissal of unsaved dirty inputs. Browser-native `window.confirm()` and `window.alert()` are strictly prohibited (use accessible custom dialog components).
- **UI Dialog & Modal Props Governance**:
  - Standardize boolean state props across all dialogs, modals, and sheets: use `open: boolean` (with `onOpenChange: (open: boolean) => void`) for visibility control, and `isPending: boolean` for in-flight async/transition states.
- **Component Procurement Traceability & No Raw Tag Fallbacks (CRITICAL)**:
  - All UI elements authored in views and modals MUST directly conform to the procurement strategy cataloged in `specs/components.md`.
  - Silently falling back to unstyled raw native HTML elements (e.g., `<select>`, `<input type="date">`, `<dialog>`) when an accessible component (e.g., Select, DatePicker, Dialog) is cataloged in `specs/components.md` is strictly forbidden.
- **Prohibition of Mock/Shallow UI Implementations & Compound Component Standards**:
  - Wrapping raw HTML tags in basic utility classes as a shortcut is strictly prohibited when library-backed primitives are specified. UI components MUST adhere to the accessible Compound Component pattern (Root, Trigger, Value, Content, Item) of the chosen design system.
- **Semantic HTML & Accessibility**: Enforce semantic tags (`main`, `section`, `nav`, `form`, `button`, `label`). Avoid clickable `div` or `span` elements. Ensure accessible keyboard navigation and ARIA attributes where needed.

### 1.5 Modern Idioms & Zero Deprecated / Legacy Code (CRITICAL)

- **Target Version Alignment**: All generated code MUST adhere to the modern, active specifications and official idioms of the project's selected framework, language, and library versions.
- **Prohibition of Legacy & Deprecated Patterns**: AI agents MUST NOT fall back to outdated syntax, deprecated APIs, or legacy conventions lingering in pre-training data. If an API, method, hook, or pattern is marked deprecated by the official documentation, its usage is strictly forbidden.
- **Explicit Migration over Habitual Patterns**:
  - Always prefer modern first-class idioms (e.g., current routing paradigms, modern asynchronous patterns, built-in standard library utilities) over obsolete boilerplate or deprecated third-party wrappers.
  - When modifying existing files, proactively refactor surrounding legacy code to the current version's standard.

### 1.6 Git Safety & Post-Implementation Self-Audit (CRITICAL)

- **Prohibition of Unauthorized Git Commits/Pushes**: AI agents MUST NEVER autonomously execute `git commit` or `git push` without explicit user instruction. At the end of each completed slice (after `/code-review` approval), propose a concise commit message in Japanese and wait for user confirmation.
- **Mandatory Post-Task Self-Audit**: Whenever creating or modifying source code files, the agent MUST verify and include a concise self-audit summary at the end of its response (fixing any failures before reporting):
  1. **File Size Check**: All modified/created production files are `<= 200 lines` (with actual line counts).
  2. **Static Verification**: Typecheck, build, and linter pass with zero errors.
  3. **Test & Rule Compliance**: Unit/401/403 tests pass, zero raw colors, and zero `any` or `@deprecated` usage.

---

## 2. Project-Specific Stack & Conventions (Customized during Phase 2)

Target Tech Stack: **React 19 + Vite + TypeScript (strict) + Tailwind CSS + HTML5 Canvas 2D + IndexedDB (`idb`) + Vitest + pnpm**.

### 2.1 Directory Structure & Layer Responsibilities

Place application directories directly under the repository root (without a `src/` wrapper). Configure `tsconfig.json` (`include`) and `vite.config.ts` (`resolve.alias`) accordingly.

```text
/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── app/                # Application entrypoint, root layout, screen router/switcher, global providers
├── features/           # Domain UI features (6 screens)
│   ├── home/
│   ├── stage-select/
│   ├── battle/
│   ├── gacha/
│   ├── enhance/
│   └── formation/
├── engine/             # Pure TS Canvas 2D game loop, physics, collision, procedural renderer, no-op audio
├── domain/             # Pure TS business logic (stat math, gacha pool, 0:00 login bonus, precondition guards)
├── data/               # Immutable typed master definitions (characters, weapons, stages, enemies)
├── storage/            # IndexedDB (`idb`) schema, transaction repository, runtime save validation
└── components/
    └── ui/             # Shared Japanese-style UI primitives using Colocated Component Pattern
```

- **Strict Layer Boundaries**:
  - `domain/` and `engine/` MUST remain **pure TypeScript with zero imports from `react` or `react-dom`**.
  - `data/` MUST contain only static master definitions and types; it MUST NOT import from `storage/`, `features/`, or `engine/`.
  - `features/` MUST NOT access raw `indexedDB` directly; persistence MUST go through `storage/` and `domain/` services/hooks.
- **Colocated Component Pattern (`components/ui/`)**:
  - House each shared UI component in its own folder: `components/ui/{ComponentName}/` containing `{ComponentName}.tsx`, optional `types/`, `hooks/`, `utils/`, and an `index.ts` barrel file exporting only the public API.

### 2.2 Encapsulation, Path Aliases & Import Rules

- **Root Path Alias (`@/`)**: Map `@/*` to `./*` in both `tsconfig.json` and `vite.config.ts`. Always use `@/` absolute imports across directories (e.g., `@/domain/gacha`, `@/components/ui/Modal`). Relative imports are permitted **only** within the same feature or component folder (`./types`, `./hooks/...`). Cross-directory `../` traversal is forbidden.
- **Barrel Encapsulation**: Every folder under `features/*` and `components/ui/*` MUST expose its public symbols through `index.ts`. Importing internal files of another feature (e.g., `@/features/gacha/hooks/useGacha`) is strictly forbidden.
- **Standalone Type Imports**: Enable `"verbatimModuleSyntax": true` in `tsconfig.json` and always use `import type { ... }` for type-only imports.
- **No Circular Dependencies**: Enforce acyclic dependency flow: `app -> features -> (domain, engine, storage, components/ui) -> data`.

### 2.3 Syntax, Modern Idioms & Prohibited Anti-Patterns

- **Arrow Functions Only (原則アロー関数統一)**:
  - All React components, custom hooks, domain functions, event handlers, and utilities MUST be written as `const` arrow functions (`export const ComponentName = (...) => { ... }`) rather than `function` declarations.
  - Exception: Only when an explicit `function` overload signature or generator (`function*`) is syntactically required by TypeScript.
- **React 19 Modern Idioms**:
  - **Do**: Define function components as arrow functions accepting `ref` directly as a prop (`interface Props { ref?: React.Ref<HTMLCanvasElement> }`). Use standard JS default parameter destructuring for optional props.
  - **Don't**: Never use `React.FC`, `React.VFC`, `forwardRef`, `defaultProps`, or class components.
- **Canvas 2D & React State Separation (60fps Guard)**:
  - **Do**: Hold the `engine/` simulation instance inside `useRef`, run `requestAnimationFrame` exclusively inside `engine/`, and emit throttled/event-driven `BattleHudSnapshot` updates to React only when HUD values (barrier HP, wave, level, EXP, phase) actually change.
  - **Don't**: Never store per-frame entity positions, projectiles, particles, or animation tick counters in React `useState`.
- **IndexedDB (`idb`) & Structured Error Handling**:
  - **Do**: Perform all IndexedDB reads/writes through `storage/` using `idb` (`openDB<EdoPurificationDB>`) inside explicit transactions, validating loaded records before use. Return structured `Result` objects or throw typed domain errors handled by UI error boundaries/toasts.
  - **Don't**: Never call raw `window.indexedDB.open` directly, never use `localStorage` for save data, and never swallow exceptions in empty `catch` blocks.
- **Tailwind CSS & UI Dialogs**:
  - **Do**: Reference design tokens / CSS custom properties defined in the styling system (per `design-rules.md`). Build accessible custom modal/confirm dialogs with `open` and `onOpenChange`.
  - **Don't**: Never hardcode raw hex/rgb color values (`#ffffff`, `rgb(...)`) in TSX/CSS, and never use `window.alert()`, `window.confirm()`, or `window.prompt()`.

### 2.4 Naming Conventions & Code Style

- **Directories**:
  - Feature / layer / utility directories: `kebab-case` (e.g., `features/stage-select/`, `domain/`).
  - UI Component directories: `PascalCase` (e.g., `components/ui/WafuButton/`).
- **Files**:
  - React components: `PascalCase.tsx` (e.g., `BattleHud.tsx`, `GachaResultModal.tsx`).
  - Hooks: `camelCase.ts` prefixed with `use` (e.g., `useBattleEngine.ts`, `usePlayerSave.ts`).
  - Pure TS modules (`domain/`, `engine/`, `storage/`, `data/`): `kebab-case.ts` (e.g., `login-bonus.ts`, `save-repository.ts`, `weapon-master.ts`).
  - Unit tests: `{target}.test.ts` or `{target}.test.tsx`.
- **Identifiers**:
  - Types / Interfaces: `PascalCase` (do not prefix interfaces with `I`).
  - Variables / Arrow functions / Hooks: `camelCase` (`PascalCase` for React components).
  - Constants / Master config keys: `UPPER_SNAKE_CASE` (e.g., `GACHA_COST_SINGLE`, `MAX_ACTIVE_WEAPONS`).
  - Boolean variables / props: `is*`, `has*`, `can*`, `should*`, or `open` / `isPending` for dialogs.

### 2.5 Verification, Build & Test Commands

Use `pnpm` exclusively for package management and script execution.

- **Typecheck & Build**:
  - Typecheck: `pnpm typecheck` (`tsc --noEmit`)
  - Production Build: `pnpm build` (`vite build`)
- **Linter & Formatter**:
  - Lint: `pnpm lint` (`eslint .`)
- **Unit & Precondition Guard Tests (Vitest)**:
  - Run all tests: `pnpm test` (`vitest run`)
  - Mandatory test scope: Domain math (additive meta-stats vs. multiplicative in-game buffs), 0:00 login bonus date boundary, gacha duplicate/cap conversion, and **negative precondition guard tests** (rejecting insufficient currency, unowned equipment, locked stage sortie, and empty weapon selection).
- **End-to-End (E2E) Tests**:
  - Run E2E (when configured): `pnpm test:e2e`
