import type { SVGProps } from "react";

export const MagatamaIcon = ({ className, ...rest }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
    {...rest}
  >
    <path
      d="M14.5 3.5C9.5 3.5 5.5 7.5 5.5 12.5C5.5 16.4 8.2 19.6 11.8 20.4C13.6 20.8 15 19.2 14.2 17.5C13.5 16 14 14.3 15.4 13.4C17.4 12.1 18.5 9.8 18.5 7.5C18.5 5.3 16.7 3.5 14.5 3.5Z"
      fill="currentColor"
    />
    <circle cx="13.5" cy="7.5" r="1.5" fill="var(--card)" />
  </svg>
);

export const HisuiIcon = ({ className, ...rest }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
    {...rest}
  >
    <path
      d="M12 3.5L19.5 9.5L17 20.5H7L4.5 9.5L12 3.5Z"
      fill="currentColor"
    />
    <path
      d="M12 6.5L15.5 10.5L14 18H10L8.5 10.5L12 6.5Z"
      fill="var(--card)"
      fillOpacity="0.3"
    />
  </svg>
);
