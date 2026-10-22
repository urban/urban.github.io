import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
// import { Inter, Lora } from "next/font/google"
import { Inter } from "next/font/google"
import Script from "next/script"
import pkg from "../../package.json"
import { cn } from "@/lib/utils"
// oxlint-disable-next-line import/no-unassigned-import -- Next.js loads global styles for their CSS side effects.
import "@/styles/globals.css"
import { Footer } from "@/ui/Footer"
import { Header } from "@/ui/Header"

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})
// const lora = Lora({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-lora",
// })

const SITE_NAME = "Urban Faubion"

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "Urban Faubion's personal website",
}

const CONSOLE_SIGNATURE = `

░█░█░█▀▄░█▀▄░█▀█░█▀█░░░█▀▀░█▀█░█░█░█▀▄░▀█▀░█▀█░█▀█
░█░█░█▀▄░█▀▄░█▀█░█░█░░░█▀▀░█▀█░█░█░█▀▄░░█░░█░█░█░█
░▀▀▀░▀░▀░▀▀░░▀░▀░▀░▀░░░▀░░░▀░▀░▀▀▀░▀▀░░▀▀▀░▀▀▀░▀░▀

VERSION: ${pkg.version}
LINKEDIN: https://www.linkedin.com/in/urbanfaubion/
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      // className={cn(`antialiased optimize-legibility`, inter.className, lora.className)}
      className={cn(`antialiased optimize-legibility`, inter.className)}
    >
      <head>
        <Script
          id="console-signature"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `console.log(${JSON.stringify(CONSOLE_SIGNATURE)})`,
          }}
        />
        <Script src="/preload-color-scheme.js" />
      </head>
      <body>
        <Header siteName={SITE_NAME} />
        <main>{children}</main>
        <Footer siteName={SITE_NAME} />
        <Analytics />
      </body>
    </html>
  )
}
