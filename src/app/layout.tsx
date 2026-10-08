import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { birthday } from "@/config/birthday";
import "./globals.css";

/** Display redondeada y juguetona para títulos. */
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

/** Sans legible para cuerpo de texto. */
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: birthday.documentTitle,
  description: birthday.description,
  openGraph: {
    title: birthday.documentTitle,
    description: birthday.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#71cfce",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="font-body text-ink antialiased">{children}</body>
    </html>
  );
}
