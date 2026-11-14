import { useCallback, useEffect, useState } from "react";

const STATIC_ROUTES = new Set([
  "/",
  "/stages",
  "/gacha",
  "/enhance",
  "/formation",
]);

const BATTLE_ROUTE_PATTERN = /^\/battle\/([^/]+)$/;

export interface ParsedRoute {
  readonly path: string;
  readonly battleStageId?: string;
  readonly from?: string;
}

const normalizeHashPath = (rawHash: string): string => {
  const withoutHash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  return withoutHash.startsWith("/") ? withoutHash : `/${withoutHash}`;
};

export const parseAppRoute = (rawHash: string): ParsedRoute | null => {
  const normalized = normalizeHashPath(rawHash);
  const queryIndex = normalized.indexOf("?");
  const path = queryIndex >= 0 ? normalized.slice(0, queryIndex) : normalized;
  const search = queryIndex >= 0 ? normalized.slice(queryIndex + 1) : "";
  const fromParam = search
    ? (new URLSearchParams(search).get("from") ?? undefined)
    : undefined;

  if (STATIC_ROUTES.has(path)) {
    return fromParam ? { path, from: fromParam } : { path };
  }
  const battleMatch = BATTLE_ROUTE_PATTERN.exec(path);
  if (battleMatch) {
    const stageId = decodeURIComponent(battleMatch[1]);
    return fromParam
      ? { path, battleStageId: stageId, from: fromParam }
      : { path, battleStageId: stageId };
  }
  return null;
};

export const useHashRouter = () => {
  const [route, setRoute] = useState<ParsedRoute>(() => {
    const parsed = parseAppRoute(window.location.hash || "#/");
    return parsed ?? { path: "/" };
  });

  const navigate = useCallback((to: string, replace = false) => {
    const targetHash = to.startsWith("#") ? to : `#${to}`;
    if (replace) {
      window.location.replace(targetHash);
    } else {
      window.location.hash = targetHash;
    }
    const parsed = parseAppRoute(targetHash);
    setRoute(parsed ?? { path: "/" });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseAppRoute(window.location.hash || "#/");
      if (!parsed) {
        navigate("/", true);
        return;
      }
      setRoute(parsed);
    };
    if (!parseAppRoute(window.location.hash || "#/")) {
      navigate("/", true);
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [navigate]);

  return { route, navigate };
};
