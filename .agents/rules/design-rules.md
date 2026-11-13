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

Target Project: **穢土浄化奇譚 〜 妖魔祓ひの旅路 〜** (和風縦型ローグライクタワーディフェンス Web ゲーム)
Target Styling Stack: **Tailwind CSS v4 (`@theme inline`) + CSS Custom Properties + Radix UI Primitives + `lucide-react`**

### 2.1 CSS & Theme Architecture

#### 2.1.1 Stylesheet & Token Pipeline (`app/styles/tokens.css`)

- **CSS Entrypoint**: `app/styles/index.css`（`main.tsx` から読み込み）にて `@import "tailwindcss";` および `@import "./tokens.css";` を宣言する。
- **Tailwind CSS v4 `@theme inline` マッピング**:
  - `:root` にすべてのカラートークン、角丸トークン、フォントトークン、Z-Index トークンを CSS カスタムプロパティとして定義する。
  - `@theme inline` ブロック内で `--color-*`、`--radius-*`、`--font-*`、`--z-*` を `:root` の変数へマッピングし、コンポーネントからは `bg-background`、`text-foreground`、`border-border`、`rounded-md` 等のセマンティックユーティリティクラスとして参照する。
- **テーマ基調（和紙明基調＋墨色フレーム構成）**:
  - ゲーム本編の UI サーフェスは伝統的な「生成り和紙（Washi Light）」を基調とし、PC ビューポートの左右余白フレームおよびバトル画面・オーバーレイ背景には「墨色（Sumi Dark）」専用トークン（`--frame-outer`, `--battle-surface`）を使用する。
  - テーマ切替やダーク拡張に備え、`.dark` セレクタでオーバーライド可能な変数構造を維持しつつ、全組み合わせで **WCAG AA（4.5:1 以上）** のコントラスト比を担保する。

#### 2.1.2 4px / 8px Spacing Grid & Viewport Governance

- **8-Point Spacing Grid（4px サブグリッド）の強制**:
  - Tailwind の `0.25rem` (4px) 基準スケールのみを使用する。
  - 許可値: `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px), `16` (64px)。
  - `p-[13px]`、`m-[7px]`、`gap-[10px]` 等の任意値（arbitrary values）は一切禁止する。
- **縦型ゲームビューポート・Safe Area**:
  - PC（`md:` / `768px+`）: 中央に `max-w-[450px]`（例外的な固定幅設計値）の縦型ゲームシェルを配置し、左右余白に `bg-frame-outer` を敷く。
  - モバイル: `min-h-dvh` / `h-dvh` を基準とし、ノッチ・ホームバー対応のため `env(safe-area-inset-top)` および `env(safe-area-inset-bottom)` を `shared/AppShell` で吸収する。
- **タッチ領域と連打防止**:
  - すべてのボタン・タブ・選択カードは最小 `44x44px`（`min-h-11 min-w-11`）を確保し、バトル操作部および主要ボタンには `touch-action: manipulation` を付与する。

#### 2.1.3 Z-Index Stacking Scale

任意のマジックナンバー（`z-[9999]` 等）を禁止し、以下の制御スケールのみを使用する。

- `z-0` (`--z-base`): 通常コンテンツ・Canvas 背景
- `z-10` (`--z-hud`): バトル上部・下部 HUD オーバーレイ
- `z-20` (`--z-sticky`): 固定ヘッダー (`ScreenHeader`)・固定下部4タブナビ (`BottomTabNav`)
- `z-30` (`--z-popover`): ポップオーバー (`ui/Popover`)・ツールチップ (`ui/Tooltip`)
- `z-40` (`--z-overlay`): モーダル用バックドロップ暗幕
- `z-50` (`--z-modal`): ダイアログ (`ui/Dialog`)・確認アラート (`ui/AlertDialog`)
- `z-60` (`--z-toast`): エラー・通知トースト (`ui/Toast`)

#### 2.1.4 Prohibition of Raw Colors (生カラー禁止規約の厳格化)

- **TSX / CSS 内の直書き禁止**:
  - `#ffffff`、`#1a1a1a`、`rgb(...)`、`rgba(...)`、`hsl(...)`、`oklch(...)` を `app/`・`features/`・`components/` 内に直接記述することを**全面禁止**する。
  - Tailwind 標準のカラーパレットクラス（`bg-red-500`, `text-slate-900`, `border-amber-200`, `bg-white`, `text-black` 等）の直接利用も**禁止**する。必ず `@theme inline` で定義したセマンティックトークンクラス（例: `bg-primary`, `text-card-foreground`, `border-border`, `bg-hisui/15`）を使用すること。
