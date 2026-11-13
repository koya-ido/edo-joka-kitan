import { App } from "@/app/App";
import { getLocalDateKey } from "@/domain";
import * as storage from "@/storage";
import { DB_NAME } from "@/types";
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

describe("features/home/HomeScreen (5-State, Login Bonus, Save Reset)", () => {
  beforeEach(async () => {
    window.location.hash = "#/";
    await clearDatabase();
  });

  it("auto-opens login bonus on unclaimed boot, prevents double submit, and disables re-claim", async () => {
    const todayKey = getLocalDateKey(new Date());
    await storage.seedUnclaimedLoginBonusSave("2026-11-13");

    let resolveClaim!: (value: Awaited<ReturnType<typeof storage.claimLoginBonus>>) => void;
    const realClaim = storage.claimLoginBonus;
    const claimSpy = vi.spyOn(storage, "claimLoginBonus").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveClaim = resolve;
        }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("本日のログインボーナス")).toBeTruthy();
    });

    const claimBtn = screen.getByRole<HTMLButtonElement>("button", { name: "受け取る" });
    fireEvent.click(claimBtn);
    // 送信中の二重クリックは無視される
    fireEvent.click(claimBtn);

    await waitFor(() => {
      expect(claimBtn.disabled).toBe(true);
    });
    expect(claimSpy).toHaveBeenCalledTimes(1);

    claimSpy.mockRestore();
    const committed = await realClaim(new Date());
    resolveClaim(committed);

    // ヘッダーの「ログボ」ボタンで再確認すると、受取済み Disabled 表示になる
    const reopenBtn = await screen.findByRole("button", { name: "ログボ" });
    fireEvent.click(reopenBtn);

    await waitFor(() => {
      const disabledBtn = screen.getByRole<HTMLButtonElement>("button", {
        name: "本日分は受取済み",
      });
      expect(disabledBtn.disabled).toBe(true);
    });

    const reloaded = await storage.loadOrInitializeSave();
    expect(reloaded.ok).toBe(true);
    if (reloaded.ok) {
      expect(reloaded.data.save.lastLoginBonusDate).toBe(todayKey);
    }
  });

  it("shows disabled claim state immediately when already claimed today", async () => {
    const todayKey = getLocalDateKey(new Date());
    await storage.seedClaimedLoginBonusSave(todayKey);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("見習い陰陽師")).toBeTruthy();
    });

    // 既に受取済みなので自動表示はされない
    expect(screen.queryByText("本日のログインボーナス")).toBeNull();

    // 手動で開くと Disabled 状態
    fireEvent.click(screen.getByRole("button", { name: "ログボ" }));
    await waitFor(() => {
      const btn = screen.getByRole<HTMLButtonElement>("button", {
        name: "本日分は受取済み",
      });
      expect(btn.disabled).toBe(true);
    });
  });

  it("resets save data only after explicit ConfirmAlertDialog approval", async () => {
    await storage.seedResettableProgressSave();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText("水晶の勾玉: 450")).toBeTruthy();
    });

    // 自動表示されたログボモーダルを閉じる
    const closeButtons = screen.getAllByRole("button", { name: "閉じる" });
    fireEvent.click(closeButtons[0]);

    // 初期化ボタン押下 → 確認モーダル表示
    fireEvent.click(screen.getByRole("button", { name: "初期化" }));
    await waitFor(() => {
      expect(screen.getByText("セーブデータを初期化しますか？")).toBeTruthy();
    });

    // キャンセル時は残高が維持される
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.getByLabelText("水晶の勾玉: 450")).toBeTruthy();

    // 再度開いて「初期化する」を確定
    fireEvent.click(screen.getByRole("button", { name: "初期化" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "初期化する" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "初期化する" }));

    await waitFor(() => {
      expect(screen.getByLabelText("水晶の勾玉: 100")).toBeTruthy();
      expect(screen.getAllByLabelText("翡翠: 5").length).toBeGreaterThanOrEqual(1);
    });
  });
});
