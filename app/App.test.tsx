import { App } from "@/app/App";
import { openPlayerDb } from "@/storage";
import { DB_NAME, SAVE_RECORD_KEY } from "@/types";
import { render, screen, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

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

describe("app/App (Session Boot & Shell Integration)", () => {
  beforeEach(async () => {
    window.location.hash = "#/";
    await clearDatabase();
  });

  it("transitions from loading to success with auto-seeded initial save", async () => {
    render(<App />);
    expect(screen.getByText("霊脈接続中…")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("霊脈接続済み")).toBeTruthy();
    });

    expect(screen.getByText("apprentice_onmyoji")).toBeTruthy();
    expect(screen.getByText("sword_hamon")).toBeTruthy();
    expect(screen.getByLabelText("水晶の勾玉: 100")).toBeTruthy();
    expect(screen.getByLabelText("翡翠: 5")).toBeTruthy();
  });

  it("shows error recovery state and locks navigation when save is corrupted", async () => {
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    await tx.objectStore("playerSave").put({ broken: true } as never, SAVE_RECORD_KEY);
    await tx.done;
    db.close();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("霊脈の読み込みに失敗しました")).toBeTruthy();
    });

    expect(
      screen.getByRole("button", { name: "セーブデータを初期化して復旧" }),
    ).toBeTruthy();
    const sortieTab = screen.getByRole<HTMLButtonElement>("button", { name: "出撃" });
    expect(sortieTab.disabled).toBe(true);
  });
});
