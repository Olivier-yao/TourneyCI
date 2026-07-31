type IconProps = {
  size?: 16 | 20 | 24;
  className?: string;
};

const proprietes = (size: IconProps["size"]) => ({
  width: size ?? 20,
  height: size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconTrophee({ size, className }: IconProps) {
  return (
    <svg {...proprietes(size)} className={className}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5a3 3 0 0 0 3 5" />
      <path d="M16 5h3a3 3 0 0 1-3 5" />
      <path d="M12 13v3" />
      <path d="M9 20h6" />
      <path d="M10 16h4l1 4H9l1-4Z" />
    </svg>
  );
}

export function IconCalendrier({ size, className }: IconProps) {
  return (
    <svg {...proprietes(size)} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function IconLieu({ size, className }: IconProps) {
  return (
    <svg {...proprietes(size)} className={className}>
      <path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function IconParticipants({ size, className }: IconProps) {
  return (
    <svg {...proprietes(size)} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3 3 0 0 1 0 6.9" />
      <path d="M18.5 14a6.5 6.5 0 0 1 3 5.5" />
    </svg>
  );
}

export function IconPiece({ size, className }: IconProps) {
  return (
    <svg {...proprietes(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 15V9l3 1.5L15 9v6" />
    </svg>
  );
}

export function IconCheck({ size, className }: IconProps) {
  return (
    <svg {...proprietes(size)} className={className}>
      <path d="M5 12.5 10 17l9-10" />
    </svg>
  );
}
