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
      weaponId: "sword_hamon",
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

  it("switches to weapon tab, changes equipped weapon, and supports /stages navigation", async () => {
    await storage.seedFormationMultiOwnedSave();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "持ち込み武器（1枠）" })).toBeTruthy();
    });

    const weaponTab = screen.getByRole("tab", { name: "持ち込み武器（1枠）" });
    fireEvent.mouseDown(weaponTab);
    fireEvent.click(weaponTab);

    await waitFor(() => {
      expect(screen.getByText("破魔の梓弓")).toBeTruthy();
    });

    const bowRadio = screen.getByRole<HTMLButtonElement>("radio", {
      name: /破魔の梓弓/,
    });
    fireEvent.click(bowRadio);

    await waitFor(() => {
      expect(
        screen.getByText("持ち込み武器を「破魔の梓弓」に変更しました"),
      ).toBeTruthy();
    });

    const stagesBtn = screen.getByRole("button", { name: "ステージ選択へ" });
    fireEvent.click(stagesBtn);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/stages");
    });
  });

  it("shows Empty guidance when only 1 character/weapon is owned and handles ?from=stages back route", async () => {
    window.location.hash = "#/formation?from=stages";
    await storage.seedFormationSingleOwnedSave();

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "現在所持している主人公は1名のみです。他の候補はガチャ（召喚）で獲得できます。",
        ),
      ).toBeTruthy();
    });

    const backButton = screen.getByRole("button", { name: "戻る" });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/stages");
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
          equippedWeaponId: "",
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
    expect(screen.queryByRole("tab", { name: "主人公（1名）" })).toBeNull();
  });
});
