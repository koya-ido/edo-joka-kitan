import { appEnv } from "@/app/env";

/** アプリケーションルートシェル（Slice 0 初期化用最小構成） */
export const App = () => (
  <main className="mx-auto flex min-h-dvh w-full max-w-[450px] flex-col items-center justify-center bg-background px-4 py-8 text-foreground">
    <h1 className="font-display text-2xl font-bold leading-8 text-foreground">
      {appEnv.VITE_APP_TITLE}
    </h1>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">
      霊脈接続準備完了
    </p>
  </main>
);

