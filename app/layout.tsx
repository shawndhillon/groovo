import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { LibraryProvider } from "@/app/hooks/useLibrary";
import OverlayRoot from "@/app/OverlayRoot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grovoo",
  description: "Music album reviews and ratings platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* App-wide React context provider */}
        <LibraryProvider>
          {children}
        </LibraryProvider>

        {/* GLOBAL OVERLAY PORTAL (modal/menu mount point) */}
        <OverlayRoot />
      </body>
    </html>
  );
}
