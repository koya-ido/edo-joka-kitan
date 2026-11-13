import { parseAppEnv } from "@/app/env";
import { describe, expect, it } from "vitest";

describe("parseAppEnv", () => {
  it("applies defaults when optional env vars are omitted", () => {
    const env = parseAppEnv({});
    expect(env.VITE_DB_NAME).toBe("edo-purification-db");
    expect(env.VITE_LOG_LEVEL).toBe("warn");
  });

  it("rejects invalid log levels", () => {
    expect(() => parseAppEnv({ VITE_LOG_LEVEL: "invalid" })).toThrow();
  });
});
