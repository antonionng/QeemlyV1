import type { Metadata } from "next";
import { Parkinsans } from "next/font/google";
import "./globals.css";

const parkinsans = Parkinsans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-parkinsans",
  display: "swap",
  fallback: ["sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Qeemly - Gulf Compensation Intelligence",
  description:
    "Real-time, localized salary intelligence for the Gulf. Built for HR, founders, and finance teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${parkinsans.variable} bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
