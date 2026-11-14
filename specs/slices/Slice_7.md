# スライス詳細設計書: Slice 7 — バトル3択成長・リロール・勝敗リザルト・報酬永続化

- **スライスID**: `Slice 7`
- **進捗ステータス**: `[x]` 完了
- **先行依存**: `Slice 6`（完了済み）
- **対象レイヤー**: `domain/` / `storage/` / `engine/` / `features/battle/` / `app/`
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

Slice 6 で構築した 60fps Canvas 2D 戦闘エンジン・DOM HUD・ポーズ・撤退フローの上に、**バトル中の3択レベルアップ成長・勾玉消費リロール・勝敗リザルト・報酬およびステージ解放の IndexedDB 永続化**を貫通実装し、ゲームのコアサイクル（出撃 → 戦闘・ビルド構築 → 帰還・報酬獲得 → 強化・ガチャ・次節挑戦）を完結させる。

1. **バトル中レベルアップ3択成長 (`domain/battle-upgrade.ts`, `engine/`, `LevelUpChoiceModal`)**:
   - 霊力（EXP）が `expToNextLevel` 以上に到達した瞬間、エンジンは `"level_up_modal"` フェーズへ遷移して時間進行を停止し、3択候補（`pendingUpgradeChoices`）を生成して HUD スナップショットで通知する。
   - 候補は `base_stat`（基礎ステータス複利乗算 / 会心率加算）、`weapon_stat`（解放済み武器の威力・攻撃速度・持続時間強化）、`weapon_unlock`（未解放武器の追加アンロック）の3カテゴリから重複なく最大3件を抽選する。
   - 同時発動武器枠が上限（`MAX_ACTIVE_WEAPONS = 3`）に達している場合、または未解放武器が0件の場合は、`weapon_unlock` を抽選プールから確実に除外する。
   - 複数レベル同時上昇時は `pendingLevelUps` カウンタで1回ずつ3択モーダルを消化してから `"playing"` へ復帰する。
2. **勾玉消費リロール（再抽選） (`domain/currency-guard.ts`, `storage/battle-repository.ts`)**:
   - 3択モーダル表示中、プレイヤーは `rerollCostMagatama`（`DEFAULT_REROLL_COST_MAGATAMA = 30`）以上の勾玉を所持していれば「再抽選」を実行できる。
   - 勾玉消費は `rerollBattleChoices(costMagatama)` により単一 `readwrite` トランザクション内で検証・減算・永続化し、成功時のみエンジン側の `pendingUpgradeChoices` を再抽選してモーダル表示を更新する。
   - 残高不足時はボタンを `Disabled` 表示とし、直接実行時も `INSUFFICIENT_MAGATAMA`（403相当）で拒否しトランザクションをアボートする。
3. **勝敗リザルトと報酬・次節解放の永続化 (`domain/battle-reward.ts`, `storage/battle-repository.ts`, `BattleResultModal`)**:
   - **勝利 (`victory`)**: Wave 10 の大妖怪撃破時に `stage.clearReward`（勾玉・翡翠）、初回クリア時のみ `stage.firstClearBonusHisui`、および次節（`unlockRequirementStageId === stage.id`）の `newlyUnlockedStageId` を算出する。
   - **敗北 (`defeat`)**: 結界耐久 0 到達時に、到達ウェーブ数に応じた救済勾玉（`calculateDefeatRescueMagatama(reachedWave)`）を算出する（翡翠・次節解放はなし）。
   - 勝敗確定時に `commitBattleResult(payload)` を単一 `readwrite` トランザクションで 1 回のみ実行し、`currencies`・`clearedStageIds`・`unlockedStageIds`・`updatedAt` をアトミックに永続化する。
   - 永続化完了後に `BattleResultModal` から `/stages` へ帰還する。保存失敗時はモーダル内で再試行導線を提示し、報酬ロストや進行不能を防止する。

### 1.2 既存 Slice 0 〜 Slice 6 資産との接続

既に実装されている以下のモジュール・型を再利用し、破壊的変更を行わない。

