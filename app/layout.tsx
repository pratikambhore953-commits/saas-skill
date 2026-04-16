import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import Navbar from "@/components/Navbar";
import SessionProviderClient from "@/components/SessionProviderClient";
import PageTransition from "@/components/PageTransition";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "SkillSwap — Exchange Skills, Grow Together",
  description: "Trade skills with people around you. Teach what you know, learn what you don't.",
  openGraph: {
    title: "SkillSwap — Exchange Skills, Grow Together",
    description: "Trade skills with people around you. Teach what you know, learn what you don't.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#0D0F1A] text-white">
        <SessionProviderClient>
          <AuthProvider>
            <SocketProvider>
              <ErrorBoundary>
                <div className="relative isolate flex min-h-full flex-col">
                  <Navbar />
                  <main className="relative z-0 flex-1">
                    <PageTransition>{children}</PageTransition>
                  </main>
                </div>
              </ErrorBoundary>
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 3500,
                  style: {
                    background: "#0F172A",
                    color: "#E2E8F0",
                    border: "1px solid #334155",
                  },
                  success: {
                    style: {
                      border: "1px solid #F59E0B",
                    },
                    iconTheme: {
                      primary: "#F59E0B",
                      secondary: "#0F172A",
                    },
                  },
                  error: {
                    style: {
                      border: "1px solid #ef4444",
                    },
                  },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </SessionProviderClient>
      </body>
    </html>
  );
}
