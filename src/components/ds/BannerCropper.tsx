"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "./Button";

const APERCU_LARGEUR = 320;
const APERCU_HAUTEUR = 160;
const SORTIE_LARGEUR = 800;
const SORTIE_HAUTEUR = 400;

type Position = { x: number; y: number };

function clamper(pos: Position, echelle: number, natW: number, natH: number): Position {
  const minX = Math.min(0, APERCU_LARGEUR - natW * echelle);
  const minY = Math.min(0, APERCU_HAUTEUR - natH * echelle);
  return {
    x: Math.min(0, Math.max(pos.x, minX)),
    y: Math.min(0, Math.max(pos.y, minY)),
  };
}

export function BannerCropper({
  banniereActuelle,
  onValider,
}: {
  banniereActuelle?: string;
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
    return Math.max(APERCU_LARGEUR / img.naturalWidth, APERCU_HAUTEUR / img.naturalHeight);
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
          x: (APERCU_LARGEUR - img.naturalWidth * base) / 2,
          y: (APERCU_HAUTEUR - img.naturalHeight * base) / 2,
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
    canvas.width = SORTIE_LARGEUR;
    canvas.height = SORTIE_HAUTEUR;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const facteur = SORTIE_LARGEUR / APERCU_LARGEUR;
    const sx = -pos.x / echelle;
    const sy = -pos.y / echelle;
    const sLargeur = APERCU_LARGEUR / echelle;
    const sHauteur = APERCU_HAUTEUR / echelle;
    ctx.drawImage(image, sx, sy, sLargeur, sHauteur, 0, 0, APERCU_LARGEUR * facteur, APERCU_HAUTEUR * facteur);
    onValider(canvas.toDataURL("image/jpeg", 0.9));
    setImage(null);
  }

  return (
    <div className="flex flex-col gap-2">
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-[110px] flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border-strong)", background: "var(--ds-surface)" }}
        >
          {banniereActuelle ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banniereActuelle} alt="Bannière du tournoi" className="w-full h-full object-cover" />
          ) : (
            <>
              <ImagePlus size={20} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
              <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Ajouter une image</span>
            </>
          )}
        </button>
      )}

      {image && (
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden touch-none select-none mx-auto"
            style={{
              width: APERCU_LARGEUR,
              height: APERCU_HAUTEUR,
              borderRadius: "var(--ds-radius-md)",
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
