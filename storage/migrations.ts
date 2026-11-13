import type { EdoPurificationDB } from "@/types";
import type { IDBPDatabase } from "idb";

/**
 * IndexedDB スキーママイグレーションを実行する（v0 -> v1）。
 * `playerSave` は単一キー `"primary"` のみの out-of-line ストアとして作成する。
 */
export const applyDbMigrations = (
  db: IDBPDatabase<EdoPurificationDB>,
  oldVersion: number,
): void => {
  if (oldVersion < 1) {
    if (!db.objectStoreNames.contains("playerSave")) {
      db.createObjectStore("playerSave");
    }
  }
};
