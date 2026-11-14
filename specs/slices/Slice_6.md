# スライス詳細設計書: Slice 6 — バトル中核（Canvas 2D戦闘・HUD・ポーズ・撤退）

- **スライスID**: `Slice 6`
- **進捗ステータス**: `[~]` 進行中
- **先行依存**: `Slice 5`（完了済み）
- **対象レイヤー**: `data/` / `engine/` / `components/ui/` / `components/shared/` / `features/battle/` / `app/`
- **準拠仕様書**:
  - [specs/slices.md](../slices.md)
  - [specs/db.md](../db.md)
  - [specs/auth.md](../auth.md)
  - [specs/components.md](../components.md)
  - [specs/screens.md](../screens.md)
  - [specs/requirements.md](../requirements.md)
  - [.agents/rules/coding-rules.md](../../.agents/rules/coding-rules.md)
  - [.agents/rules/design-rules.md](../../.agents/rules/design-rules.md)

---

## 1. 目的とスコープ

### 1.1 目的

Slice 0〜5 で構築したセッション基盤・永続育成・編成・ステージ選択・出撃ルートガードの上に、**バトル画面（`/battle/:stageId`）の中核戦闘エンジンおよび DOM HUD・ポーズ・撤退フロー**を貫通実装し、以下のユースケースを完結させる。

1. **Canvas 2D 60fps 戦闘エンジン (`engine/`)**:
   - `requestAnimationFrame` ループを React 状態ツリーから完全に分離（`useRef` 保持）し、60fps で安定した戦闘シミュレーションとプロシージャル描画を実行する。
   - 編成画面で選択した主人公1名の**固有パッシブスキル（3種）**と、持ち込み主武器1枠（`equippedWeaponId`）で戦闘を開始する。
   - 結界に最も近い妖怪を自動索敵するオートエイム、**全9系統の武器ジャンル挙動**、全10ウェーブの妖怪出現・進軍・接触ダメージ・会心計算・EXP 獲得を処理する。
   - 将来の効果音・BGM 拡張に備え、v1 では無音実装となる **No-op Audio 抽象（`BattleAudioPort`）** をエンジンイベントに組み込む。
2. **DOM HUD オーバーレイと速度・ポーズ操作 (`features/battle/`, `components/`)**:
   - Canvas 上部にステージ名・現在ウェーブ（`Wave X / 10`）・等速(`1x`)/2倍速(`2x`)切替（`ui/Toggle`）・一時停止ボタン・結界耐久バー（`ui/Progress`）・霊力ゲージ（`ui/Progress`）＆レベルを表示する。
   - Canvas 下部に解放済み武器スロットバー（`shared/WeaponSlotBar`：最大3枠、Slice 6 開始時は持ち込み1枠＋空き2枠）を表示する。
   - エンジンからは HUD 値が変化した時のみ `BattleHudSnapshot` を通知し、不要な React 再描画を抑止する。
3. **ポーズモーダル・確認付き撤退 (`battle-pause-modal`)**:
   - 一時停止ボタン押下でシミュレーション時間を完全停止し、`ui/Dialog` ベースのポーズモーダルを表示する。
   - ポーズモーダル内では現在の合算ステータス・固有パッシブ・解放済み武器（`shared/WeaponSlotBar`）を確認でき、「戦闘を再開」または「ステージ選択へ撤退」を選択できる。
   - 「ステージ選択へ撤退」押下時は `shared/ConfirmAlertDialog` により確認を行い、承認時のみオンメモリ戦闘状態を破棄して `/stages` へ帰還する（IndexedDB 書き込みなし）。
4. **例外・異常系の安全停止と復旧**:
   - Canvas 2D コンテキスト取得失敗やアニメーションループ内の予期せぬ例外発生時は、即座にループを停止して安全状態へ移行し、エラーモーダル（`BattleErrorModal`）から `/stages` へ帰還できるようにする。

### 1.2 既存 Slice 0 〜 Slice 5 資産との接続

既に実装されている以下のモジュール・コンポーネントを再利用し、重複実装・破壊的変更を行わない。