- 共通型: [specs/types/battle.ts](../types/battle.ts)（`BattlePhase`, `InGameUpgradeCategory`, `InGameStatType`, `InGameUpgradeOption`, `WeaponModifierState`, `InGameBuffState`, `BattleHudSnapshot`, `BattleResultPayload`）, [specs/types/save.ts](../types/save.ts), [specs/types/common.ts](../types/common.ts)
- セッション管理: [app/session/PlayerSessionContext.tsx](../../app/session/PlayerSessionContext.tsx)（`save`, `isPending`, `applyCommittedSave`）
- ガード・検証: [domain/currency-guard.ts](../../domain/currency-guard.ts)（`guardCurrencySufficient`）, [domain/save-validator.ts](../../domain/save-validator.ts)（`validateAndMigrateSave`）, [domain/stage-select.ts](../../domain/stage-select.ts)（`guardBattleSortie`）, [domain/result.ts](../../domain/result.ts)（`ok`, `err`）
- マスタ: [data/stage-master.ts](../../data/stage-master.ts)（`STAGE_MASTERS`, `STAGE_MASTER_MAP`）, [data/weapon-master.ts](../../data/weapon-master.ts)（`WEAPON_MASTERS`, `WEAPON_MASTER_MAP`）
- エンジン・UI: [engine/battle-engine.ts](../../engine/battle-engine.ts), [engine/battle-state.ts](../../engine/battle-state.ts), [engine/types.ts](../../engine/types.ts), `features/battle/`, `components/ui/Dialog`, `components/shared/CurrencyPill`, `components/shared/WeaponSlotBar`

---

## 2. 共通型・データ整合性 (`specs/types/`・`specs/db.md`)

### 2.1 共通型の非破壊維持

`specs/types/battle.ts` および `specs/types/save.ts` に定義済みの型は一切変更・削除しない。

- `BattleHudSnapshot.pendingUpgradeChoices: readonly InGameUpgradeOption[]` は Slice 6 で空配列 `[]` のみ返していたが、Slice 7 にてエンジンが生成した3択候補をそのまま格納して通知する。
- `BattleResultPayload`（`stageId`, `outcome`, `reachedWave`, `earnedMagatama`, `earnedHisui`, `newlyUnlockedStageId`）をそのまま `calculateBattleRewards` の返却型および `commitBattleResult` の入力検証対象として使用する。

### 2.2 `playerSave` ストア整合性 (`specs/db.md` 準拠)

- **リロール時更新フィールド**: `currencies.magatama`（非負整数減算）、`updatedAt`（ISO 8601）。
- **リザルト確定時更新フィールド**:
  - `currencies.magatama`（整数加算 `>= 0`）
  - `currencies.hisui`（整数加算 `>= 0`）
  - `clearedStageIds`（`victory` 時のみ対象 `stageId` を重複なく追加）
  - `unlockedStageIds`（`victory` かつ `newlyUnlockedStageId !== null` の場合に重複なく追加。`clearedStageIds ⊆ unlockedStageIds` の部分集合制約を常に維持）
  - `updatedAt`（ISO 8601）

---

## 3. ドメイン層設計 (`domain/` — Pure TypeScript)

`domain/` 配下は React・DOM・IndexedDB に一切依存しない純粋関数（`const` アロー関数・1ファイル 200行以下）として構築する。

### 3.1 3択成長・バフ適用 (`domain/battle-upgrade.ts`)

#### 3.1.1 選択肢プール定義と生成 (`generateUpgradeChoices`)

```typescript
export interface GenerateUpgradeChoicesInput {
  readonly buffState: InGameBuffState;
  readonly weaponMap: Readonly<Record<WeaponId, WeaponMaster>>;
  readonly allWeapons: readonly WeaponMaster[];
  readonly maxActiveWeapons?: number; // デフォルト MAX_ACTIVE_WEAPONS (3)
  readonly choiceCount?: number; // デフォルト 3
  readonly rng?: () => number;
}
```

生成ルール:

1. **`weapon_unlock` 候補の構築条件**:
   - `buffState.unlockedWeaponIds.length < maxActiveWeapons` の場合のみ、`allWeapons` のうち `buffState.unlockedWeaponIds` に含まれない武器を `weapon_unlock` 候補として抽出する。
   - **上限到達時（`unlockedWeaponIds.length >= 3`）または未解放武器 0 件時は、`weapon_unlock` を候補プールから完全に除外する。**
