import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import Navbar from "@/components/Navbar";
import SessionProviderClient from "@/components/SessionProviderClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageTransition from "@/components/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "SkillSwap — Exchange Skills, Grow Together",
  description:
    "Trade skills with people around you. Teach what you know, learn what you don't.",
  openGraph: {
    title: "SkillSwap — Exchange Skills, Grow Together",
    description:
      "Trade skills with people around you. Teach what you know, learn what you don't.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SkillSwap",
      },
    ],
  },
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
      <body className="min-h-full bg-[#0D0F1A] text-white">
        <SessionProviderClient>
          <AuthProvider>
            <SocketProvider>
              <ErrorBoundary>
                <div className="relative isolate flex min-h-full flex-col">
                  <Navbar />
                  <main className="relative z-0 flex-1">
                    <Suspense fallback={<div className="p-4 text-slate-300">Loading...</div>}>
                      <PageTransition>{children}</PageTransition>
                    </Suspense>
                  </main>
                </div>
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    duration: 3200,
                    style: {
                      background: "#0f172a",
                      color: "#e2e8f0",
                      border: "1px solid rgba(148, 163, 184, 0.35)",
                    },
                    success: {
                      style: {
                        border: "1px solid rgba(245, 158, 11, 0.55)",
                      },
                      iconTheme: {
                        primary: "#F59E0B",
                        secondary: "#0f172a",
                      },
                    },
                    error: {
                      style: {
                        border: "1px solid rgba(239, 68, 68, 0.55)",
                      },
                      iconTheme: {
                        primary: "#ef4444",
                        secondary: "#0f172a",
                      },
                    },
                  }}
                />
              </ErrorBoundary>
            </SocketProvider>
          </AuthProvider>
        </SessionProviderClient>
      </body>
    </html>
  );
}
