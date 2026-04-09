import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import Navbar from "@/components/Navbar";
import SessionProviderClient from "@/components/SessionProviderClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillSwap",
  description: "Exchange skills and grow together",
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
              <div className="relative isolate flex min-h-full flex-col">
                <Navbar />
                <main className="relative z-0 flex-1">{children}</main>
              </div>
            </SocketProvider>
          </AuthProvider>
        </SessionProviderClient>
      </body>
    </html>
  );
}
