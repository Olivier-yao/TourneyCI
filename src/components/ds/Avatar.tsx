"use client";

type AvatarProps = {
  initiales: string;
  taille?: number;
  empile?: boolean;
};

export function Avatar({ initiales, taille = 36, empile = false }: AvatarProps) {
  return (
    <div
      className="flex items-center justify-center shrink-0 font-semibold"
      style={{
        width: taille,
        height: taille,
        borderRadius: "var(--ds-radius-pill)",
        background: "var(--ds-accent-900)",
        border: "1px solid var(--ds-accent-600)",
        color: "var(--ds-accent-300)",
        fontSize: taille * 0.36,
        fontFamily: "var(--ds-font-body)",
        boxShadow: empile ? "0 0 0 2px var(--ds-bg)" : undefined,
        marginLeft: empile ? -taille * 0.22 : undefined,
      }}
    >
      {initiales}
    </div>
  );
}

export function AvatarPile({ initiales }: { initiales: string[] }) {
  return (
    <div className="flex">
      {initiales.map((init, i) => (
        <Avatar key={i} initiales={init} taille={24} empile={i > 0} />
      ))}
    </div>
  );
}
