import { NextResponse } from "next/server";
import {
  identifiantsValides,
  pinValide,
  definirEtape1,
  etape1Validee,
  definirSessionAdmin,
  sessionAdminValide,
  deconnecterAdmin,
} from "@/lib/server/adminAuth";

/** État courant de la connexion admin (pour restaurer l'écran au montage —
 * même logique que estAuthentifieAdminSecurise()/etapeIdentifiantsValidee()
 * avant, mais lu depuis un cookie httpOnly plutôt que sessionStorage). */
export async function GET() {
  if (await sessionAdminValide()) return NextResponse.json({ success: true, data: { etape: "interface" } });
  if (await etape1Validee()) return NextResponse.json({ success: true, data: { etape: "pin" } });
  return NextResponse.json({ success: true, data: { etape: "identifiants" } });
}

/** Connexion en deux étapes (identifiant+mot de passe, puis PIN) — chaque
 * étape pose son propre jeton signé, jamais les identifiants eux-mêmes. Le
 * anti-brute-force (tentatives/cooldown) reste géré côté client comme avant
 * (UX seulement) : ce n'était pas une vraie protection serveur avant non
 * plus, hors périmètre de ce changement. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (body?.etape === "identifiants") {
    if (!identifiantsValides(String(body?.identifiant ?? ""), String(body?.motDePasse ?? ""))) {
      return NextResponse.json({ success: false, error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
    }
    await definirEtape1();
    return NextResponse.json({ success: true });
  }

  if (body?.etape === "pin") {
    if (!(await etape1Validee())) {
      return NextResponse.json({ success: false, error: "Étape précédente non validée." }, { status: 401 });
    }
    if (!pinValide(String(body?.pin ?? ""))) {
      return NextResponse.json({ success: false, error: "Code invalide." }, { status: 401 });
    }
    await definirSessionAdmin();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Étape inconnue." }, { status: 400 });
}

export async function DELETE() {
  await deconnecterAdmin();
  return NextResponse.json({ success: true });
}
