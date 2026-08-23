import { NextResponse } from "next/server";
import { sessionAdminValide } from "@/lib/server/adminAuth";
import { bannirOrganisateur, leverSuspensionOrganisateur } from "@/lib/server/moderation";

export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  if (!(await sessionAdminValide())) return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });

  const { profileId } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === "bannir") {
    const motif = typeof body?.motif === "string" ? body.motif.trim() : "";
    if (!motif) return NextResponse.json({ success: false, error: "Motif requis." }, { status: 400 });
    await bannirOrganisateur(profileId, motif);
    return NextResponse.json({ success: true });
  }

  if (action === "lever_suspension") {
    await leverSuspensionOrganisateur(profileId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Action invalide." }, { status: 400 });
}
