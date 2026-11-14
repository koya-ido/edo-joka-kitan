import { resolveServiceWorkerConfig } from "@/app/pwa";
import { describe, expect, it } from "vitest";

describe("resolveServiceWorkerConfig", () => {
  it("ルート配信 (/) 向けの scriptUrl と scope を返す", () => {
    expect(resolveServiceWorkerConfig("/")).toEqual({
      scriptUrl: "/sw.js",
      scope: "/",
    });
  });

  it("GitHub Pages サブディレクトリ配信向けの scriptUrl と scope を返す", () => {
    expect(resolveServiceWorkerConfig("/edo-joka-kitan/")).toEqual({
      scriptUrl: "/edo-joka-kitan/sw.js",
      scope: "/edo-joka-kitan/",
    });
  });

  it("末尾スラッシュなしの baseUrl でも正規化する", () => {
    expect(resolveServiceWorkerConfig("/edo-joka-kitan")).toEqual({
      scriptUrl: "/edo-joka-kitan/sw.js",
      scope: "/edo-joka-kitan/",
    });
  });
});
