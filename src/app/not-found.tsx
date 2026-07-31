import Link from "next/link";
import { IconTrophee } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream-100 text-ink-900 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <IconTrophee size={24} className="text-forest-900" />
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="text-ink-600 max-w-sm">
        Cette page n&apos;existe pas ou plus.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-forest-900 hover:bg-forest-700 text-white px-4 py-2 text-sm font-semibold transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
