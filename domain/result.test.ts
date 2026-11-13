import { err, ok } from "@/domain/result";
import { describe, expect, it } from "vitest";

describe("DomainResult helpers", () => {
  it("ok() wraps data with ok: true", () => {
    const result = ok({ value: 42 });
    expect(result).toEqual({ ok: true, data: { value: 42 } });
  });

  it("err() wraps code and message with ok: false", () => {
    const result = err("STAGE_LOCKED", "ステージが未解放です");
    expect(result).toEqual({
      ok: false,
      error: {
        code: "STAGE_LOCKED",
        message: "ステージが未解放です",
      },
    });
  });
});