2. **`base_stat` 候補**:
   - `atk_pct`（「霊力増幅」: `atkMultiplier *= 1.25` / `multiplierOrDelta: 1.25`）
   - `crit_rate`（「心眼開眼」: `critRateBonusPct += 8` / `multiplierOrDelta: 8`）
   - `crit_dmg`（「会心極意」: `critDamageMultiplier *= 1.25` / `multiplierOrDelta: 1.25`）
3. **`weapon_stat` 候補**（`buffState.unlockedWeaponIds` 内の解放済み武器ごとに生成）:
   - `weapon_dmg`（「{武器名}・威力強化」: `damageMultiplier *= 1.3` / `multiplierOrDelta: 1.3`）
   - `attack_freq`（「{武器名}・連撃加速」: `cooldownMultiplier *= 0.85` / `multiplierOrDelta: 0.85`）
   - `duration`（`baseDurationMs > 0` の武器のみ対象、「{武器名}・持続延長」: `durationMultiplier *= 1.25` / `multiplierOrDelta: 1.25`）
4. **重複なし抽選**:
   - 構築した候補プールから `rng()` を用いた Fisher-Yates シャッフルで先頭 `min(choiceCount, pool.length)` 件を返却する（同一 `id` が同一3択内に重複しない）。

#### 3.1.2 選択肢適用 (`applyUpgradeOption`)

現在の `InGameBuffState` を破壊せず新しい `InGameBuffState` を返す純粋関数として定義する。

