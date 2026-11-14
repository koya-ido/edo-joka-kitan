import { CHARACTER_MASTER_MAP } from "@/data";
import {
  applyFormationChange,
  calculateTotalMetaStats,
  createInitialPlayerSave,
  getOwnedCharacterEntries,
  getOwnedWeaponEntries,
  getPassiveEffectValue,
  getWeaponEffectiveDamage,
  guardEquipmentSelection,
} from "@/domain";
import { describe, expect, it } from "vitest";

const buildMultiOwnedSave = () => {
  const base = createInitialPlayerSave(new Date("2026-11-14T12:00:00Z"));
  return {
    ...base,
    permanentStats: { hpLevel: 2, atkLevel: 1, lukLevel: 1 },
    ownedCharacters: {
      ...base.ownedCharacters,
      white_fox_miko: {
        characterId: "white_fox_miko" as const,
        awakeningLevel: 1,
        obtainedAt: "2026-11-14T12:00:00Z",
      },
    },
    ownedWeapons: {
      ...base.ownedWeapons,
      bow_azusa: {
        weaponId: "bow_azusa" as const,
        refineLevel: 2,
        obtainedAt: "2026-11-14T12:00:00Z",
      },
    },
  };
};

describe("domain/formation (Slice 4 formation logic & 403 guards)", () => {
  it("switches equipped character and weapon immutably and recalculates total stats", () => {
    const save = buildMultiOwnedSave();
    const nextNow = new Date("2026-11-14T15:00:00Z");

    const result = applyFormationChange(
      save,
      { characterId: "white_fox_miko" },
      nextNow,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.equippedCharacterId).toBe("white_fox_miko");
      expect(result.data.updatedAt).toBe("2026-11-14T15:00:00.000Z");

      // 元データは不変
      expect(save.equippedCharacterId).toBe("apprentice_onmyoji");

      // white_fox_miko (Lv.1: HP 100+15, ATK 22+5, LUK 12+2) + permanent (hpLv2: +40, atkLv1: +3, lukLv1: +1)
      const stats = calculateTotalMetaStats(
        result.data,
        CHARACTER_MASTER_MAP.white_fox_miko,
      );
      expect(stats).toEqual({ hp: 155, atk: 30, luk: 15 });
    }
  });

  it("extracts only owned characters and weapons in master order", () => {
    const save = buildMultiOwnedSave();
    const chars = getOwnedCharacterEntries(save);
    const weapons = getOwnedWeaponEntries(save);

    expect(chars.map((c) => c.master.id)).toEqual([
      "apprentice_onmyoji",
      "white_fox_miko",
    ]);
    expect(
      chars.find((c) => c.master.id === "apprentice_onmyoji")?.isEquipped,
    ).toBe(true);
    expect(
      chars.find((c) => c.master.id === "white_fox_miko")?.isEquipped,
    ).toBe(false);

    expect(weapons.map((w) => w.master.id)).toEqual([
      "sword_hamon",
      "bow_azusa",
    ]);
    expect(weapons.every((w) => !w.isEquipped)).toBe(true);
  });

  it("computes passive effect value and weapon effective damage", () => {
    const save = buildMultiOwnedSave();
    const chars = getOwnedCharacterEntries(save);
    const fox = chars.find((c) => c.master.id === "white_fox_miko");
    expect(fox).toBeDefined();
    if (fox) {
      expect(getPassiveEffectValue(fox.master, fox.state.awakeningLevel)).toBe(
        13,
      );
    }

    const weapons = getOwnedWeaponEntries(save);
    const bow = weapons.find((w) => w.master.id === "bow_azusa");
    expect(bow).toBeDefined();
    if (bow) {
      expect(getWeaponEffectiveDamage(bow.master, bow.state.refineLevel)).toBe(
        42,
      );
    }
  });

  it("rejects empty, unowned, unknown, or prototype-key character with UNOWNED_CHARACTER (403 guard)", () => {
    const save = buildMultiOwnedSave();

    const emptyRes = guardEquipmentSelection(save, "");
    expect(emptyRes.ok).toBe(false);
    if (!emptyRes.ok) {
      expect(emptyRes.error.code).toBe("UNOWNED_CHARACTER");
    }

    const unownedRes = applyFormationChange(save, {
      characterId: "shadow_shinobi",
    });
    expect(unownedRes.ok).toBe(false);
    if (!unownedRes.ok) {
      expect(unownedRes.error.code).toBe("UNOWNED_CHARACTER");
    }

    const unknownRes = guardEquipmentSelection(save, "unknown_char");
    expect(unknownRes.ok).toBe(false);
    if (!unknownRes.ok) {
      expect(unknownRes.error.code).toBe("UNOWNED_CHARACTER");
    }

    const protoChar = guardEquipmentSelection(save, "__proto__");
    expect(protoChar.ok).toBe(false);
    if (!protoChar.ok) {
      expect(protoChar.error.code).toBe("UNOWNED_CHARACTER");
    }
  });
});
