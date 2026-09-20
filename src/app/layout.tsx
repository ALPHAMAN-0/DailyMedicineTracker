import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily medicine tracker",
  description: "Track today's medicine doses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