- セッション管理: [app/session/PlayerSessionContext.tsx](../../app/session/PlayerSessionContext.tsx)（`status`, `save`, `error`, `isPending`）
- ルーター: [app/router/useHashRouter.ts](../../app/router/useHashRouter.ts)（`useHashRouter`）
- セッション・出撃ガード: [domain/session-guard.ts](../../domain/session-guard.ts)（`guardProtectedRouteAccess`）, [domain/stage-select.ts](../../domain/stage-select.ts)（`guardBattleSortie`）
- メタステータス算出: [domain/enhance.ts](../../domain/enhance.ts)（`calculateTotalMetaStats`）
- 編成ラベル: [domain/formation.ts](../../domain/formation.ts)（`WEAPON_GENRE_LABELS`）
- マスタデータ: [data/character-master.ts](../../data/character-master.ts), [data/weapon-master.ts](../../data/weapon-master.ts), [data/stage-master.ts](../../data/stage-master.ts), [data/enemy-master.ts](../../data/enemy-master.ts)
- 共通 UI 部品: `AppShell`, `ConfirmAlertDialog`, `StateView`, `ItemAvatar`, `AppToastProvider`, `ui/AspectRatio`, `ui/Avatar`, `ui/Badge`, `ui/Button`, `ui/Card`, `ui/Dialog`, `ui/Tooltip`, `ui/Typography`, `ui/VisuallyHidden`

### 1.3 スコープ外（Slice 7 へ委譲）

- 霊力 MAX 到達時のレベルアップ3択成長モーダル（`level-up-choice-modal`）、勾玉消費による候補再抽選（`rerollBattleChoices`）、武器追加アンロック選択 UI
- Wave10 ボス撃破（`victory`）または結界耐久 0（`defeat`）時の勝敗リザルトモーダル（`battle-result-modal`）および報酬・次節解放の IndexedDB 永続化（`commitBattleResult`）
- ※ただし、Slice 6 の `BattleEngine` は `level_up_modal` / `victory` / `defeat` へのフェーズ遷移トリガーと、Slice 7 が接続できるコールバック・公開メソッドを備える。

---

## 2. 共通型・マスタデータ整合性 (`types/`・`data/`)

### 2.1 共通型の非破壊維持 (`specs/types/battle.ts`)

`types/battle.ts`（[specs/types/battle.ts](../types/battle.ts)）に定義済みの `BattlePhase`, `BattleHudSnapshot`, `InGameBuffState`, `WeaponModifierState`, `InGameUpgradeOption` は**一切破壊的変更を行わない**。

- `BattleHudSnapshot` に存在しないフィールド（`unlockedWeaponIds`, `weaponModifiers`, `buffState` 等）は共通型を変更して追加するのではなく、フック・UI 境界専用のビューモデル `BattleViewState` で合成して保持する。

```ts
export interface BattleViewState {
  readonly hud: BattleHudSnapshot;
  readonly buffState: InGameBuffState;
  readonly activeEnemyCount: number;
}
```

### 2.2 武器マスタ 9系統の補完 (`data/weapon-master.ts`)

`types/common.ts` では `WeaponGenre` として全9系統（`sword`, `bow`, `shuriken`, `mirror`, `talisman`, `matchlock`, `fan`, `bell`, `orb`）が定義されている一方、現行の `data/weapon-master.ts` には初期実装の3系統（`sword_hamon`, `bow_azusa`, `shuriken_kaze`）のみが登録されている。
Slice 6 の完了条件「9系統すべての武器ジャンル挙動が仕様通り動作する」を満たし、かつガチャ・編成・ラン内アンロックと一貫させるため、`data/weapon-master.ts` に残り6系統の武器マスタを追加する（既存3武器の ID・数値・`isInitial` は変更しない）。