| `category`      | `statType`    | 算出式（複利乗算 / 状態更新）                                                                                                                                                                                                    |
| :-------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base_stat`     | `atk_pct`     | `atkMultiplier = buffState.atkMultiplier * option.multiplierOrDelta`                                                                                                                                                             |
| `base_stat`     | `crit_rate`   | `critRateBonusPct = buffState.critRateBonusPct + option.multiplierOrDelta`                                                                                                                                                       |
| `base_stat`     | `crit_dmg`    | `critDamageMultiplier = buffState.critDamageMultiplier * option.multiplierOrDelta`                                                                                                                                               |
| `weapon_stat`   | `weapon_dmg`  | `weaponModifiers[targetWeaponId].damageMultiplier *= option.multiplierOrDelta`                                                                                                                                                   |
| `weapon_stat`   | `attack_freq` | `weaponModifiers[targetWeaponId].cooldownMultiplier *= option.multiplierOrDelta`                                                                                                                                                 |
| `weapon_stat`   | `duration`    | `weaponModifiers[targetWeaponId].durationMultiplier *= option.multiplierOrDelta`                                                                                                                                                 |
| `weapon_unlock` | _(なし)_      | 上限未満かつ未解放かつ `Object.hasOwn(weaponMap, targetWeaponId)` の場合のみ `unlockedWeaponIds` へ追加し、`weaponModifiers[targetWeaponId]` を `{ damageMultiplier: 1, cooldownMultiplier: 1, durationMultiplier: 1 }` で初期化 |

- 不正な `targetWeaponId`、または既に3枠上限に達している状態での `weapon_unlock` 適用は `DomainResult`（または不変フォールバック）で安全に拒否する。

### 3.2 勝敗報酬算出・セーブ適用 (`domain/battle-reward.ts`)

#### 3.2.1 定数・報酬算出 (`calculateBattleRewards`)

- `WAVE_RESCUE_MAGATAMA = 8`（敗北時 1 Wave あたりの救済勾玉定数）

```typescript
export interface CalculateBattleRewardsInput {
  readonly save: PlayerSaveData;
  readonly stage: StageMaster;
  readonly outcome: "victory" | "defeat";
  readonly reachedWave: number;
  readonly allStages: readonly StageMaster[];
}
```

算出ルール:

1. **`outcome === "victory"`**:
   - `isFirstClear = !save.clearedStageIds.includes(stage.id)`
   - `earnedMagatama = stage.clearReward.magatama`
   - `earnedHisui = stage.clearReward.hisui + (isFirstClear ? stage.firstClearBonusHisui : 0)`
   - `nextStage = allStages.find((s) => s.unlockRequirementStageId === stage.id) ?? null`
   - `newlyUnlockedStageId = nextStage && !save.unlockedStageIds.includes(nextStage.id) ? nextStage.id : null`
   - `reachedWave = stage.waves.length`（`10`）
2. **`outcome === "defeat"`**:
   - `safeWave = Math.max(1, Math.min(stage.waves.length, Math.floor(reachedWave)))`
   - `earnedMagatama = safeWave * WAVE_RESCUE_MAGATAMA`
   - `earnedHisui = 0`
   - `newlyUnlockedStageId = null`

#### 3.2.2 ガード付きセーブ適用 (`applyBattleResultToSave`)

`storage/battle-repository.ts` のトランザクション内から呼び出され、サーバー認可相当の検証を行う。

1. **ステージ出撃整合性検証**: `guardBattleSortie(save, payload.stageId, stageMap)` を実行し、未登録ステージ（`INVALID_STAGE_ID`）、未解放ステージ（`STAGE_LOCKED`）、不正装備（`EMPTY_WEAPON_SELECTION` / `UNOWNED_WEAPON`）での報酬確定を 403 相当で拒否する。
2. **サーバー側再計算（改ざん耐性）**: クライアント入力の `payload.earnedMagatama` / `payload.earnedHisui` を盲信せず、トランザクション内で読み込んだ最新の `save` と `STAGE_MASTER_MAP` に基づき `calculateBattleRewards` で正当な報酬・初回ボーナス・次節解放を再計算して適用する（最新セーブ基準で初回ボーナス二重取得を防止）。
3. **コレクション整合性**:
   - `victory` 時のみ `clearedStageIds` に `stage.id` を重複なく追加。
   - `newlyUnlockedStageId` がある場合は `unlockedStageIds` に重複なく追加。
   - `updatedAt = now.toISOString()` を更新。

#### 3.2.3 勾玉リロール適用 (`applyBattleRerollCost`)

- `guardCurrencySufficient(save, "magatama", costMagatama)` を実行し、不足時は `INSUFFICIENT_MAGATAMA` を返却。
- `currencies.magatama = save.currencies.magatama - costMagatama`、`updatedAt = now.toISOString()` を返却。

---

## 4. ストレージ層設計 (`storage/battle-repository.ts`)

[specs/db.md](../db.md) セクション 8.1 に従い、単一 `db.transaction("playerSave", "readwrite")` 内で最新 `"primary"` レコードを読込・検証・更新・保存する。

| 関数名                                    | 処理フロー（単一 `readwrite` トランザクション）                                                                                                                                                | 返却型                                         |
| :---------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| `rerollBattleChoices(costMagatama, now?)` | 1. `store.get("primary")`<br>2. `validateAndMigrateSave`<br>3. `applyBattleRerollCost(save, costMagatama, now)`<br>4. `store.put(nextSave, "primary")` → `tx.done`                             | `Promise<DomainResult<PlayerSaveData>>`        |
| `commitBattleResult(input, now?)`         | 1. `store.get("primary")`<br>2. `validateAndMigrateSave`<br>3. `applyBattleResultToSave(save, input, STAGE_MASTER_MAP, STAGE_MASTERS, now)`<br>4. `store.put(nextSave, "primary")` → `tx.done` | `Promise<DomainResult<CommittedBattleResult>>` |

> [!NOTE]
> `CommittedBattleResult` は `{ readonly save: PlayerSaveData; readonly reward: BattleResultPayload }` とし、トランザクション内で確定した正確な初回ボーナス・次節解放結果をそのままリザルト画面表示へ反映できるようにする。

---

## 5. エンジン層拡張 (`engine/`)

Slice 6 で構築した `BattleEngine` に対し、3択レベルアップ遷移・適用・再抽選 API を接続する。React への依存は一切追加しない。

### 5.1 レベルアップ時のフェーズ遷移 (`engine/battle-state.ts`, `engine/battle-engine.ts`)

1. **レベルアップ検知 (`applyDamageToEnemy`)**:
   - `while (state.exp >= state.expToNextLevel)` ループで `state.level += 1`、残余 EXP 繰り越し、`audio.playLevelUp()` 再生に加え、`state.pendingLevelUps += 1` をインクリメントする。
2. **フェーズ停止と3択生成 (`step` 内)**:
   - 戦闘シミュレーション（`advanceCombatSimulation`）の直後、かつ `victory` / `defeat` 判定で終了していない場合で `state.pendingLevelUps > 0` かつ `state.phase === "playing"` であれば、以下を実行する:
     - `state.pendingUpgradeChoices = generateUpgradeChoices({ buffState: state.buffState, weaponMap, allWeapons: Object.values(weaponMap), rng })`
     - `setPhase("level_up_modal")`（これにより次フレーム以降 `step` 内の戦闘時間進行が完全停止する）。
3. **ビューシグネチャ更新 (`buildViewSignature`)**:
   - `view.hud.pendingUpgradeChoices.map((c) => c.id).join(",")` をシグネチャに含め、リロールで選択肢が差し替わった際も確実に `onViewStateChange` が発火するようにする。

### 5.2 `BattleEngine` 追加メソッド

| メソッド                       | 振る舞い                                                                                                                                                                                                                                                                                                                                                                       |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `applyUpgradeChoice(optionId)` | `state.phase === "level_up_modal"` かつ `pendingUpgradeChoices` に一致する `optionId` がある場合のみ `applyUpgradeOption` を適用する。新規武器アンロック時は `weaponCooldowns.set(id, 0)` を初期化。`pendingLevelUps` を 1 減算し、まだ `> 0` なら次の3択を生成して `"level_up_modal"` を維持、なければ `pendingUpgradeChoices = []` として `setPhase("playing")` へ復帰する。 |
| `rerollUpgradeChoices()`       | `state.phase === "level_up_modal"` の場合のみ `generateUpgradeChoices` で新しい3択を生成して `state.pendingUpgradeChoices` を差し替え、`emitViewStateIfChanged(true)` を発火する。                                                                                                                                                                                             |

---

## 6. UI・フック・セッション接続 (`features/battle/`・`app/`)

すべて [specs/components.md](../components.md) および [.agents/rules/design-rules.md](../../.agents/rules/design-rules.md)（生カラー禁止・4px/8px グリッド・最小 `44x44px` タッチ領域・`open`/`isPending` 規約・アロー関数統一・1ファイル 200行以下）に準拠する。

### 6.1 `useBattleEngine` のセッション更新安定化（重要設計）

Slice 6 の `useBattleEngine(save, stageId)` は `prepareBattleSession(save, stageId)` を `useMemo(..., [save, stageId])` で評価していたため、バトル中にリロール等で `PlayerSessionContext.save` が更新されると `useEffect` が再実行され、`BattleEngine` が初期化されて戦闘状態が失われるリスクがある。

これを防ぐため、Slice 7 では以下の構造へ改善する:

1. **出撃コンテキストのステージ単位固定**: `stageId` が変わらない限り、`BattleEngine` の初期化対象となる `launchContext` は進入時の初回有効 `save` で確定（`useRef` または `stageId` 依存の初期化）し、バトル中の `save` 更新（勾玉減少・リザルト保存）でエンジンを再起動しない。
2. **最新通貨のリアクティブ参照**: `LevelUpChoiceModal` の「再抽選」可否判定には最新の `save.currencies.magatama` を参照する。
3. **非同期アクション統合**:
   - `selectUpgradeChoice(optionId: string)`: `isRerolling || isCommitting` 中は無視し、`engineRef.current?.applyUpgradeChoice(optionId)` を実行。
   - `rerollChoices()`: `isRerolling` を立てて `rerollBattleChoices(rerollCost)` を実行 → 成功時は `applyCommittedSave(res.data)` の後に `engineRef.current?.rerollUpgradeChoices()` を呼び出す。失敗時はエラートーストを表示し選択肢・勾玉ともに不変を保つ。
   - `victory` / `defeat` 到達時の自動報酬永続化: `hasCommittedResultRef` により 1 戦闘につき 1 回のみ `commitBattleResult` を実行し、`applyCommittedSave(res.data.save)` と確定済み `CommittedBattleResult.reward` をステートに保持する。失敗時は `commitError` を保持して再試行ボタンを有効化する。

### 6.2 新規・更新コンポーネント (`features/battle/components/`)

| コンポーネント           | 使用プリミティブ / 共有部品                                                                             | 主な責務・仕様                                                                                                                                                                                                                                                                                                          |
| :----------------------- | :------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LevelUpChoiceModal.tsx` | `ui/Dialog`, `ui/Button`, `ui/Card`, `ui/Badge`, `ui/Typography`, `shared/CurrencyPill`                 | `open={phase === "level_up_modal"}`, `hideCloseButton`, `isPending={isRerolling}`。3択カード（カテゴリバッジ・タイトル・効果説明・最小高さ確保）を選択ボタンとして描画。フッターに現在所持勾玉 `CurrencyPill` と「再抽選（勾玉 {cost}）」ボタンを配置。勾玉不足時・`isRerolling` 時は再抽選ボタンを `Disabled` とする。 |
| `BattleResultModal.tsx`  | `ui/Dialog`, `ui/Button`, `ui/Badge`, `ui/Card`, `ui/Separator`, `ui/Typography`, `shared/CurrencyPill` | `open={isOutcomeReached && fatalError === null}`, `hideCloseButton`, `isPending={isCommitting}`。`victory`（浄化完了・獲得勾玉/翡翠・初回ボーナス・次節解放バッジ）と `defeat`（結界決壊・到達Wave・救済勾玉）を表示。保存エラー時はエラーメッセージ＋「再試行」ボタンと「保存せず戻る」副次導線を提供。                |
| `BattleScreen.tsx`       | 上記2モーダル統合                                                                                       | Slice 6 の暫定リザルト `Dialog` を `BattleResultModal` へ置き換え、`LevelUpChoiceModal` を接続する。`level_up_modal` 表示中も背面 HUD（`1x/2x`, 一時停止）を `controlsDisabled` でロックする。                                                                                                                          |

