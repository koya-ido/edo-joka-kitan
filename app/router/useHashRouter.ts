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
}

const normalizeHashPath = (rawHash: string): string => {
  const withoutHash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  return withoutHash.startsWith("/") ? withoutHash : `/${withoutHash}`;
};

export const parseAppRoute = (rawHash: string): ParsedRoute | null => {
  const path = normalizeHashPath(rawHash);
  if (STATIC_ROUTES.has(path)) {
    return { path };
  }
  const battleMatch = BATTLE_ROUTE_PATTERN.exec(path);
  if (battleMatch) {
    return { path, battleStageId: decodeURIComponent(battleMatch[1]) };
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
