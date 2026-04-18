import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import HtmlLangSync from "@/components/shared/HtmlLangSync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Wedding Partners — Sri Lanka's #1 Wedding Platform",
  description:
    "AI-powered matchmaking, verified profiles, and a complete marketplace of top wedding service partners. Find your perfect match and plan your dream wedding.",
  keywords: "Sri Lanka wedding, matrimony, matchmaking, wedding partners, wedding services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HtmlLangSync />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
