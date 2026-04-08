import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">Estimato</h1>
      <p className="text-xl text-gray-500 mb-8 max-w-md">
        Automatiser tilbud og booking for dit rengøringsfirma. Ingen manuel
        sagsbehandling.
      </p>

      <div className="flex gap-4">
        <Link
          href="/auth/signup"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Prøv gratis i 14 dage
        </Link>
        <Link
          href="/auth/login"
          className="border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Log ind
        </Link>
      </div>

      <p className="mt-6 text-sm text-gray-400">
        499 kr/md · Intet kreditkort ved oprettelse
      </p>
    </main>
  );
}
