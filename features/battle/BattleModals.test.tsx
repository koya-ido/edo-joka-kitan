import { BattleResultModal } from "@/features/battle/components/BattleResultModal";
import { LevelUpChoiceModal } from "@/features/battle/components/LevelUpChoiceModal";
import type { BattleResultPayload, InGameUpgradeOption } from "@/types";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const SAMPLE_CHOICES: readonly InGameUpgradeOption[] = [
  {
    id: "base_atk_pct",
    category: "base_stat",
    statType: "atk_pct",
    title: "霊力増幅",
    description: "全攻撃力 ×1.25（複利乗算）",
    multiplierOrDelta: 1.25,
  },
  {
    id: "weapon_dmg_sword_hamon",
    category: "weapon_stat",
    targetWeaponId: "sword_hamon",
    statType: "weapon_dmg",
    title: "銘刀・波紋・威力強化",
    description: "ダメージ ×1.30",
    multiplierOrDelta: 1.3,
  },
  {
    id: "weapon_unlock_bow_azusa",
    category: "weapon_unlock",
    targetWeaponId: "bow_azusa",
    title: "新武器開放：破魔の梓弓",
    description: "破魔の梓弓を獲得",
    multiplierOrDelta: 1,
  },
];

describe("features/battle Slice 7 modals (5-State, Double-Submit, Disabled)", () => {
  afterEach(() => {
    cleanup();
  });

  it("LevelUpChoiceModal handles Empty, Success, Disabled (insufficient magatama), and Loading (isRerolling)", () => {
    const onSelect = vi.fn();
    const onReroll = vi.fn();
    const onFallback = vi.fn();

    const { rerender } = render(
      <LevelUpChoiceModal
        open
        level={2}
        choices={[]}
        currentMagatama={100}
        rerollCostMagatama={30}
        isRerolling={false}
        onSelectChoice={onSelect}
        onReroll={onReroll}
        onFallbackContinue={onFallback}
      />,
    );

    expect(screen.getByText("選択可能な術式がありません。")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "戦闘を続ける" }));
    expect(onFallback).toHaveBeenCalledTimes(1);

    rerender(
      <LevelUpChoiceModal
        open
        level={2}
        choices={SAMPLE_CHOICES}
        currentMagatama={20}
        rerollCostMagatama={30}
        isRerolling={false}
        onSelectChoice={onSelect}
        onReroll={onReroll}
        onFallbackContinue={onFallback}
      />,
    );

    const rerollDisabledBtn = screen.getByRole<HTMLButtonElement>("button", {
      name: /再抽選/,
    });
    expect(rerollDisabledBtn.disabled).toBe(true);
    expect(screen.getByText("勾玉が 10 個不足しています")).toBeTruthy();

    rerender(
      <LevelUpChoiceModal
        open
        level={2}
        choices={SAMPLE_CHOICES}
        currentMagatama={60}
        rerollCostMagatama={30}
        isRerolling={true}
        onSelectChoice={onSelect}
        onReroll={onReroll}
        onFallbackContinue={onFallback}
      />,
    );

    const choiceBtn = screen.getByRole<HTMLButtonElement>("button", {
      name: /霊力増幅/,
    });
    expect(choiceBtn.disabled).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: /再抽選/ })
        .disabled,
    ).toBe(true);
    fireEvent.click(choiceBtn);
    expect(onSelect).not.toHaveBeenCalled();

    rerender(
      <LevelUpChoiceModal
        open
        level={2}
        choices={SAMPLE_CHOICES}
        currentMagatama={60}
        rerollCostMagatama={30}
        isRerolling={false}
        onSelectChoice={onSelect}
        onReroll={onReroll}
        onFallbackContinue={onFallback}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /霊力増幅/ }));
    expect(onSelect).toHaveBeenCalledWith("base_atk_pct");
    fireEvent.click(screen.getByRole("button", { name: /再抽選/ }));
    expect(onReroll).toHaveBeenCalledTimes(1);
  });

  it("BattleResultModal handles Loading, Success (victory/defeat), and Error retry", () => {
    const onRetry = vi.fn();
    const onExit = vi.fn();
    const victoryReward: BattleResultPayload = {
      stageId: "stage_1_bamboo",
      outcome: "victory",
      reachedWave: 10,
      earnedMagatama: 120,
      earnedHisui: 7,
      newlyUnlockedStageId: "stage_2_old_road",
    };

    const { rerender } = render(
      <BattleResultModal
        open
        phase="victory"
        stageName="第壱節：迷いの竹林"
        reachedWave={10}
        totalWaves={10}
        isCommitting={true}
        committedReward={null}
        commitError={null}
        isExiting={false}
        onRetryCommit={onRetry}
        onExitToStages={onExit}
      />,
    );

    expect(screen.getByText("報酬を保存中…")).toBeTruthy();
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "ステージ選択へ戻る",
      }).disabled,
    ).toBe(true);

    rerender(
      <BattleResultModal
        open
        phase="victory"
        stageName="第壱節：迷いの竹林"
        reachedWave={10}
        totalWaves={10}
        isCommitting={false}
        committedReward={victoryReward}
        commitError={null}
        isExiting={false}
        onRetryCommit={onRetry}
        onExitToStages={onExit}
      />,
    );

    expect(screen.getByText("ステージ浄化完了")).toBeTruthy();
    expect(screen.getByText("120")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText(/次節解放:/)).toBeTruthy();

    rerender(
      <BattleResultModal
        open
        phase="defeat"
        stageName="第壱節：迷いの竹林"
        reachedWave={4}
        totalWaves={10}
        isCommitting={false}
        committedReward={null}
        commitError="バトル結果の保存に失敗しました。"
        isExiting={false}
        onRetryCommit={onRetry}
        onExitToStages={onExit}
      />,
    );

    expect(screen.getByText("報酬の保存に失敗しました")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "再試行して受け取る" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "保存せず戻る" }));
    expect(onExit).toHaveBeenCalledTimes(1);

    const onRetryBattle = vi.fn();
    rerender(
      <BattleResultModal
        open
        phase="defeat"
        stageName="第壱節：迷いの竹林"
        reachedWave={4}
        totalWaves={10}
        isCommitting={false}
        committedReward={{
          stageId: "stage_1_bamboo",
          outcome: "defeat",
          reachedWave: 4,
          earnedMagatama: 24,
          earnedHisui: 0,
          newlyUnlockedStageId: null,
        }}
        commitError={null}
        isExiting={false}
        onRetryCommit={onRetry}
        onRetryBattle={onRetryBattle}
        onExitToStages={onExit}
      />,
    );
    expect(screen.getByText("結界崩壊")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "再チャレンジ" }));
    expect(onRetryBattle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "ステージ選択へ戻る" }));
    expect(onExit).toHaveBeenCalledTimes(2);
  });
});
