import { err } from "@/domain";
import { loadOrInitializeSave, resetPlayerSaveToInitial } from "@/storage";
import type { DomainError, DomainResult, PlayerSaveData } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type SessionStatus = "loading" | "success" | "error";

export interface PlayerSessionContextValue {
  readonly status: SessionStatus;
  readonly save: PlayerSaveData | null;
  readonly error: DomainError | null;
  readonly isPending: boolean;
  readonly isInitialBoot: boolean;
  readonly reloadSession: () => Promise<void>;
  readonly resetSessionToInitial: () => Promise<DomainResult<PlayerSaveData>>;
  readonly applyCommittedSave: (nextSave: PlayerSaveData) => void;
}

const PlayerSessionContext = createContext<PlayerSessionContextValue | null>(
  null,
);

export const PlayerSessionProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [save, setSave] = useState<PlayerSaveData | null>(null);
  const [error, setError] = useState<DomainError | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isInitialBoot, setIsInitialBoot] = useState(false);

  const reloadSession = useCallback(async () => {
    setStatus("loading");
    setError(null);
    const result = await loadOrInitializeSave();
    if (result.ok) {
      setSave(result.data.save);
      setIsInitialBoot(result.data.isInitial);
      setStatus("success");
      return;
    }
    setSave(null);
    setError(result.error);
    setStatus("error");
  }, []);

  useEffect(() => {
    void reloadSession();
  }, [reloadSession]);

  const resetSessionToInitial = useCallback(async (): Promise<
    DomainResult<PlayerSaveData>
  > => {
    if (isPending) {
      return err("STORAGE_ERROR", "現在別の保存処理を実行中です。");
    }
    setIsPending(true);
    try {
      const result = await resetPlayerSaveToInitial();
      if (result.ok) {
        setSave(result.data);
        setError(null);
        setIsInitialBoot(true);
        setStatus("success");
      } else {
        setError(result.error);
      }
      return result;
    } finally {
      setIsPending(false);
    }
  }, [isPending]);

  const applyCommittedSave = useCallback((nextSave: PlayerSaveData) => {
    setSave(nextSave);
    setError(null);
    setStatus("success");
  }, []);

  return (
    <PlayerSessionContext.Provider
      value={{
        status,
        save,
        error,
        isPending,
        isInitialBoot,
        reloadSession,
        resetSessionToInitial,
        applyCommittedSave,
      }}
    >
      {children}
    </PlayerSessionContext.Provider>
  );
};

export const usePlayerSession = (): PlayerSessionContextValue => {
  const ctx = useContext(PlayerSessionContext);
  if (!ctx) {
    throw new Error("usePlayerSession must be used within PlayerSessionProvider");
  }
  return ctx;
};