- **Canvas 2D (`engine/`) との連携**:
  - `engine/` 内の Canvas 描画色（結界エフェクト、妖怪、攻撃弾）も直接色コードを散在させず、トークン定義（`tokens.css` と同期した `engine/palette.ts` または `getComputedStyle` 経由の CSS 変数解決）から一元参照する。

---

### 2.2 Brand Tone & Manner (Color Palettes, Typography Scale & Corner Radius)

#### 2.2.1 Color Palette Tokens (OKLCH Definitions)

和の静謐さと祓いの霊力を表現する伝統色ベースのセマンティックトークンを `:root` に定義する。

| トークン名                 | OKLCH 値                 | 伝統色イメージ・用途                           |
| :------------------------- | :----------------------- | :--------------------------------------------- |
| `--background`             | `oklch(0.965 0.014 82)`  | 生成り和紙（ベース画面背景）                   |
| `--foreground`             | `oklch(0.220 0.015 65)`  | 濃い墨色（標準テキスト・WCAG AA 担保）         |
| `--card`                   | `oklch(0.985 0.008 85)`  | 白練和紙（カード・ステージ枠背景）             |
| `--card-foreground`        | `oklch(0.220 0.015 65)`  | 濃い墨色（カード内テキスト）                   |
| `--popover`                | `oklch(0.990 0.006 85)`  | 鳥の子紙（モーダル・ポップオーバー背景）       |
| `--popover-foreground`     | `oklch(0.220 0.015 65)`  | 濃い墨色（モーダル内テキスト）                 |
| `--primary`                | `oklch(0.520 0.195 28)`  | 鳥居朱（主要 CTA・「出撃する」「召喚」ボタン） |
| `--primary-foreground`     | `oklch(0.985 0.005 85)`  | 白練（朱ボタン上の高コントラスト文字）         |
| `--secondary`              | `oklch(0.910 0.022 78)`  | 砥粉色（副次アクション・非選択タブ背景）       |
| `--secondary-foreground`   | `oklch(0.260 0.018 65)`  | 墨色（副次ボタン文字）                         |
| `--muted`                  | `oklch(0.925 0.015 80)`  | 灰汁色（無効状態・スケルトン・補助背景）       |
| `--muted-foreground`       | `oklch(0.460 0.018 70)`  | 鈍色（注記・プレースホルダー・無効文字）       |
| `--accent`                 | `oklch(0.740 0.135 82)`  | 金茶・黄土（選択中ハイライト・重要バッジ）     |
| `--accent-foreground`      | `oklch(0.200 0.020 65)`  | 濃墨（金茶背景上の文字）                       |
| `--destructive`            | `oklch(0.480 0.210 22)`  | 紅蓮・茜（セーブ初期化・撤退・エラー通知）     |
| `--destructive-foreground` | `oklch(0.985 0.005 85)`  | 白練（破壊的ボタン上の文字）                   |
| `--success`                | `oklch(0.510 0.135 152)` | 松葉緑（浄化済み・強化成功・勝利）             |
| `--success-foreground`     | `oklch(0.985 0.005 85)`  | 白練                                           |
| `--warning`                | `oklch(0.680 0.155 68)`  | 朽葉・山吹（通貨不足警告・注意喚起）           |
| `--warning-foreground`     | `oklch(0.200 0.020 65)`  | 濃墨                                           |
| `--info`                   | `oklch(0.480 0.125 245)` | 藍墨・縹（情報バッジ・霊力案内）               |
| `--info-foreground`        | `oklch(0.985 0.005 85)`  | 白練                                           |
| `--border`                 | `oklch(0.840 0.025 78)`  | 薄墨罫線（カード・セクション境界線）           |
| `--input`                  | `oklch(0.800 0.028 75)`  | 入力・選択枠境界線                             |
| `--ring`                   | `oklch(0.520 0.195 28)`  | フォーカスリング（`:focus-visible` 用鳥居朱）  |