### 6.3 `app/App.tsx` の接続

- `BattleScreen` へ `onSaveCommitted={applyCommittedSave}`（または `PlayerSessionContext` 連携コールバック）を渡し、リロールおよびバトルリザルト確定時の最新 `PlayerSaveData` が即座にアプリ全体のセッションへ反映されるようにする。

---

## 7. 認可境界・401/403 相当ハンドリング

[specs/auth.md](../auth.md) セクション 3.2・4.1 に完全準拠する。

| 境界ポイント                              | 検証内容                                                                        | 拒否・異常時の振る舞い                                                                                                                                                  |
| :---------------------------------------- | :------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **リロール実行 (`rerollBattleChoices`)**  | `validateAndMigrateSave` + `guardCurrencySufficient(save, "magatama", cost)`    | 401相当（`SAVE_CORRUPTED`）→ 保存中止・エラートースト通知。<br>403相当（`INSUFFICIENT_MAGATAMA`）→ トランザクションアボート・勾玉不変・選択肢不変・エラートースト通知。 |
| **リザルト永続化 (`commitBattleResult`)** | `validateAndMigrateSave` + `guardBattleSortie(save, stageId, STAGE_MASTER_MAP)` | 401相当（`SAVE_CORRUPTED`）→ 保存中止・リトライ導線。<br>403相当（`STAGE_LOCKED` / `INVALID_STAGE_ID` / `UNOWNED_WEAPON`）→ 報酬付与を拒否しトランザクションアボート。  |
| **ブラウザストレージ障害**                | IndexedDB `readwrite` トランザクション例外                                      | 例外を構造化ログに記録し、`STORAGE_ERROR` を返却。リザルトモーダル上で「再試行して受け取る」導線を提示。                                                                |
| **ラン内武器上限**                        | `unlockedWeaponIds.length < MAX_ACTIVE_WEAPONS (3)`                             | 上限到達時は `weapon_unlock` 候補を生成しない。万一直接適用されても `applyUpgradeOption` で追加を拒否。                                                                 |

