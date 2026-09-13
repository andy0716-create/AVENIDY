import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AVENIDY — Think. Learn. Build.",
  description: "AI-powered learning and creation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
