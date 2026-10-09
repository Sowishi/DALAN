import React from "react";

export type IconName =
  | "search"
  | "locate"
  | "navigate"
  | "bell"
  | "arrow-up"
  | "play"
  | "water"
  | "warning"
  | "thermometer"
  | "weather"
  | "humidity"
  | "leaf"
  | "walk"
  | "run"
  | "bike"
  | "car"
  | "chevron-back"
  | "chevron-forward"
  | "flame"
  | "pin"
  | "apps"
  | "bus"
  | "shield"
  | "plus"
  | "camera"
  | "check"
  | "map"
  | "google";

type IconProps = {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
};

// Clean, Apple-style line/solid glyphs on a 24x24 grid.
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = "#000",
  strokeWidth = 2,
}) => {
  const stroke = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
  };

  if (name === "google") {
    return (
      <svg {...common}>
        <path
          fill="#4285F4"
          d="M21.6 12.2c0-.6-.05-1.2-.16-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .95-3.4.95-2.6 0-4.8-1.75-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
        />
        <path
          fill="#FBBC05"
          d="M6.4 13.95a6 6 0 0 1 0-3.9V7.45H3.1a10 10 0 0 0 0 9.1l3.3-2.6z"
        />
        <path
          fill="#EA4335"
          d="M12 5.95c1.5 0 2.8.5 3.8 1.5l2.85-2.85A10 10 0 0 0 12 2a10 10 0 0 0-8.9 5.45l3.3 2.6C7.2 7.7 9.4 5.95 12 5.95z"
        />
      </svg>
    );
  }

  const paths: Record<Exclude<IconName, "google">, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" {...stroke} />
        <path d="M16.5 16.5 21 21" {...stroke} />
      </>
    ),
    locate: (
      <>
        <circle cx="12" cy="12" r="6" {...stroke} />
        <circle cx="12" cy="12" r="1.6" fill={color} />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...stroke} />
      </>
    ),
    navigate: <path d="M21 4 3.5 11.2 11 13l1.8 7.5L21 4Z" fill={color} />,
    bell: (
      <>
        <path
          d="M6 16v-5a6 6 0 0 1 12 0v5l1.8 2.2H4.2L6 16Z"
          {...stroke}
        />
        <path d="M10 20.5a2 2 0 0 0 4 0" {...stroke} />
      </>
    ),
    "arrow-up": <path d="M12 20V5M6 11l6-6 6 6" {...stroke} />,
    play: <path d="M8 5.5v13l11-6.5-11-6.5Z" fill={color} />,
    water: (
      <path
        d="M12 3S5 10.6 5 15a7 7 0 0 0 14 0C19 10.6 12 3 12 3Z"
        fill={color}
      />
    ),
    warning: (
      <>
        <path d="M12 4 2.5 20h19L12 4Z" {...stroke} />
        <path d="M12 10v4" {...stroke} />
        <circle cx="12" cy="17.2" r="0.9" fill={color} />
      </>
    ),
    thermometer: (
      <>
        <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" {...stroke} />
        <circle cx="12" cy="18" r="1.6" fill={color} />
      </>
    ),
    weather: (
      <>
        <circle cx="8" cy="8" r="3" {...stroke} />
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1" {...stroke} strokeWidth={1.4} />
        <path
          d="M10 18a3.5 3.5 0 0 1 6.8-1.2A3 3 0 1 1 17 22H9.5A2.75 2.75 0 0 1 10 18Z"
          {...stroke}
        />
      </>
    ),
    humidity: (
      <path
        d="M12 3.5S6.5 10 6.5 14a5.5 5.5 0 0 0 11 0C17.5 10 12 3.5 12 3.5Z"
        {...stroke}
      />
    ),
    leaf: (
      <>
        <path
          d="M20 4S9 3 5.5 9.5c-2.4 4.5.5 9 .5 9S18 20 20 10c.6-3 0-6 0-6Z"
          {...stroke}
        />
        <path d="M6 18.5C9 13 13 9.5 17 7.5" {...stroke} />
      </>
    ),
    walk: (
      <>
        <circle cx="13" cy="4.2" r="1.8" {...stroke} />
        <path d="M13 8l-2.5 4 2 2 1 6M10.5 12 8 11M14 10l3 1-1 4M8 21l2.5-5" {...stroke} />
      </>
    ),
    run: (
      <>
        <circle cx="14" cy="4.2" r="1.8" {...stroke} />
        <path d="M14 8l-3.5 3 1 3.5 1.5 6M11.5 11 7 12l-1.5 3M15.5 11l3.5.5-1.5 4" {...stroke} />
      </>
    ),
    bike: (
      <>
        <circle cx="6" cy="17" r="3.5" {...stroke} />
        <circle cx="18" cy="17" r="3.5" {...stroke} />
        <path d="M6 17 11 9h4M9 9l5 8M14 6h3" {...stroke} />
      </>
    ),
    car: (
      <>
        <path
          d="M3 15v-2.3l2-4.2A2 2 0 0 1 6.8 7h10.4a2 2 0 0 1 1.8 1.5l2 4.2V15"
          {...stroke}
        />
        <path d="M3 15h18v2.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V17H6v.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V15Z" {...stroke} />
        <path d="M6.5 12h11" {...stroke} strokeWidth={1.4} />
      </>
    ),
    "chevron-back": <path d="M15 5l-7 7 7 7" {...stroke} />,
    "chevron-forward": <path d="M9 5l7 7-7 7" {...stroke} />,
    flame: (
      <path
        d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .4-2 1-2.6C9 10 12 8 12 2Z M12 22a6 6 0 0 1-6-6c0-2 1-3.5 2.2-4.6A6 6 0 0 0 12 22Z"
        fill={color}
      />
    ),
    pin: (
      <>
        <path
          d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z"
          fill={color}
        />
        <circle cx="12" cy="9" r="2.6" fill="#fff" />
      </>
    ),
    apps: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" {...stroke} />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" {...stroke} />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" {...stroke} />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" {...stroke} />
      </>
    ),
    bus: (
      <>
        <rect x="4" y="4" width="16" height="13" rx="2.5" {...stroke} />
        <path d="M4 11h16M9 4v7M15 4v7" {...stroke} strokeWidth={1.4} />
        <circle cx="8" cy="19" r="1.4" {...stroke} />
        <circle cx="16" cy="19" r="1.4" {...stroke} />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" {...stroke} />
        <path d="M9 12l2 2 4-4" {...stroke} />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" {...stroke} />,
    camera: (
      <>
        <path d="M3 8.5A2 2 0 0 1 5 6.5h2l1.3-2h7.4L17 6.5h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5Z" {...stroke} />
        <circle cx="12" cy="13" r="3.5" {...stroke} />
      </>
    ),
    check: <path d="M5 12.5l4.5 4.5L19 7" {...stroke} />,
    map: (
      <>
        <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" {...stroke} />
        <path d="M9 4v14M15 6v14" {...stroke} strokeWidth={1.4} />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
};