---

## 8. 5大ステート網羅表 (`level-up-choice-modal` / `battle-result-modal`)

| ステート                    | 3択成長モーダル (`level-up-choice-modal`)                                                                                                            | 勝敗リザルトモーダル (`battle-result-modal`)                                                                                                         |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty**                   | 候補が0件になる異常ケースを想定し、フォールバック「戦闘を続ける」導線を備える（通常は常に1〜3件生成）。                                              | リザルト確定前はモーダル非表示（`open={false}`）。                                                                                                   |
| **Loading**                 | `isRerolling === true`（勾玉消費保存中）は再抽選ボタンを `isPending` 表示し、3択選択を含む全操作をロックする。                                       | `isCommitting === true`（報酬永続化トランザクション中）は「報酬を保存中…」を表示し、「ステージ選択へ戻る」ボタンを `isPending` + `Disabled` とする。 |
| **Success**                 | 3択カードと所持勾玉・リロールボタンを表示。選択で即バフ適用して戦闘再開、リロールで勾玉減算＋新3択提示。                                             | 確定済み報酬（勾玉・翡翠・初回ボーナス・次節解放バッジ／敗北救済勾玉）を表示し、「ステージ選択へ戻る」で `/stages` へ遷移する。                      |
| **Error**                   | リロール保存失敗時（`STORAGE_ERROR` 等）は勾玉・選択肢を変更せず、エラートーストを表示して再操作を許可する。                                         | 永続化失敗時はモーダル内にエラーアラートと「再試行して受け取る」ボタンを表示（どうしても保存不可な環境向けに「保存せず戻る」副次ボタンを用意）。     |
| **Disabled / Unauthorized** | `save.currencies.magatama < rerollCostMagatama` の場合、「再抽選」ボタンを `Disabled`（不足表示）とする。モーダル表示中は背面 HUD を操作不可とする。 | 保存中・エラー中は確定遷移ボタンを `Disabled` とする。不正ステージの報酬コミットは `guardBattleSortie` で 403 相当拒否する。                         |