| 武器ID                  | 武器名       | ジャンル (`WeaponGenre`) | 固有パラメータ (`genreParams`)                    | 初期所持 |
| :---------------------- | :----------- | :----------------------- | :------------------------------------------------ | :------: |
| `sword_hamon`           | 銘刀・波紋   | `sword`                  | `range: 160, arcDeg: 110`                         |  `true`  |
| `bow_azusa`             | 破魔の梓弓   | `bow`                    | `pierceCount: 3`                                  | `false`  |
| `shuriken_kaze`         | 風魔手裏剣   | `shuriken`               | `projectileCount: 3, spreadDeg: 28`               | `false`  |
| `mirror_yata`           | 八咫の霊鏡   | `mirror`                 | `range: 240, tickIntervalMs: 180, bounceCount: 1` | `false`  |
| `talisman_goou`         | 牛王宝印符   | `talisman`               | `homingTurnRate: 4.5, explosionRadius: 56`        | `false`  |
| `matchlock_tanegashima` | 破邪火縄銃   | `matchlock`              | `explosionRadius: 72, splashRatio: 0.75`          | `false`  |
| `fan_tengu`             | 天狗の大団扇 | `fan`                    | `range: 190, arcDeg: 95, knockbackPx: 68`         | `false`  |
| `bell_kagura`           | 神楽の霊鈴   | `bell`                   | `maxRadius: 175`                                  | `false`  |
| `orb_magatama`          | 陰陽旋回珠   | `orb`                    | `orbCount: 3, orbitRadius: 88, angularSpeed: 2.8` | `false`  |

> [!NOTE]
> `domain/gacha.test.ts` は `WEAPON_MASTERS.length` を動的に参照しているため、9系統への拡張は既存テストを破壊せず、ガチャ排出プールも全9系統へ自然に拡張される。

---

## 3. バトルエンジン設計 (`engine/` — Pure TypeScript)

`engine/` 配下は **React / DOM コンポーネントへの依存を禁止**し、純粋 TypeScript（アロー関数・`const` 統一、1ファイル 200行以下）で構築する。Canvas 2D コンテキストのみ `CanvasRenderingContext2D` インターフェース経由で受け取る。

### 3.1 ファイル構成と責務分割（200行制限準拠）

| ファイルパス                         | 責務                                                                                                                                                                                                                                                                                            | 行数目安 |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| `engine/types.ts`                    | 論理座標定数（`BATTLE_FIELD_WIDTH = 420`, `BATTLE_FIELD_HEIGHT = 640`, `BARRIER_CENTER_X = 210`, `BARRIER_CENTER_Y = 548`, `BARRIER_RADIUS = 56`）、エンティティ型、`BattleEngineConfig`、`BattleEngineCallbacks`                                                                               |  ~140行  |
| `engine/palette.ts`                  | `tokens.css` の CSS カスタムプロパティ（`--battle-surface`, `--barrier`, `--exp`, `--primary`, `--accent`, `--destructive`, `--hisui`, `--magatama`, `--battle-foreground` 等）を解決する描画パレット。非ブラウザ環境（Vitest）用フォールバック定義を内蔵し、他ファイルへの生カラー直書きを禁止 |  ~90行   |
| `engine/audio.ts`                    | `BattleAudioPort` インターフェース（`playWeaponFire`, `playHit`, `playWaveStart`, `playLevelUp`, `playVictory`, `playDefeat`）および `createNoopBattleAudio()`                                                                                                                                  |  ~50行   |
| `engine/damage.ts`                   | メタステータス・精錬Lv・ラン内バフ（複利乗算）・主人公パッシブ3種の効果算出、および会心判定・ダメージ計算純粋関数                                                                                                                                                                               |  ~120行  |
| `engine/weapons/resolve-weapon.ts`   | `WeaponGenre` 9系統のストラテジーディスパッチ（共通インターフェース `WeaponExecutionContext`）                                                                                                                                                                                                  |  ~130行  |
| `engine/weapons/weapon-behaviors.ts` | 9系統の個別発射・更新・衝突ロジック補助（長射程貫通、扇状斬撃、多重拡散、照射ビーム、追尾爆発、着弾範囲爆発、突風ノックバック、全方位波動、旋回オービット）                                                                                                                                     |  ~180行  |
| `engine/spawner.ts`                  | `StageMaster.waves`（全10ウェーブ）に基づく敵スポーンキュー生成・Wave 進行・敵移動・結界接触ダメージ処理                                                                                                                                                                                        |  ~140行  |
| `engine/renderer.ts`                 | Canvas 2D プロシージャル描画（夜陰穢土背景・鳥居/和柄グリッド・守護結界・主人公・妖怪・各種術エフェクト・フローティングダメージ数値）                                                                                                                                                           |  ~180行  |
| `engine/battle-engine.ts`            | `BattleEngine` 本体（`requestAnimationFrame` ループ、`dt` クランプ、`gameSpeed` 1x/2x、`phase` 状態遷移、`try/catch` 安全停止＆ `onFatalError` 通知）                                                                                                                                           |  ~190行  |
| `engine/index.ts`                    | パブリック API バレルエクスポート                                                                                                                                                                                                                                                               |  ~30行   |

