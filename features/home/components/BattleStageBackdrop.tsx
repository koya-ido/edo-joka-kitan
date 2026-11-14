/**
 * ホーム画面の出撃編成舞台に敷く夜陰・鳥居・霊力結界陣のSVG背景。
 * 色指定はすべてセマンティックCSS変数を参照する。
 */
export const BattleStageBackdrop = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden select-none"
  >
    {/* 夜空の月光グラデーション */}
    <div
      className="absolute inset-0 opacity-60"
      style={{
        background:
          "radial-gradient(circle at 50% 24%, color-mix(in oklab, var(--accent) 26%, transparent) 0%, color-mix(in oklab, var(--primary) 12%, transparent) 42%, transparent 72%)",
      }}
    />

    {/* 鳥居と満月のシルエット */}
    <svg
      viewBox="0 0 400 225"
      className="absolute inset-0 h-full w-full opacity-25"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* 満月 */}
      <circle cx="200" cy="76" r="46" fill="var(--accent)" opacity="0.28" />
      <circle
        cx="200"
        cy="76"
        r="52"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.45"
      />
      {/* 鳥居シルエット */}
      <g fill="var(--primary)" opacity="0.65">
        <path d="M112 58 Q200 70 288 58 L284 68 Q200 78 116 68 Z" />
        <rect x="130" y="84" width="140" height="8" rx="1" />
        <rect x="148" y="66" width="11" height="145" />
        <rect x="241" y="66" width="11" height="145" />
        <rect x="195" y="68" width="10" height="18" />
      </g>
    </svg>

    {/* 回転する五芒星・結界陣 */}
    <svg
      viewBox="0 0 200 200"
      className="animate-sigil-slow absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 opacity-20"
    >
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.2"
        strokeDasharray="6 4"
      />
      <circle
        cx="100"
        cy="100"
        r="76"
        fill="none"
        stroke="var(--barrier)"
        strokeWidth="1"
      />
      <polygon
        points="100,24 144.67,161.49 27.72,76.51 172.28,76.51 55.33,161.49"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.2"
      />
    </svg>

    {/* 浮遊する霊火 */}
    <span className="animate-spirit-float absolute top-6 left-8 h-1.5 w-1.5 rounded-full bg-barrier shadow-sm" />
    <span className="animate-spirit-float absolute right-10 bottom-8 h-2 w-2 rounded-full bg-accent shadow-sm" />
    <span className="animate-spirit-float absolute top-12 right-16 h-1.5 w-1.5 rounded-full bg-primary shadow-sm" />

    {/* 四隅の隅金具 */}
    <span className="absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2 border-accent/60" />
    <span className="absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2 border-accent/60" />
    <span className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-accent/60" />
    <span className="absolute right-2 bottom-2 h-3 w-3 border-r-2 border-b-2 border-accent/60" />
  </div>
);
