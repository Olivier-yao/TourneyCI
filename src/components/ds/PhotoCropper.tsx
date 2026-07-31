"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "./Button";

const TAILLE_APERCU = 260;
const TAILLE_SORTIE = 480;

type Position = { x: number; y: number };

function clamper(pos: Position, echelle: number, natW: number, natH: number): Position {
  const minX = Math.min(0, TAILLE_APERCU - natW * echelle);
  const minY = Math.min(0, TAILLE_APERCU - natH * echelle);
  return {
    x: Math.min(0, Math.max(pos.x, minX)),
    y: Math.min(0, Math.max(pos.y, minY)),
  };
}

export function PhotoCropper({
  photoActuelle,
  onValider,
}: {
  photoActuelle?: string;
  onValider: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });
  const glissement = useRef<{ actif: boolean; depart: Position; posDepart: Position }>({
    actif: false,
    depart: { x: 0, y: 0 },
    posDepart: { x: 0, y: 0 },
  });

  function baseEchelle(img: HTMLImageElement) {
    return Math.max(TAILLE_APERCU / img.naturalWidth, TAILLE_APERCU / img.naturalHeight);
  }

  function ouvrirFichier(fichier: File) {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const img = new Image();
      img.onload = () => {
        const base = baseEchelle(img);
        setImage(img);
        setZoom(1);
        setPos({
          x: (TAILLE_APERCU - img.naturalWidth * base) / 2,
          y: (TAILLE_APERCU - img.naturalHeight * base) / 2,
        });
      };
      img.src = lecteur.result as string;
    };
    lecteur.readAsDataURL(fichier);
  }

  function demarrerGlissement(clientX: number, clientY: number) {
    glissement.current = { actif: true, depart: { x: clientX, y: clientY }, posDepart: pos };
  }

  function deplacer(clientX: number, clientY: number) {
    if (!glissement.current.actif || !image) return;
    const echelle = baseEchelle(image) * zoom;
    const dx = clientX - glissement.current.depart.x;
    const dy = clientY - glissement.current.depart.y;
    const nouvelle = {
      x: glissement.current.posDepart.x + dx,
      y: glissement.current.posDepart.y + dy,
    };
    setPos(clamper(nouvelle, echelle, image.naturalWidth, image.naturalHeight));
  }

  function arreterGlissement() {
    glissement.current.actif = false;
  }

  function changerZoom(valeur: number) {
    if (!image) return;
    const echelle = baseEchelle(image) * valeur;
    setZoom(valeur);
    setPos((p) => clamper(p, echelle, image.naturalWidth, image.naturalHeight));
  }

  function valider() {
    if (!image) return;
    const echelle = baseEchelle(image) * zoom;
    const canvas = document.createElement("canvas");
    canvas.width = TAILLE_SORTIE;
    canvas.height = TAILLE_SORTIE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const facteur = TAILLE_SORTIE / TAILLE_APERCU;
    const sx = -pos.x / echelle;
    const sy = -pos.y / echelle;
    const sTaille = TAILLE_APERCU / echelle;
    ctx.save();
    ctx.beginPath();
    ctx.arc(TAILLE_SORTIE / 2, TAILLE_SORTIE / 2, TAILLE_SORTIE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, sx, sy, sTaille, sTaille, 0, 0, TAILLE_APERCU * facteur, TAILLE_APERCU * facteur);
    ctx.restore();
    onValider(canvas.toDataURL("image/jpeg", 0.9));
    setImage(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const fichier = e.target.files?.[0];
          if (fichier) ouvrirFichier(fichier);
          e.target.value = "";
        }}
      />

      {!image && (
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: "var(--ds-accent-600)", border: "1px solid var(--ds-border)" }}
          >
            {photoActuelle ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoActuelle} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <Camera size={22} color="var(--ds-accent-100)" strokeWidth={2} />
            )}
          </div>
          <Button variante="secondary" type="button" onClick={() => inputRef.current?.click()}>
            {photoActuelle ? "Changer la photo" : "Ajouter une photo"}
          </Button>
        </div>
      )}

      {image && (
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden touch-none select-none"
            style={{
              width: TAILLE_APERCU,
              height: TAILLE_APERCU,
              borderRadius: "50%",
              border: "1px solid var(--ds-border)",
              background: "var(--ds-surface)",
              cursor: "grab",
            }}
            onMouseDown={(e) => demarrerGlissement(e.clientX, e.clientY)}
            onMouseMove={(e) => deplacer(e.clientX, e.clientY)}
            onMouseUp={arreterGlissement}
            onMouseLeave={arreterGlissement}
            onTouchStart={(e) => demarrerGlissement(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => deplacer(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={arreterGlissement}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt="Aperçu à recadrer"
              draggable={false}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: image.naturalWidth * baseEchelle(image) * zoom,
                height: image.naturalHeight * baseEchelle(image) * zoom,
                maxWidth: "none",
                pointerEvents: "none",
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => changerZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variante="primary" type="button" onClick={valider}>
              Valider le recadrage
            </Button>
            <button
              type="button"
              onClick={() => setImage(null)}
              className="flex items-center justify-center w-9 h-9"
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              aria-label="Annuler"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
