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

> [!NOTE]
> When generating `.agents/rules/coding-rules.md` during **Phase 2 (Foundation Design & Coding Rules Setup)**, **Section 1 above MUST be preserved verbatim without summarization or deletion**. Populate the slotted sections below (`2.1` to `2.5`) with concrete rules tailored to the project's selected framework, language, and libraries.

### 2.1 Directory Structure & Layer Responsibilities

<!-- SLOTTED: Concrete directory hierarchy (e.g., Bulletproof feature folders, Clean Architecture layers, or MVC structure) -->

- Replace this section with the concrete directory map chosen for the project.
- Define explicit layer boundaries and forbidden cross-layer imports.
- Standardize the **Colocated Component Pattern** for UI modules (each component housed in its own directory with `{ComponentName}.tsx`, `types/`, `hooks/`, `utils/`, and an `index.ts` barrel file exposing only public interfaces).

### 2.2 Encapsulation, Path Aliases & Import Rules

<!-- SLOTTED: Path aliases (@/*), barrel files (index.ts) usage, and circular dependency prevention rules -->

- Define module encapsulation rules (e.g., strict `@/` absolute aliases, prohibition of cross-feature private imports).

### 2.3 Syntax, Modern Idioms & Prohibited Anti-Patterns

<!-- SLOTTED: Framework-specific idioms (e.g., RSC vs 'use client', Server Actions, Hook rules, ORM query patterns, modern state management) -->

- Define framework-specific guidelines (e.g., functional components vs classes, query builders vs ORMs, immutability conventions).
- Explicitly catalog **Do / Don't pairs** for stack-specific deprecated APIs and modern equivalents (e.g., Next.js App Router vs Pages Router, React 19 Action/Hook patterns, Vitest modern mock idioms).
- Prohibit known LLM training-bias anti-patterns and obsolete packages for this tech stack.

### 2.4 Naming Conventions & Code Style

<!-- SLOTTED: Case conventions (kebab-case, PascalCase, camelCase, snake_case) and naming standards -->

- Files & Folders: Define naming scheme (e.g., `kebab-case` for browser routing paths, `PascalCase` for UI component / feature directories).
- Types / Classes / Interfaces: Define naming scheme
- Functions / Variables / Constants: Define naming scheme

### 2.5 Verification, Build & Test Commands

<!-- SLOTTED: Exact CLI commands for static typecheck, linter, unit/integration tests, E2E tests, and DB migrations -->

- Typecheck & Build: Define exact command (e.g., `pnpm typecheck`, `pnpm build`, `cargo check`)
- Linter & Formatter: Define exact command (e.g., `pnpm lint`)
- Unit & Authorization (401/403) Tests: Define exact command and test runner scope
- End-to-End (E2E) Tests: Define exact command
