import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { NhlQueryProvider } from "@/lib/nhl/client";
import { WatchingProvider } from "@/lib/watching";
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
  title: "NHL Companion",
  description: "Live NHL game companion — scores, plays, shots, stats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NhlQueryProvider>
          <WatchingProvider>
            <AppShell>{children}</AppShell>
          </WatchingProvider>
        </NhlQueryProvider>
      </body>
    </html>
  );
}