### 3.2 論理座標系とスケーリング

- Canvas の内部論理解像度は **`420 x 640`（アスペクト比 約 `9:13.7`）** とし、物理ピクセルには `window.devicePixelRatio`（最大 `2` にクランプ）を乗算して鮮明な描画を維持する。
- **主人公および守護結界の配置**:
  - 中心座標: `(210, 548)`（画面下部中央）
  - 守護結界半径: `56px`
- **妖怪の進軍**:
  - 画面上部 `y = -24`、`x = 36 〜 384` の範囲からスポーンし、結界中心 `(210, 548)` へ向かって直線進軍する。
  - 結界外周（中心との距離 `<= BARRIER_RADIUS + enemy.radius`）へ到達した妖怪は結界へ接触し、一定間隔（`1000ms`）または接触時に `contactDamage` を与え、自身は小幅に反発する。

### 3.3 ステータス・固有パッシブ・9系統武器仕様

1. **バトル開始時の初期ステータス算出 (`engine/damage.ts`)**:
   - `totalMeta = calculateTotalMetaStats(save, characterMaster)` を使用する（既存 `domain/enhance.ts` 再利用）。
   - `barrierMaxHp = totalMeta.hp`、`barrierHp = totalMeta.hp`。
   - **主人公固有パッシブ効果（3種）**:
     - `barrier_regen`（見習い陰陽師）: `value = baseValue + awakeningLevel * valuePerAwakening`（HP/秒）。`playing` フェーズ中、毎秒 `Math.min(barrierMaxHp, barrierHp + value * dtSec)` で回復する。
     - `luk_and_drop_boost`（白狐の巫女・稲荷）: `value = baseValue + awakeningLevel * valuePerAwakening`（%）。会心率に `+value` を加算し、妖怪撃破時の獲得 EXP に `*(1 + value / 100)` を乗算する。
     - `attack_speed_boost`（朧月・影忍）: `value = baseValue + awakeningLevel * valuePerAwakening`（%）。全武器のクールダウン倍率に `1 / (1 + value / 100)` を適用する。
2. **ダメージ・会心計算式**:
   - 武器基礎威力: `weaponPower = weaponMaster.baseDamage + refineLevel * weaponMaster.damagePerRefine`
   - 基礎火力係数: `atkFactor = totalMeta.atk / 20`（初期主人公 `baseAtk = 20` で `1.0` 倍基準）
   - ラン内複利乗算バフ: `weaponPower * atkFactor * buffState.atkMultiplier * weaponMod.damageMultiplier`
   - 会心判定: `critChancePct = clamp(totalMeta.luk + passiveLukBonus + buffState.critRateBonusPct, 0, 100)`。会心時は `buffState.critDamageMultiplier`（初期 `1.5`）を乗算する。
3. **9系統の武器ジャンル挙動 (`engine/weapons/`)**:
   - すべての武器はクールダウン完了時に「結界中心に最も近い生存中の妖怪」を索敵して自動発動する（敵が0体の場合は待機）。
   - `bow`（弓矢系）: 最も近い敵方向へ高速直線弾を発射。`pierceCount` 体まで貫通してダメージを与える。
   - `sword`（刀剣系）: 最も近い敵方向へ扇状斬撃アーク（半径 `range`、角度 `arcDeg`）を生成し、範囲内の全敵に即座に斬撃ダメージを与える。
   - `shuriken`（手裏剣系）: `projectileCount` 発を `spreadDeg` 間隔で扇状に同時発射する高連射投擲。
   - `mirror`（鏡系）: 最も近い敵へ持続照射レーザーを放ち、`tickIntervalMs` ごとに連続ダメージを与える（`durationMs` 継続）。
   - `talisman`（呪符系）: 敵を緩やかに追尾（`homingTurnRate`）する呪符弾を発射し、命中時に `explosionRadius` の範囲小爆発を起こす。
   - `matchlock`（火縄銃系）: 高速・高威力の弾丸を発射し、着弾点を中心に `explosionRadius` の範囲爆発（周囲へ `splashRatio` ダメージ）を与える。
   - `fan`（扇・軍配系）: 最も近い敵方向へ扇状の突風（`range`, `arcDeg`）を放ち、ダメージとともに敵を結界から遠ざける方向へ `knockbackPx` ノックバックさせる。
   - `bell`（神具・鈴系）: 結界中心から全方位へ広がる円形衝撃波（最大半径 `maxRadius`）を発生させ、通過した全敵にダメージを与える。
   - `orb`（霊珠・勾玉系）: `orbCount` 個の霊珠が結界周囲（半径 `orbitRadius`）を `angularSpeed` で常時旋回し、接触した敵へ連続削りダメージを与える（`cooldownMs` はヒット間隔または再展開に適用）。

