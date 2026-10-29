import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import DemoBanner from "@/components/shared/DemoBanner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Fuel Rescue - Emergency Doorstep Fuel Delivery Platform",
  description:
    "Instant emergency roadside fuel assistance. Stranded motorist connects with verified fuel delivery partners for petrol and diesel at fixed transparent ₹30 up-to-4km delivery fee.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FBFBF9] text-[#090D0B]">
        <AuthProvider>
          <DemoBanner />
          <React.Suspense fallback={<div className="h-16 bg-white border-b border-zinc-200" />}>
            <Navbar />
          </React.Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
