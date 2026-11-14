import { parseAppRoute } from "@/app/router/useHashRouter";
import { describe, expect, it } from "vitest";

describe("app/router/useHashRouter", () => {
  it("parses static routes and query params such as /formation?from=stages", () => {
    expect(parseAppRoute("#/formation")).toEqual({ path: "/formation" });
    expect(parseAppRoute("#/formation?from=stages")).toEqual({
      path: "/formation",
      from: "stages",
    });
    expect(parseAppRoute("#/stages")).toEqual({ path: "/stages" });
  });

  it("parses dynamic battle routes and rejects unknown routes", () => {
    expect(parseAppRoute("#/battle/stage_1_bamboo")).toEqual({
      path: "/battle/stage_1_bamboo",
      battleStageId: "stage_1_bamboo",
    });
    expect(parseAppRoute("#/unknown/route")).toBeNull();
  });
});
