import { App } from "@/app/App";
import * as storage from "@/storage";
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

describe("features/formation/FormationScreen (5-State, Double-Submit Guard, Integration)", () => {
  beforeEach(async () => {
    window.location.hash = "#/formation";
    await clearDatabase();
  });

  it("renders Loading then Success, hides unowned items, disables equipped item, prevents double submit, and updates stats", async () => {
    await storage.seedFormationMultiOwnedSave(
      new Date("2026-11-14T10:00:00Z"),
    );

    let resolveUpdate!: (
      value: Awaited<ReturnType<typeof storage.updateFormation>>,
    ) => void;
    const realUpdate = storage.updateFormation;
    const updateSpy = vi
      .spyOn(storage, "updateFormation")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          }),
      );

    render(<App />);

    // Loading ステート
    expect(screen.getByText("霊脈接続中…")).toBeTruthy();

    // Success ステート: 所持2名が表示され、未所持 (朧月・影忍) は非表示
    await waitFor(() => {
      expect(screen.getAllByText("安倍 晴明（見習い）").length).toBeGreaterThan(
        0,
      );
    });
    expect(screen.getByText("白狐の巫女・稲荷")).toBeTruthy();
    expect(screen.queryByText("朧月・影忍")).toBeNull();

    // 現在装備中のラジオ項目は Disabled、未装備の白狐の巫女は選択可能
    const apprenticeRadio = screen.getByRole<HTMLButtonElement>("radio", {
      name: /安倍 晴明（見習い）/,
    });
    const foxRadio = screen.getByRole<HTMLButtonElement>("radio", {
      name: /白狐の巫女・稲荷/,
    });
    expect(apprenticeRadio.disabled).toBe(true);
    expect(foxRadio.disabled).toBe(false);

    // 選択実行 + 送信中の二重押下防止
    fireEvent.click(foxRadio);
    fireEvent.click(foxRadio);

    await waitFor(() => {
      expect(foxRadio.disabled).toBe(true);
    });
    expect(updateSpy).toHaveBeenCalledTimes(1);

    updateSpy.mockRestore();
    const committed = await realUpdate({
      characterId: "white_fox_miko",
    });
    resolveUpdate(committed);

    // 合算ステータス再計算確認 (155 / 30 / 15%) & トースト確認
    await waitFor(() => {
      expect(screen.getByText("155")).toBeTruthy();
      expect(screen.getByText("30")).toBeTruthy();
      expect(screen.getByText("15%")).toBeTruthy();
      expect(
        screen.getByText("主人公を「白狐の巫女・稲荷」に変更しました"),
      ).toBeTruthy();
    });
  });

  it("renders character selection without weapon tab and supports /stages navigation", async () => {
    await storage.seedFormationMultiOwnedSave();

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("安倍 晴明（見習い）").length).toBeGreaterThan(0);
    });

    expect(screen.queryByRole("tab", { name: "持ち込み武器" })).toBeNull();

    const stagesBtn = screen.getByRole("button", { name: "この編成で出撃準備へ" });
    fireEvent.click(stagesBtn);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/stages");
    });
  });

  it("renders owned character without single-owned guidance and navigates to top via footer tab", async () => {
    window.location.hash = "#/formation?from=stages";
    await storage.seedFormationSingleOwnedSave();

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("安倍 晴明（見習い）").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText(/現在所持している/)).toBeNull();
    expect(screen.queryByRole("button", { name: "戻る" })).toBeNull();

    const homeTab = screen.getByRole("button", { name: "本陣" });
    fireEvent.click(homeTab);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/");
    });
  });

  it("renders Error state view when save data is corrupted (401 equivalent)", async () => {
    await storage.seedFormationMultiOwnedSave();
    const db = await storage.openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    const store = tx.objectStore("playerSave");
    const existing = await store.get(SAVE_RECORD_KEY);
    expect(existing).toBeDefined();
    if (existing) {
      await store.put(
        {
          ...existing,
          ownedWeapons: {} as typeof existing.ownedWeapons,
        },
        SAVE_RECORD_KEY,
      );
    }
    await tx.done;
    db.close();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "再試行" })).toBeTruthy();
    });
    expect(screen.queryByRole("tab", { name: "主人公" })).toBeNull();
  });
});
