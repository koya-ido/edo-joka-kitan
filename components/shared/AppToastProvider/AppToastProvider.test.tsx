import {
  AppToastProvider,
  useAppToast,
} from "@/components/shared/AppToastProvider";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

const ToastTrigger = () => {
  const { showSuccessToast } = useAppToast();
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          showSuccessToast("保存しました");
        }}
      >
        通知を出す
      </button>
      <div data-testid="outside-area">外側エリア</div>
    </div>
  );
};

describe("components/shared/AppToastProvider", () => {
  afterEach(() => {
    cleanup();
  });

  it("closes toast when clicking outside the toast viewport, and keeps it open when clicking inside", () => {
    render(
      <AppToastProvider>
        <ToastTrigger />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "通知を出す" }));
    expect(screen.getByText("保存しました")).toBeTruthy();

    // トースト内側の pointerdown では閉じない
    fireEvent.pointerDown(screen.getByText("保存しました"));
    expect(screen.getByText("保存しました")).toBeTruthy();

    // トースト外側の pointerdown で閉じる
    fireEvent.pointerDown(screen.getByTestId("outside-area"));
    expect(screen.queryByText("保存しました")).toBeNull();
  });
});
