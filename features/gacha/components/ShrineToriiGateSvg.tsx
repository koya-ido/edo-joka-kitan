export interface ShrineToriiGateSvgProps {
  readonly auraClass: string;
}

/** 神社の参道（石畳・杉並木・石灯籠）と朱塗りの鳥居ゲート */
export const ShrineToriiGateSvg = ({ auraClass }: ShrineToriiGateSvgProps) => (
  <svg viewBox="0 0 320 260" className="h-64 w-full" aria-hidden="true">
    <rect
      x="0"
      y="0"
      width="320"
      height="260"
      rx="16"
      fill="currentColor"
      className="text-battle-surface-deep"
    />
    <polygon
      points="0,180 35,40 70,180"
      fill="currentColor"
      className="text-battle-surface"
    />
    <polygon
      points="250,180 285,40 320,180"
      fill="currentColor"
      className="text-battle-surface"
    />
    <polygon
      points="128,175 192,175 270,260 50,260"
      fill="currentColor"
      className="text-secondary/20"
    />
    <line
      x1="160"
      y1="175"
      x2="160"
      y2="260"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="6 6"
      className="text-border/35"
    />
    <rect
      x="66"
      y="150"
      width="12"
      height="34"
      fill="currentColor"
      className="text-muted-foreground/50"
    />
    <circle
      cx="72"
      cy="146"
      r="5"
      fill="currentColor"
      className="animate-pulse text-accent"
    />
    <rect
      x="242"
      y="150"
      width="12"
      height="34"
      fill="currentColor"
      className="text-muted-foreground/50"
    />
    <circle
      cx="248"
      cy="146"
      r="5"
      fill="currentColor"
      className="animate-pulse text-accent"
    />

    <circle
      cx="160"
      cy="122"
      r="42"
      fill="currentColor"
      fillOpacity="0.22"
      className={`animate-pulse ${auraClass}`}
    />
    <circle
      cx="160"
      cy="122"
      r="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeDasharray="8 5"
      className={`animate-spin [animation-duration:6s] ${auraClass}`}
    />

    <g fill="currentColor" className="text-primary">
      <path d="M70 58 Q160 66 250 58 L244 70 Q160 76 76 70 Z" />
      <rect x="86" y="88" width="148" height="9" rx="2" />
      <rect x="108" y="68" width="12" height="114" rx="2" />
      <rect x="200" y="68" width="12" height="114" rx="2" />
      <rect x="155" y="70" width="10" height="20" rx="1" />
    </g>
    <rect
      x="104"
      y="176"
      width="20"
      height="8"
      rx="2"
      fill="currentColor"
      className="text-battle-surface"
    />
    <rect
      x="196"
      y="176"
      width="20"
      height="8"
      rx="2"
      fill="currentColor"
      className="text-battle-surface"
    />
  </svg>
);