---

## 9. テスト計画・完了条件（Acceptance Criteria）

### 9.1 自動テスト計画（Vitest — No Hollow Mocks）

| テストファイル                                  | 検証項目                                                                                                                                                                                                      |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `domain/battle-upgrade.test.ts`                 | 複利乗算計算（`atkMultiplier` 複数回取得等）、会心率加算・武器別倍率更新、武器3枠到達時の `weapon_unlock` 候補除外、3枠超過時の直接適用拒否                                                                   |
| `domain/battle-reward.test.ts`                  | 勝利時報酬＋初回クリア翡翠ボーナス＋次節解放判定、既クリア周回時の初回ボーナス除外、敗北時到達Wave救済勾玉計算、不正ステージID/未解放ステージでの報酬適用拒否（`STAGE_LOCKED` / `INVALID_STAGE_ID`）          |
| `storage/battle-repository.test.ts`             | `rerollBattleChoices` の勾玉消費永続化＆不足時 `INSUFFICIENT_MAGATAMA` 拒否（残高不変）、`commitBattleResult` の報酬・`clearedStageIds`・次節 `unlockedStageIds` アトミック保存＆破損時 `SAVE_CORRUPTED` 拒否 |
| `engine/battle-engine.test.ts`（拡張）          | 霊力 MAX 到達で `phase === "level_up_modal"` へ遷移・時間停止、`applyUpgradeChoice` 適用後の戦闘再開、複数レベル同時上昇の連続消化、`rerollUpgradeChoices` による候補差し替え                                 |
| `features/battle/BattleScreen.test.tsx`（拡張） | 3択モーダル表示・選択復帰、勾玉不足時の再抽選 `Disabled`、リロール実行による勾玉更新（エンジン非リセット確認）、勝利/敗北リザルト表示と `commitBattleResult` 呼び出し・`/stages` 帰還                         |

### 9.2 完了条件（Slice 7 Acceptance Criteria）

1. 霊力 MAX 到達で `LevelUpChoiceModal` が開き、複利乗算ステータス強化または未解放武器の追加開放（最大計3枠、上限到達時は `weapon_unlock` 除外）が戦闘へ即座に反映される。
2. 勾玉残高が不足している場合「再抽選」ボタンは `Disabled` となり、直接実行は `INSUFFICIENT_MAGATAMA` で拒否される。成功時は勾玉減算が IndexedDB へ永続化され、進行中の戦闘エンジンをリセットせずに3択が更新される。
3. Wave 10 ボス撃破（`victory`）で報酬・初回翡翠ボーナス・次節解放が、結界HP 0（`defeat`）で救済勾玉が IndexedDB へアトミック保存され、`BattleResultModal` から `/stages` へ帰還できる。
4. すべての新規・更新ファイルが 200行以下（テストファイルは 350行以下）、生カラー直書きゼロ、`any` ゼロ、`pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm test` が全パスする。
