import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rocha & Alencar — Sistema de Gestão",
  description: "Sistema de gestão para advocacia previdenciária — Rocha & Alencar Advocacia",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Restaura o tamanho de fonte antes da hidratação para evitar flash */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var s=[13,15,16,18,20];var i=localStorage.getItem('jusdoc-font-size');if(i!==null)document.documentElement.style.fontSize=s[parseInt(i)]+'px';})()`
        }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