### 3.4 バトルフェーズ状態マシンと安全停止

- **フェーズ定義 (`BattlePhase`)**:
  - `"preparing"`: 開始直後の短時間演出（`1.2` 秒経過または即時開始で `"playing"` へ遷移。`Wave 1 / 10` 表示）。
  - `"playing"`: シミュレーション進行中（`dtSec * gameSpeed` で更新）。
  - `"paused"`: ポーズモーダル表示中。`dt` 更新を完全停止し、描画のみ静止状態を維持する。
  - `"level_up_modal"`: EXP が `expToNextLevel` 以上になった瞬間に遷移し、時間進行を停止する（Slice 6 では Slice 7 未接続時のフォールバックとして、または公開 API `applyExternalUpgrade` 経由で復帰可能な設計とする。Slice 6 単体動作時は EXP ゲージとレベルアップ到達のテスト・イベント発火が可能）。
  - `"victory"`: Wave 10 の全敵（ボス含む）を撃破した瞬間に遷移し、ループを停止する。
  - `"defeat"`: `barrierHp <= 0` になった瞬間に遷移し、ループを停止する。
- **例外安全停止**:
  - `requestAnimationFrame` の各フレーム更新・描画を `try { ... } catch (err) { ... }` で保護する。
  - 例外捕捉時は即座に `cancelAnimationFrame` を呼び出してループを停止し、構造化エラーログ（`console.error`）を出力した上で `callbacks.onFatalError(message)` を通知する。

---

## 4. 認可境界・ルートガード・401/403 相当ハンドリング

[specs/auth.md](../auth.md) セクション 3.3・4.1 および [specs/db.md](../db.md) に完全準拠する。

| 境界ポイント                        | 検証内容                                                                                  | 拒否・異常時の振る舞い                                                                                                                                                                                                                    |
| :---------------------------------- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ルート進入 (`app/App.tsx`)**      | `guardProtectedRouteAccess(save, route.battleStageId)`                                    | 401相当（`SAVE_CORRUPTED`）→ `/` エラー復旧画面へリダイレクト。<br>403相当（`INVALID_STAGE_ID` / `STAGE_LOCKED` / `EMPTY_WEAPON_SELECTION` / `UNOWNED_WEAPON` / `UNOWNED_CHARACTER`）→ `/stages` へ置換リダイレクト＋エラートースト通知。 |
| **マスタ参照 (`features/battle/`)** | `Object.hasOwn(STAGE_MASTER_MAP, stageId)` / `CHARACTER_MASTER_MAP` / `WEAPON_MASTER_MAP` | 万一マスタ不整合が検出された場合はエンジンを起動せず、`BattleErrorModal` を表示して `/stages` へ帰還させる。                                                                                                                              |
| **Canvas / ループ異常**             | `canvas.getContext("2d") === null` またはループ内例外                                     | ループを即座に停止し、`BattleErrorModal`（「戦闘処理で問題が発生しました」）＋「ステージ選択へ戻る」ボタンを表示する。                                                                                                                    |
| **永続化境界 (Slice 6)**            | `playerSave` は読込専用                                                                   | Slice 6 では IndexedDB への書き込みは一切行わない。撤退時はオンメモリ状態を破棄して `/stages` へ遷移する。                                                                                                                                |