**ゲームドメイン拡張セマンティックトークン**:

- `--frame-outer`: `oklch(0.180 0.015 65)`（PC ビューポート左右の墨色背景フレーム）
- `--battle-surface`: `oklch(0.160 0.020 260)`（夜陰・穢土バトル Canvas 背景および暗色 HUD ベース）
- `--battle-foreground`: `oklch(0.960 0.010 85)`（バトル暗色 HUD 上の白練文字）
- `--magatama`: `oklch(0.540 0.175 295)` / `--magatama-foreground`: `oklch(0.985 0.005 85)`（水晶の勾玉：紫水晶）
- `--hisui`: `oklch(0.560 0.145 162)` / `--hisui-foreground`: `oklch(0.985 0.005 85)`（翡翠：翠玉）
- `--barrier`: `oklch(0.620 0.155 150)`（結界耐久ゲージ）
- `--exp`: `oklch(0.600 0.160 245)`（霊力 EXP ゲージ）

#### 2.2.2 Typography Scale & Font Stacks

`ui/Typography`（`Heading` および `Text`）を通じて以下の階層を厳守する。見出しレベル（`h1` → `h2` → `h3` → `h4`）を飛ばして使用してはならない。

- **フォントファミリー定義**:
  - `--font-display` (見出し・和風タイトル): `"Shippori Mincho", "Noto Serif JP", "Hiragino Mincho ProN", serif`
  - `--font-sans` (UI 本文・ボタン・ラベル): `"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", sans-serif`
  - `--font-mono` (数値・通貨・ウェーブ・タイマー): `ui-monospace, "JetBrains Mono", monospace`（原則として `--font-sans` + `tabular-nums` を用い、等幅数値ズレを完全防止する）

| ロール / 階層              | トークン・クラス      | フォントサイズ / 行高        | ウェイト                | 用途                                                |
| :------------------------- | :-------------------- | :--------------------------- | :---------------------- | :-------------------------------------------------- |
| **`h1` (Screen Title)**    | `text-2xl leading-8`  | `24px` (`1.5rem`) / `32px`   | `700` (`font-bold`)     | 画面タイトル（`ScreenHeader`）、ホーム作品ロゴ      |
| **`h2` (Section / Modal)** | `text-xl leading-7`   | `20px` (`1.25rem`) / `28px`  | `700` (`font-bold`)     | セクション見出し、モーダルタイトル (`Dialog.Title`) |
| **`h3` (Card Title)**      | `text-lg leading-6`   | `18px` (`1.125rem`) / `24px` | `600` (`font-semibold`) | ステージ名、強化項目名、キャラ/武器名               |
| **`h4` (Subheading)**      | `text-base leading-6` | `16px` (`1rem`) / `24px`     | `600` (`font-semibold`) | サブセクション、ステータスグループ見出し            |
| **`body` (Default Text)**  | `text-sm leading-6`   | `14px` (`0.875rem`) / `24px` | `400` (`font-normal`)   | 説明文、スキル効果文、エラーメッセージ              |
| **`label` (Interactive)**  | `text-sm leading-5`   | `14px` (`0.875rem`) / `20px` | `600` (`font-semibold`) | ボタンラベル、タブ項目、選択カード見出し            |
| **`caption` (Subtle)**     | `text-xs leading-4`   | `12px` (`0.75rem`) / `16px`  | `500` (`font-medium`)   | 状態バッジ、通貨注記、補足テキスト（4.5:1 維持）    |
| **`numeric` (Tabular)**    | `tabular-nums` 必須   | 各階層サイズに準拠           | `700` (`font-bold`)     | 勾玉・翡翠残高、HP/ATK/LUK 数値、ウェーブ・時間     |

