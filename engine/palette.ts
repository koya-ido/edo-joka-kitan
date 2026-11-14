import type { WeaponColorToken } from "@/types";

/** Canvas 2D 描画に使用するトークン解決済みパレット */
export interface BattlePalette {
  readonly surface: string;
  readonly surfaceDeep: string;
  readonly foreground: string;
  readonly barrier: string;
  readonly exp: string;
  readonly primary: string;
  readonly accent: string;
  readonly destructive: string;
  readonly hisui: string;
  readonly magatama: string;
  readonly border: string;
  readonly weaponColors: Readonly<Record<WeaponColorToken, string>>;
}

const FALLBACK_WEAPON_COLORS: Readonly<Record<WeaponColorToken, string>> = {
  sword: "oklch(0.68 0.16 235)",
  bow: "oklch(0.78 0.15 85)",
  shuriken: "oklch(0.72 0.14 190)",
  mirror: "oklch(0.9 0.05 95)",
  talisman: "oklch(0.64 0.18 300)",
  matchlock: "oklch(0.63 0.21 30)",
  fan: "oklch(0.68 0.16 152)",
  orb: "oklch(0.72 0.17 55)",
};

const FALLBACK_PALETTE: BattlePalette = {
  surface: "oklch(0.16 0.02 260)",
  surfaceDeep: "oklch(0.11 0.022 260)",
  foreground: "oklch(0.96 0.01 85)",
  barrier: "oklch(0.62 0.155 150)",
  exp: "oklch(0.6 0.16 245)",
  primary: "oklch(0.52 0.195 28)",
  accent: "oklch(0.74 0.135 82)",
  destructive: "oklch(0.48 0.21 22)",
  hisui: "oklch(0.56 0.145 162)",
  magatama: "oklch(0.54 0.175 295)",
  border: "oklch(0.84 0.025 78)",
  weaponColors: FALLBACK_WEAPON_COLORS,
};

const readCssVar = (varName: string, fallback: string): string => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value.length > 0 ? value : fallback;
};

/** `tokens.css` の CSS カスタムプロパティからバトル描画パレットを解決する */
export const resolveBattlePalette = (): BattlePalette => ({
  surface: readCssVar("--battle-surface", FALLBACK_PALETTE.surface),
  surfaceDeep: readCssVar(
    "--battle-surface-deep",
    FALLBACK_PALETTE.surfaceDeep,
  ),
  foreground: readCssVar("--battle-foreground", FALLBACK_PALETTE.foreground),
  barrier: readCssVar("--barrier", FALLBACK_PALETTE.barrier),
  exp: readCssVar("--exp", FALLBACK_PALETTE.exp),
  primary: readCssVar("--primary", FALLBACK_PALETTE.primary),
  accent: readCssVar("--accent", FALLBACK_PALETTE.accent),
  destructive: readCssVar("--destructive", FALLBACK_PALETTE.destructive),
  hisui: readCssVar("--hisui", FALLBACK_PALETTE.hisui),
  magatama: readCssVar("--magatama", FALLBACK_PALETTE.magatama),
  border: readCssVar("--border", FALLBACK_PALETTE.border),
  weaponColors: {
    sword: readCssVar("--weapon-sword", FALLBACK_WEAPON_COLORS.sword),
    bow: readCssVar("--weapon-bow", FALLBACK_WEAPON_COLORS.bow),
    shuriken: readCssVar("--weapon-shuriken", FALLBACK_WEAPON_COLORS.shuriken),
    mirror: readCssVar("--weapon-mirror", FALLBACK_WEAPON_COLORS.mirror),
    talisman: readCssVar("--weapon-talisman", FALLBACK_WEAPON_COLORS.talisman),
    matchlock: readCssVar(
      "--weapon-matchlock",
      FALLBACK_WEAPON_COLORS.matchlock,
    ),
    fan: readCssVar("--weapon-fan", FALLBACK_WEAPON_COLORS.fan),
    orb: readCssVar("--weapon-orb", FALLBACK_WEAPON_COLORS.orb),
  },
});