---

## 5. UI コンポーネント・画面設計 (`components/`・`features/battle/`・`app/`)

すべて [specs/components.md](../components.md) および [.agents/rules/design-rules.md](../../.agents/rules/design-rules.md) に準拠し、生カラー直書き禁止・4px/8px グリッド・最小 `44x44px` タッチ領域・`touch-action: manipulation`・アロー関数統一・1ファイル200行以下を徹底する。

### 5.1 新規調達 UI プリミティブ (`components/ui/`)

1. **`components/ui/Progress/`** (`@radix-ui/react-progress` ラッパー)
   - Compound Component API: `Progress.Root`, `Progress.Indicator`
   - Props: `value: number`, `max?: number`, `variant?: "barrier" | "exp" | "primary"`
   - トークン配色: `variant="barrier"` は `bg-barrier`、`variant="exp"` は `bg-exp`、トラックは `bg-muted` / `rounded-sm`。
2. **`components/ui/Toggle/`** (`@radix-ui/react-toggle` ラッパー)
   - Props: `pressed: boolean`, `onPressedChange: (pressed: boolean) => void`, `disabled?: boolean`, `aria-label`
   - 最小 `min-h-11 min-w-11`（`44x44px`）、`aria-pressed` 自動付与、押下時は `bg-accent text-accent-foreground`、非押下時は `bg-secondary text-secondary-foreground`。

### 5.2 新規共有ラッパー (`components/shared/`)

1. **`components/shared/WeaponSlotBar/`**
   - バトル下部 HUD および `battle-pause-modal` 内で共用する最大3枠の武器スロットバー。
   - Props: `unlockedWeaponIds: readonly WeaponId[]`, `weaponMap?: Readonly<Record<WeaponId, WeaponMaster>>`, `maxSlots?: number`（デフォルト `3`）, `compact?: boolean`
   - 解放済み枠は `ItemAvatar`＋武器名（または短縮名）＋ジャンル `Badge` を表示し、未開放枠は点線枠（`border-border bg-muted/40`）＋「空き枠」として表示する。

### 5.3 バトル画面モジュール (`features/battle/`)

