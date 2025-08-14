import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import Script from "next/script";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { Footer } from "@/ui/Footer";
import { Header } from "@/ui/Header";

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "Urban Faubion",
  description: "Urban Faubion's personal website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={cn(`antialiased optimize-legibility`, inter.className, lora.className)}
    >
      <head>
        <Script src="/preload-color-scheme.js" />
      </head>
      <body>
        <Header siteName={String(metadata.title)} />
        <main>{children}</main>
        <Footer siteName={String(metadata.title)} />
      </body>
    </html>
  );
}
