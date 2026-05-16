import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4chantok",
  description: "A privacy-conscious 4chan media viewer with a TikTok-style vertical feed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
