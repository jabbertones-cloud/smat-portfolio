import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CursorGlow } from "@/components/CursorGlow";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smatdesigns.com"),
  title: {
    default: "SMAT — Design for Permanence",
    template: "%s | SMAT Designs",
  },
  description:
    "Full-service design studio — packaging architecture, apparel tech packs, brand identity, 3D, and photography. Cannabis, fashion, CPG, and entertainment. Tempe, AZ.",
  openGraph: {
    title: "SMAT — Design for Permanence",
    description:
      "Packaging architecture. Apparel engineering. Brand systems. 70+ brands trust SMAT for shelf-ready creative.",
    url: "https://smatdesigns.com",
    siteName: "SMAT Designs",
    locale: "en_US",
    type: "website",
  },
  alternates: { canonical: "https://smatdesigns.com" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "SMAT Designs",
  description:
    "Full-service design studio — packaging architecture, apparel tech packs, brand identity, 3D visualization, photography.",
  url: "https://smatdesigns.com",
  address: { "@type": "PostalAddress", addressLocality: "Tempe", addressRegion: "AZ" },
  foundingDate: "2014",
  founder: [
    { "@type": "Person", name: "Scott Manthey" },
    { "@type": "Person", name: "Ariel Tourner" },
  ],
  knowsAbout: [
    "Packaging Design",
    "Cannabis Packaging",
    "Apparel Tech Packs",
    "Brand Identity",
    "Product Visualization",
    "CPG Design",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebas.variable} ${dmSans.variable} ${jetbrains.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full bg-[#050505] font-[family-name:var(--font-dm)] antialiased">
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-8rem)] flex-col">{children}</div>
        <SiteFooter />
        {/* Ambient cursor glow — client only */}
        <Suspense fallback={null}>
          <CursorGlow />
        </Suspense>
      </body>
    </html>
  );
}