| ファイルパス                                      | 責務                                                                                                                                                                                                                                                                                      |
| :------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/battle/hooks/useBattleEngine.ts`        | `canvasRef` と `engineRef` を管理し、`BattleEngine` を初期化・破棄する。`BattleHudSnapshot` / `InGameBuffState` 変化時のみ React state を更新し、`toggleSpeed`・`pause`・`resume`・`retry` アクションを提供する。                                                                         |
| `features/battle/components/BattleHudOverlay.tsx` | 上部 HUD（ステージ名、`Wave X / 10`、`1x`/`2x` `ui/Toggle`、一時停止 `ui/Button`＋`Pause` アイコン、結界HP `ui/Progress`、霊力EXP `ui/Progress`＆`Lv.X`）と下部 `WeaponSlotBar` を描画する。モーダル表示中は操作ボタンを `disabled` とする。                                              |
| `features/battle/components/BattlePauseModal.tsx` | `ui/Dialog` を用いた一時停止モーダル（`open`, `onOpenChange`）。主人公名・固有パッシブ名・現在バフ倍率・`WeaponSlotBar` を表示し、「戦闘を再開」「ステージ選択へ撤退」ボタンを提供する。                                                                                                  |
| `features/battle/components/BattleErrorModal.tsx` | `ui/Dialog` による Canvas 初期化失敗／実行時例外エラーモーダル。エラーメッセージと「ステージ選択へ戻る」ボタンを提供する。                                                                                                                                                                |
| `features/battle/BattleScreen.tsx`                | `ui/AspectRatio` 内に `<canvas>` を配置し、`BattleHudOverlay`・`BattlePauseModal`・`ConfirmAlertDialog`（撤退確認）・`BattleErrorModal` を統合する。Slice 6 段階の `victory` / `defeat` 到達時は Slice 7 実装前の安全な帰還導線（暫定結果表示＋`/stages` 帰還）を用意し、進行不能を防ぐ。 |
| `features/battle/index.ts`                        | `BattleScreen` をバレルエクスポートする。                                                                                                                                                                                                                                                 |

### 5.4 ルーター接続 (`app/App.tsx`)

- `AppShellContent` 内の `canEnterBattle` 分岐にある `<BattlePlaceholderCard ... />` を `<BattleScreen save={save} stageId={route.battleStageId} onExitToStages={() => navigate("/stages", true)} />` に置き換える。
- `hideBottomNav={isBattleRoute}` は既存実装を維持し、バトル中は共通4タブフッターを非表示にする。

---

## 6. 5大ステート網羅表 (`battle` 画面)

| ステート                    | 条件                                                                    | UI 表示・振る舞い                                                                                                                                                            |
| :-------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty**                   | `phase === "preparing"`（バトル開始直後 1.2秒間）                       | Canvas 背景・結界・主人公を表示し、HUD 上部に「第壱節 開戦」等のウェーブ開始バッジを表示して第1ウェーブ出現を待機する。                                                      |
| **Loading**                 | セッション読込中または Canvas 初期化中（`isInitializing`）              | `StateView` / ローディング表示（「霊脈接続中…」）を表示し、操作ボタンをロックする。                                                                                          |
| **Success**                 | `phase === "playing" \| "paused"`                                       | 60fps で Canvas 戦闘を描画し、状態変化時のみ HUD（結界HP・EXP・Wave）を同期する。`1x`/`2x` 切替・ポーズモーダル・撤退確認が正常動作する。                                    |
| **Error**                   | `battleError !== null`（2D Context 取得不可・ループ例外・マスタ不整合） | アニメーションループを即座に停止し、`BattleErrorModal`（内部スタック非露出）と「ステージ選択へ戻る」導線を表示する。                                                         |
| **Disabled / Unauthorized** | ルートガード拒否 / モーダル表示中の背面 HUD                             | 未解放・不正ステージ・武器未選択時は進入前に `/stages` へ差し戻す。ポーズ・エラー・撤退確認モーダル表示中は背面の `1x`/`2x` トグルおよび一時停止ボタンを `disabled` とする。 |

---

## 7. テスト計画・完了条件（Acceptance Criteria）

### 7.1 自動テスト計画（Vitest）

| テストファイル                            | 検証項目                                                                                                                                                                                                       |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine/damage.test.ts`                   | メタステータス＋精錬＋複利乗算バフの計算、会心率クランプ、主人公3種固有パッシブ（`barrier_regen`, `luk_and_drop_boost`, `attack_speed_boost`）効果検証                                                         |
| `engine/weapons/weapon-behaviors.test.ts` | **9系統すべての武器ジャンル**（`sword`, `bow`, `shuriken`, `mirror`, `talisman`, `matchlock`, `fan`, `bell`, `orb`）の発動・索敵・衝突・ダメージ/ノックバック/旋回動作検証                                     |
| `engine/battle-engine.test.ts`            | `preparing` → `playing` 遷移、全10ウェーブ進行、Wave10 ボス撃破で `victory`、結界HP 0 で `defeat`、`pause()` 中の時間停止、`setGameSpeed(2)` の2倍速進行、ループ例外発生時の安全停止＆ `onFatalError` 通知検証 |
| `features/battle/BattleScreen.test.tsx`   | HUD 要素表示、`1x`/`2x` 切替、ポーズモーダル表示・再開、撤退確認モーダル承認時のみ `/stages` 帰還（キャンセル時は継続）、Canvas コンテキスト失敗時のエラーモーダル表示検証                                     |

### 7.2 完了条件（Slice 6 Acceptance Criteria）

1. Canvas 2D が React 状態と分離されて 60fps で動作し、`1x`/`2x` 切替・一時停止・再開・確認モーダル付き撤退（`/stages` 帰還）が機能する。
2. 持ち込み武器1枠から戦闘が開始され、9系統すべての武器ジャンル挙動および主人公3種の固有パッシブ効果が仕様通り動作する。
3. Canvas 初期化失敗またはループ例外時に安全停止し、エラーモーダルと `/stages` 帰還導線が表示される。
4. すべての新規・更新ファイルが 200行以下（テストファイルは 350行以下）、生カラー直書きゼロ、`any` ゼロ、`pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm test` が全パスする。
