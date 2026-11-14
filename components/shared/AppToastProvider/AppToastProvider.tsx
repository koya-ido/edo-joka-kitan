import { Toast, type ToastVariant } from "@/components/ui/Toast";
import type { DomainError } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastMessage {
  readonly id: number;
  readonly title: string;
  readonly description?: string;
  readonly variant: ToastVariant;
}

interface AppToastContextValue {
  readonly showErrorToast: (error: DomainError) => void;
  readonly showSuccessToast: (title: string, description?: string) => void;
}

const AppToastContext = createContext<AppToastContextValue | null>(null);

const TOAST_DURATION_MS = 2000;

export const AppToastProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const viewportRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && viewportRef.current?.contains(target)) {
        return;
      }
      setMessages([]);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [messages.length]);

  const enqueueToast = useCallback(
    (title: string, variant: ToastVariant, description?: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setMessages((prev) => [...prev.slice(-2), { id, title, description, variant }]);
    },
    [],
  );

  const showErrorToast = useCallback(
    (error: DomainError) => {
      enqueueToast("操作を完了できませんでした", "destructive", error.message);
    },
    [enqueueToast],
  );

  const showSuccessToast = useCallback(
    (title: string, description?: string) => {
      enqueueToast(title, "success", description);
    },
    [enqueueToast],
  );

  const handleOpenChange = (id: number, open: boolean) => {
    if (!open) {
      setMessages((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <AppToastContext.Provider value={{ showErrorToast, showSuccessToast }}>
      <Toast.Provider swipeDirection="up" duration={TOAST_DURATION_MS}>
        {children}
        {messages.map((item) => (
          <Toast.Root
            key={item.id}
            variant={item.variant}
            open
            onOpenChange={(open) => {
              handleOpenChange(item.id, open);
            }}
          >
            <div>
              <Toast.Title>{item.title}</Toast.Title>
              {item.description && (
                <Toast.Description>{item.description}</Toast.Description>
              )}
            </div>
            <Toast.Close />
          </Toast.Root>
        ))}
        <Toast.Viewport ref={viewportRef} />
      </Toast.Provider>
    </AppToastContext.Provider>
  );
};

export const useAppToast = (): AppToastContextValue => {
  const ctx = useContext(AppToastContext);
  if (!ctx) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }
  return ctx;
};
