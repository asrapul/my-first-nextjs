import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import ChatWidget from "@/components/ChatWidget";
import StructuredData from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://asrapul-nextjs.vercel.app";

export const metadata: Metadata = {
  title: "Andi Asyraful - Web Developer Portfolio",
  description:
    "Portfolio Andi Asyraful, Web Developer & Software Engineer. Fokus pada Next.js, React, Flutter, dan Cyber Security.",
  keywords: [
    "web developer",
    "next.js",
    "react",
    "flutter",
    "portfolio",
    "software engineer",
    "frontend developer",
    "andi asyraful",
    "smk telkom makassar",
  ],
  authors: [{ name: "Andi Asyraful" }],
  creator: "Andi Asyraful",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Andi Asyraful - Web Developer Portfolio",
    description:
      "Portfolio Andi Asyraful, Web Developer & Software Engineer. Fokus pada Next.js, React, Flutter, dan Cyber Security.",
    siteName: "Andi Asyraful Portfolio",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Andi Asyraful - Web Developer Portfolio",
    description:
      "Portfolio Andi Asyraful, Web Developer & Software Engineer.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <ChatWidget />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
