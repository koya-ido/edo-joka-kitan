import { App } from "@/app/App";
import * as storage from "@/storage";
import { DB_NAME } from "@/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class ResizeObserver {
      observe = (): void => { };
      unobserve = (): void => { };
      disconnect = (): void => { };
    };
  }
});

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

describe("features/gacha/GachaScreen (5-State, Double-Submit Guard, Skip, Integration)", () => {
  beforeEach(async () => {
    window.location.hash = "#/gacha";
    await clearDatabase();
  });

  it("renders Loading then Empty, prevents double submit, skips animation, and shows Success modal", async () => {
    await storage.seedGachaReadySave(new Date("2026-11-14T10:00:00Z"));

    let resolvePull!: (
      value: Awaited<ReturnType<typeof storage.executeGachaPull>>,
    ) => void;
    const realPull = storage.executeGachaPull;
    const pullSpy = vi.spyOn(storage, "executeGachaPull").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePull = resolve;
        }),
    );

    render(<App />);

    expect(screen.getByText("霊脈接続中…")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("英霊召喚の儀")).toBeTruthy();
    });

    const singleButton = screen.getByRole<HTMLButtonElement>("button", {
      name: /1回召喚（翡翠 5）/,
    });
    const multiButton = screen.getByRole<HTMLButtonElement>("button", {
      name: /10回召喚（翡翠 50）/,
    });
    expect(singleButton.disabled).toBe(false);
    expect(multiButton.disabled).toBe(false);

    fireEvent.click(singleButton);
    fireEvent.click(singleButton);
    fireEvent.click(multiButton);

    await waitFor(() => {
      expect(singleButton.disabled).toBe(true);
      expect(multiButton.disabled).toBe(true);
    });
    expect(pullSpy).toHaveBeenCalledTimes(1);

    pullSpy.mockRestore();
    const committed = await realPull("character", 1, () => 0.4);
    resolvePull(committed);

    await waitFor(() => {
      expect(screen.getByText("霊脈召喚中…")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "スキップ" }));

    await waitFor(() => {
      expect(screen.getByText("召喚結果")).toBeTruthy();
      expect(screen.getByText("新規獲得")).toBeTruthy();
      expect(screen.getByLabelText("翡翠: 50")).toBeTruthy();
    });
  });

  it("switches to weapon tab, opens rates dialog, and opens conversion rule popover", async () => {
    await storage.seedGachaReadySave();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("英霊召喚の儀")).toBeTruthy();
    });

    const weaponTab = screen.getByRole("tab", { name: "武器召喚" });
    fireEvent.mouseDown(weaponTab);
    fireEvent.click(weaponTab);

    await waitFor(() => {
      expect(screen.getByText("霊具鍛造の儀")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "提供割合" }));
    await waitFor(() => {
      expect(screen.getByText("提供割合・排出一覧（武器召喚）")).toBeTruthy();
      expect(screen.getByText("銘刀・波紋")).toBeTruthy();
    });
    const closeButtons = screen.getAllByRole("button", { name: "閉じる" });
    fireEvent.click(closeButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: "変換ルール" }));
    await waitFor(() => {
      expect(screen.getByText("重複・上限変換ルール")).toBeTruthy();
    });
  });

  it("disables gacha buttons with deficit message when hisui is insufficient", async () => {
    await storage.seedGachaInsufficientHisuiSave();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("翡翠あと 2 個不足")).toBeTruthy();
      expect(screen.getByText("翡翠あと 47 個不足")).toBeTruthy();
    });

    const singleBtn = screen.getByRole<HTMLButtonElement>("button", {
      name: /1回召喚/,
    });
    const multiBtn = screen.getByRole<HTMLButtonElement>("button", {
      name: /10回召喚/,
    });
    expect(singleBtn.disabled).toBe(true);
    expect(multiBtn.disabled).toBe(true);
  });

  it("displays converted_to_magatama badge and summary when pool is maxed", async () => {
    await storage.seedGachaMaxedPoolSave();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("英霊召喚の儀")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /10回召喚（翡翠 50）/ }));

    await waitFor(() => {
      expect(screen.getByText("霊脈召喚中…")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "スキップ" }));

    await waitFor(() => {
      expect(screen.getByText("召喚結果")).toBeTruthy();
      expect(screen.getAllByText("上限→勾玉変換済み").length).toBeGreaterThan(0);
    });
  });
});
