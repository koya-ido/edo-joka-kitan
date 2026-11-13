import { applyDbMigrations } from "@/storage/migrations";
import { DB_NAME, DB_VERSION, type EdoPurificationDB } from "@/types";
import { openDB, type IDBPDatabase } from "idb";

/** IndexedDB データベース接続を開き、必要に応じてマイグレーションを適用する */
export const openPlayerDb = (): Promise<IDBPDatabase<EdoPurificationDB>> =>
  openDB<EdoPurificationDB>(DB_NAME, DB_VERSION, {
    upgrade: (db, oldVersion) => {
      applyDbMigrations(db, oldVersion);
    },
  });
