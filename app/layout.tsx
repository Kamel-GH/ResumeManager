import type { Metadata } from "next";
import "./globals.css";
import "@/features/editor/styles/editor-left-panel.css";
import "@/features/editor/styles/editor-canvas.css";

export const metadata: Metadata = {
  title: "Resume Manager",
  description: "Canvas-first resume template editor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
