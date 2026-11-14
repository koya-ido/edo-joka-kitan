/**
 * ベースパスを末尾スラッシュ付きに正規化し、Service Worker の URL とスコープを解決する。
 */
export const resolveServiceWorkerConfig = (
  baseUrl: string,
): {
  scriptUrl: string;
  scope: string;
} => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return {
    scriptUrl: `${normalizedBase}sw.js`,
    scope: normalizedBase,
  };
};

/**
 * 本番ビルド時のみ、ベースパス配下のスコープで Service Worker を登録する。
 */
export const registerServiceWorker = (): void => {
  if (!import.meta.env.PROD || typeof window === "undefined") {
    return;
  }
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const { scriptUrl, scope } = resolveServiceWorkerConfig(
    import.meta.env.BASE_URL,
  );

  const register = (): void => {
    void navigator.serviceWorker
      .register(scriptUrl, { scope })
      .catch((error: unknown) => {
        console.warn("[PWA] Service Worker registration failed:", error);
      });
  };

  if (document.readyState === "complete") {
    register();
    return;
  }

  window.addEventListener("load", register, { once: true });
};
