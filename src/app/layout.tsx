import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Catastrophic Decision Tree Engine",
  description: "Transformasi keputusan sepele harian menjadi peta eskalasi bencana komikal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${plexMono.variable} font-sans bg-ink-900 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
