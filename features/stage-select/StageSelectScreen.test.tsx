import { App } from "@/app/App";
import { AppToastProvider } from "@/components/shared/AppToastProvider";
import { Tooltip } from "@/components/ui/Tooltip";
import { createInitialPlayerSave } from "@/domain";
import { StageSelectScreen } from "@/features/stage-select";
import { openPlayerDb, seedStageInitialStateSave, seedStageMidProgressSave } from "@/storage";
import { DB_NAME, SAVE_RECORD_KEY } from "@/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clearDatabase = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      resolve();
    };
    request.onblocked = () => {
      resolve();
    };
  });
};

describe("features/stage-select/StageSelectScreen (5-State, Route Guard, Integration)", () => {
  beforeEach(async () => {
    window.location.hash = "#/stages";
    await clearDatabase();
  });

  it("renders Loading then cleared and next unverified stages (hiding locked stages) with compact reward badge", async () => {
    await storageSeedMidProgress();
    render(<App />);

    expect(screen.getByText("霊脈接続中…")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("第壱節：迷いの竹林")).toBeTruthy();
    });
    const stage1Heading = screen.getByText("第壱節：迷いの竹林");
    const stage2Heading = screen.getByText("第弐節：枯れ宿場の古道");
    const formationHeading = screen.getByText("現在の出撃編成");
    expect(
      formationHeading.compareDocumentPosition(stage2Heading) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      stage2Heading.compareDocumentPosition(stage1Heading) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // 未解放ステージは非表示
    expect(screen.queryByText("第参節：穢れし古社")).toBeNull();
    expect(screen.queryByText("未解放")).toBeNull();
    expect(screen.queryByText(/解放条件:/)).toBeNull();

    expect(screen.getByText("浄化済み")).toBeTruthy();
    expect(screen.getByText("未浄化")).toBeTruthy();

    // 報酬が1つのバッジにまとまっている
    expect(screen.getAllByText("報酬:")).toHaveLength(2);
    expect(screen.getByText("+120")).toBeTruthy();
    expect(screen.getByText("+2")).toBeTruthy();

    // 現在の出撃編成サマリー
    expect(screen.getByText("安倍 晴明（見習い）")).toBeTruthy();

    // 解放済みボタンは 2つ有効、未解放ボタンは非表示
    expect(
      screen.queryByRole<HTMLButtonElement>("button", { name: "未解放" }),
    ).toBeNull();
    const sortieBtns = screen.getAllByRole<HTMLButtonElement>("button", {
      name: "出撃する",
    });
    expect(sortieBtns).toHaveLength(2);
    expect(sortieBtns[0].disabled).toBe(false);

    // 「編成変更」から /formation?from=stages へ遷移
    fireEvent.click(screen.getByRole("button", { name: "編成変更" }));
    await waitFor(() => {
      expect(window.location.hash).toBe("#/formation?from=stages");
    });
  });

  it("navigates to /battle/:stageId on valid sortie and prevents double submit", () => {
    const save = createInitialPlayerSave();
    const onNavigate = vi.fn();

    render(
      <Tooltip.Provider>
        <AppToastProvider>
          <StageSelectScreen save={save} onNavigate={onNavigate} />
        </AppToastProvider>
      </Tooltip.Provider>,
    );

    const sortieBtn = screen.getByRole<HTMLButtonElement>("button", {
      name: "出撃する",
    });
    fireEvent.click(sortieBtn);
    fireEvent.click(sortieBtn);

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("/battle/stage_1_bamboo");
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "出撃準備中…" })
        .disabled,
    ).toBe(true);
  });

  it("renders Empty state when stageMasters is empty", () => {
    const save = createInitialPlayerSave();
    const onNavigate = vi.fn();

    render(
      <Tooltip.Provider>
        <AppToastProvider>
          <StageSelectScreen
            save={save}
            stageMasters={[]}
            onNavigate={onNavigate}
          />
        </AppToastProvider>
      </Tooltip.Provider>,
    );

    expect(screen.getByText("選択可能な土地がありません")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ホームへ戻る" }));
    expect(onNavigate).toHaveBeenCalledWith("/");
  });

  it("403-equivalent route guard: redirects locked or invalid /battle/:stageId to /stages with toast", async () => {
    await seedStageInitialStateSave();
    window.location.hash = "#/battle/stage_2_old_road";

    render(<App />);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/stages");
      expect(
        screen.getByText("このステージはまだ解放されていません。"),
      ).toBeTruthy();
    });

    window.location.hash = "#/battle/unknown_stage";
    fireEvent(window, new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(window.location.hash).toBe("#/stages");
      expect(
        screen.getByText("指定されたステージは存在しません。"),
      ).toBeTruthy();
    });
  });

  it("401-equivalent route guard: redirects corrupted session on /battle/:stageId to /", async () => {
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    await tx.objectStore("playerSave").put({ broken: true } as never, SAVE_RECORD_KEY);
    await tx.done;
    db.close();

    window.location.hash = "#/battle/stage_1_bamboo";
    render(<App />);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/");
      expect(screen.getByText("霊脈の読み込みに失敗しました")).toBeTruthy();
    });
  });
});

const storageSeedMidProgress = async (): Promise<void> => {
  await seedStageMidProgressSave(new Date("2026-11-14T10:00:00.000Z"));
};
