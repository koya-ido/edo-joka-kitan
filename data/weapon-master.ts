import type { WeaponId, WeaponMaster } from "@/types";

const WEAPON_LIST: WeaponMaster[] = [
  {
    id: "sword_hamon",
    name: "銘刀・波紋",
    genre: "sword",
    description:
      "中射程の扇状斬撃を放ち、複数の妖怪を同時に薙ぎ払う基本の霊刀。",
    baseDamage: 24,
    damagePerRefine: 6,
    baseCooldownMs: 1100,
    baseDurationMs: 280,
    projectileSpeed: 0,
    genreParams: { range: 160, arcDeg: 110 },
    maxRefineLevel: 5,
    duplicateRewardMagatama: 40,
    isInitial: true,
  },
  {
    id: "bow_azusa",
    name: "破魔の梓弓",
    genre: "bow",
    description: "遠方の妖怪を一直線に貫通する霊矢を射出する長射程武器。",
    baseDamage: 28,
    damagePerRefine: 7,
    baseCooldownMs: 1300,
    baseDurationMs: 1200,
    projectileSpeed: 520,
    genreParams: { pierceCount: 3 },
    maxRefineLevel: 5,
    duplicateRewardMagatama: 50,
    isInitial: false,
  },
  {
    id: "shuriken_kaze",
    name: "風魔手裏剣",
    genre: "shuriken",
    description: "高連射で多重拡散し、敵群を切り裂く忍具。",
    baseDamage: 14,
    damagePerRefine: 4,
    baseCooldownMs: 750,
    baseDurationMs: 1100,
    projectileSpeed: 420,
    genreParams: { projectileCount: 3, spreadDeg: 28 },
    maxRefineLevel: 5,
    duplicateRewardMagatama: 50,
    isInitial: false,
  },
];

export const WEAPON_MASTERS: readonly WeaponMaster[] =
  Object.freeze(WEAPON_LIST);

export const WEAPON_MASTER_MAP: Readonly<Record<WeaponId, WeaponMaster>> =
  Object.freeze(
    Object.fromEntries(
      WEAPON_MASTERS.map((weapon) => [weapon.id, weapon]),
    ) as Record<WeaponId, WeaponMaster>,
  );