#### 2.2.3 Corner Radius Tokens

和紙・木札・印章の端正なシルエットを表現するため、過度に丸い角丸を避け、以下の4段階トークンに限定する。

- `--radius-sm`: `0.25rem` (`4px`) — `ui/Badge`（状態ラベル）、`ui/Progress` トラック、小タグ
- `--radius-md`: `0.5rem` (`8px`) — `ui/Button`、`ui/Tabs` トリガー、`ui/Popover`、`ui/Toast`、武器スロット
- `--radius-lg`: `0.75rem` (`12px`) — `ui/Card`、選択カード (`SelectableCard`)、`ui/Dialog`・`ui/AlertDialog` 本体
- `--radius-full`: `9999px` — `shared/CurrencyPill`、`ui/Avatar`（円形紋章枠）、丸型アイコンボタン

---

### 2.3 UI Component Procurement & Governance Policy

すべての画面・モーダル実装は [specs/components.md](../../specs/components.md) の2層アーキテクチャおよび調達カタログに完全準拠しなければならない。

- **第1層：調達プリミティブ層 (`components/ui/`)**:
  - **Radix UI Primitives 採用**: `Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `Toast`, `Tabs`, `RadioGroup`, `Toggle`, `Label`, `Progress`, `Avatar`, `AspectRatio`, `ScrollArea`, `Separator`, `VisuallyHidden`, `Slot`（`Button` 内包）は必ず `@radix-ui/react-*` をラップし、Compound Component API（`Root`, `Trigger`, `Content` 等）を公開する。
  - **軽量カスタムプリミティブ**: `Card`, `Badge`, `Typography`（`Heading`, `Text`）は純粋なセマンティック構造と本規約のトークンのみを持つ軽量プリミティブとして構築する。
  - **純粋性**: `components/ui/` 配下のコンポーネントは `domain/`・`storage/`・`features/` へ一切依存してはならない。
  - **配置・公開規約**: `components/ui/{ComponentName}/` ディレクトリに配置し、`index.ts` バレル経由でのみインポートさせる（1ファイル 200行上限・アロー関数統一）。

- **第2層：共有ラッパー層 (`components/shared/`)**:
  - `AppShell`, `ScreenHeader`, `BottomTabNav`, `CurrencyPill`, `ConfirmAlertDialog`, `StateView`, `StatusBadge`, `ItemAvatar`, `SelectableCard`, `StatSummaryGrid`, `WeaponSlotBar`, `AppToastProvider` を配置し、ドメイン型と 5大ステート（Empty / Loading / Success / Error / Disabled）を一元制御する。
  - 非同期保存（IndexedDB 書込）を伴う UI では `isPending: boolean` を伝播させ、二重送信と処理中のモーダル閉じ操作を確実に抑止する。

- **アイコン調達方針**:
  - 標準 UI 操作アイコン（戻る、鍵、一時停止、再生、閉じる、警告等）は **`lucide-react`** を使用する。
  - 作品固有モチーフ（水晶の勾玉、翡翠、武器ジャンル紋章）は `components/icons/` 等に専用 SVG コンポーネントとして定義し、色は必ず `currentColor` またはセマンティックトークンを参照する。

- **フォールバック禁止（厳守）**:
  - `<dialog>`、`<select>`、素の `<div>` クリックによる擬似モーダル/タブ、`window.alert()` / `window.confirm()` / `window.prompt()` の使用は全面禁止とする。
