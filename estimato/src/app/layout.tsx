import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Estimato — Automatisk prisberegner og booking til rengøringsfirmaer",
  description:
    "Estimato giver dit rengøringsfirma en intelligent prisberegner der automatisk henter boligdata fra BBR, beregner prisen og modtager bookinger online. Prøv gratis i 14 dage — intet kreditkort krævet.",
  keywords: [
    "rengøringsfirma software",
    "prisberegner rengøring",
    "tilbudssystem rengøring",
    "booking software rengøring",
    "BBR opslag rengøring",
    "automatisk tilbud rengøringsfirma",
  ],
  openGraph: {
    title: "Estimato — Automatisk prisberegner og booking til rengøringsfirmaer",
    description:
      "Spar timer om ugen med automatisk prisberegning og online booking til dit rengøringsfirma.",
    type: "website",
    locale: "da_DK",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`${jakarta.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f9fafb]">{children}</body>
    </html>
  );
}
