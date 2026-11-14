import { AppToastProvider } from "@/components/shared/AppToastProvider";
import { Tooltip } from "@/components/ui/Tooltip";
import { createInitialPlayerSave } from "@/domain";
import { BattleScreen } from "@/features/battle";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIXED_NOW = new Date("2026-11-14T10:00:00.000Z");

const createMockCanvasContext = (): CanvasRenderingContext2D =>
  ({
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    font: "",
    textAlign: "left",
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
  }) as unknown as CanvasRenderingContext2D;

const renderBattle = (
  stageId = "stage_1_bamboo",
  onExitToStages = vi.fn(),
) => {
  const save = createInitialPlayerSave(FIXED_NOW);
  return {
    onExitToStages,
    ...render(
      <Tooltip.Provider>
        <AppToastProvider>
          <BattleScreen
            save={save}
            stageId={stageId}
            onExitToStages={onExitToStages}
          />
        </AppToastProvider>
      </Tooltip.Provider>,
    ),
  };
};

describe("features/battle/BattleScreen (5-State, HUD, Pause, Retreat, Error)", () => {
  let mockCtx: CanvasRenderingContext2D | null = null;

  beforeEach(() => {
    mockCtx = createMockCanvasContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => mockCtx,
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders HUD in preparing (Empty) state without weapon slot bar, and toggles 1x/2x speed", () => {
    renderBattle();

    expect(screen.getByText("第壱節：迷いの竹林")).toBeTruthy();
    expect(screen.getByText("Wave 1 / 10")).toBeTruthy();
    expect(screen.getByText("開戦準備中")).toBeTruthy();
    expect(screen.getByText("120 / 120")).toBeTruthy();
    expect(screen.queryByText("銘刀・波紋")).toBeNull();

    const speedToggle = screen.getByRole("button", { name: "戦闘速度切替" });
    expect(speedToggle.textContent).toBe("1x");
    fireEvent.click(speedToggle);
    expect(speedToggle.textContent).toBe("2x");
  });

  it("opens pause modal, disables background HUD controls, and handles retreat confirm + double-click guard", () => {
    const { onExitToStages } = renderBattle();

    const pauseBtn = screen.getByRole("button", { name: "一時停止" });
    fireEvent.click(pauseBtn);

    expect(screen.getByText("戦闘一時停止")).toBeTruthy();
    expect(screen.getByText("安倍 晴明（見習い）")).toBeTruthy();

    const slotButton = screen.getByRole("button", {
      name: "銘刀・波紋の詳細を表示",
    });
    expect(screen.queryByText("銘刀・波紋")).toBeNull();
    fireEvent.click(slotButton);
    expect(screen.getByText("銘刀・波紋")).toBeTruthy();
    fireEvent.click(slotButton);
    expect(screen.queryByText("銘刀・波紋")).toBeNull();
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "戦闘速度切替",
        hidden: true,
      }).disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "ステージ選択へ撤退" }));
    expect(screen.getByText("戦闘から撤退しますか？")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "戦闘に戻る" }));
    expect(onExitToStages).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "ステージ選択へ撤退" }));
    const confirmBtn = screen.getByRole("button", { name: "撤退する" });
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);
    expect(onExitToStages).toHaveBeenCalledTimes(1);
  });

  it("renders Error modal when Canvas 2D context is unavailable and returns to stages", () => {
    mockCtx = null;
    const { onExitToStages } = renderBattle();

    expect(screen.getByText("戦闘処理エラー")).toBeTruthy();
    expect(
      screen.getByText("描画領域（Canvas 2D）の初期化に失敗しました。"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "ステージ選択へ戻る" }));
    expect(onExitToStages).toHaveBeenCalledTimes(1);
  });

  it("blocks unauthorized locked stage sortie and shows Error modal", () => {
    const { onExitToStages } = renderBattle("stage_2_old_road");

    expect(screen.getByText("戦闘処理エラー")).toBeTruthy();
    expect(
      screen.getByText("このステージはまだ解放されていません。"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "ステージ選択へ戻る" }));
    expect(onExitToStages).toHaveBeenCalledTimes(1);
  });
});
