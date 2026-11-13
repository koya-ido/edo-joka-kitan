import { StateView } from "@/components/shared/StateView";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("components/shared/StateView (5-State & Double-Submit Guard)", () => {
  it("renders loading, empty, disabled, and success states", () => {
    const { rerender } = render(
      <StateView status="loading">
        <div>content</div>
      </StateView>,
    );
    expect(screen.getByText("霊脈接続中…")).toBeTruthy();

    rerender(
      <StateView status="empty" emptyTitle="データなし">
        <div>content</div>
      </StateView>,
    );
    expect(screen.getByText("データなし")).toBeTruthy();

    rerender(
      <StateView status="disabled" disabledMessage="ロック中です">
        <div>content</div>
      </StateView>,
    );
    expect(screen.getByText("ロック中です")).toBeTruthy();

    rerender(
      <StateView status="success">
        <div>正常表示コンテンツ</div>
      </StateView>,
    );
    expect(screen.getByText("正常表示コンテンツ")).toBeTruthy();
  });

  it("renders SAVE_CORRUPTED recovery flow via ConfirmAlertDialog and disables buttons when isPending", () => {
    const onRetry = vi.fn();
    const onReset = vi.fn();

    const { rerender } = render(
      <StateView
        status="error"
        error={{ code: "SAVE_CORRUPTED", message: "セーブデータ破損" }}
        onRetry={onRetry}
        onResetSave={onReset}
      >
        <div>content</div>
      </StateView>,
    );

    const retryBtn = screen.getByRole("button", { name: "再試行" });
    const resetTrigger = screen.getByRole("button", {
      name: "セーブデータを初期化して復旧",
    });

    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);

    fireEvent.click(resetTrigger);
    expect(screen.getByText("セーブデータを初期化しますか？")).toBeTruthy();

    const confirmBtn = screen.getByRole("button", { name: "初期化して復旧する" });
    fireEvent.click(confirmBtn);
    expect(onReset).toHaveBeenCalledTimes(1);

    rerender(
      <StateView
        status="error"
        isPending
        error={{ code: "SAVE_CORRUPTED", message: "セーブデータ破損" }}
        onRetry={onRetry}
        onResetSave={onReset}
      >
        <div>content</div>
      </StateView>,
    );

    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "再試行" }).disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "セーブデータを初期化して復旧",
      }).disabled,
    ).toBe(true);
  });
});
