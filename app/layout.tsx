import type { Metadata, Viewport } from "next";
import { Space_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font",
});

export const metadata: Metadata = {
  title: "OpenMonk",
  description: "A non-discursive sound companion for repetition, breath, silence, and attention.",
  robots: "index, follow",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
