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

describe("features/enhance/EnhanceScreen (5-State, Double-Submit Guard, Integration)", () => {
  beforeEach(async () => {
    window.location.hash = "#/enhance";
    await clearDatabase();
  });

  it("renders Loading then Empty (Lv.0), prevents double submit, and updates stats on Success", async () => {
    await storage.seedInitialPlayerSave(new Date("2026-11-14T10:00:00Z"));

    let resolveEnhance!: (
      value: Awaited<ReturnType<typeof storage.enhancePermanentStat>>,
    ) => void;
    const realEnhance = storage.enhancePermanentStat;
    const enhanceSpy = vi
      .spyOn(storage, "enhancePermanentStat")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveEnhance = resolve;
          }),
      );

    render(<App />);

    expect(screen.getByText("霊脈接続中…")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getAllByText("Lv.0（未強化）")).toHaveLength(3);
    });
    expect(
      screen.getByText(
        "現在はすべて未強化（Lv.0）です。水晶の勾玉を捧げて基礎能力を底上げしましょう。",
      ),
    ).toBeTruthy();
    expect(screen.getByText("120")).toBeTruthy();
    expect(screen.getByText("20")).toBeTruthy();
    expect(screen.getByText("5%")).toBeTruthy();

    const enhanceButtons = screen.getAllByRole<HTMLButtonElement>("button", {
      name: "強化する",
    });
    expect(enhanceButtons).toHaveLength(3);

    fireEvent.click(enhanceButtons[0]);
    // 送信中の二重押下は無視され、全強化ボタンが Disabled になる
    fireEvent.click(enhanceButtons[0]);
    fireEvent.click(enhanceButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "強化中…" })).toBeTruthy();
      for (const btn of enhanceButtons) {
        expect(btn.disabled).toBe(true);
      }
    });
    expect(enhanceSpy).toHaveBeenCalledTimes(1);

    enhanceSpy.mockRestore();
    const committed = await realEnhance("hpLevel");
    resolveEnhance(committed);

    await waitFor(() => {
      expect(screen.getByText("Lv.1 / 20")).toBeTruthy();
      expect(screen.getByText("140")).toBeTruthy();
      expect(screen.getByText("結界耐久を Lv.1 に強化しました")).toBeTruthy();
    });
  });

  it("disables enhance buttons with warning when magatama is insufficient", async () => {
    await storage.seedEnhanceInsufficientMagatamaSave();

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "勾玉不足" })).toHaveLength(
        3,
      );
    });

    const buttons = screen.getAllByRole<HTMLButtonElement>("button", {
      name: "勾玉不足",
    });
    for (const btn of buttons) {
      expect(btn.disabled).toBe(true);
    }
  });

  it("disables enhance buttons when all stats reach max level", async () => {
    await storage.seedEnhanceMaxedStatSave();

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "最大Lv" })).toHaveLength(
        3,
      );
    });

    const buttons = screen.getAllByRole<HTMLButtonElement>("button", {
      name: "最大Lv",
    });
    for (const btn of buttons) {
      expect(btn.disabled).toBe(true);
    }
  });

  it("renders Error state view when save data is corrupted (401 equivalent)", async () => {
    await storage.seedInitialPlayerSave();
    const db = await storage.openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    const store = tx.objectStore("playerSave");
    const existing = await store.get(SAVE_RECORD_KEY);
    expect(existing).toBeDefined();
    if (existing) {
      await store.put(
        {
          ...existing,
          permanentStats: { hpLevel: 999, atkLevel: 0, lukLevel: 0 },
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
    expect(screen.queryByRole("button", { name: "強化する" })).toBeNull();
  });
});
