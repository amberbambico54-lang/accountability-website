import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth-provider";
import { WorkspacePagesProvider } from "@/components/workspace-pages-provider";
import { IdentityColorProvider } from "@/components/identity-color-provider";
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
  title: "Our Space",
  description: "A private digital home for Fernan and Alpha",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F7F4ED] text-[#313B32]">
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[#71866E]">Loading Our Space…</div>}>
          <IdentityColorProvider>
            <AuthProvider>
              <WorkspacePagesProvider>
                <AppShell>{children}</AppShell>
              </WorkspacePagesProvider>
            </AuthProvider>
          </IdentityColorProvider>
        </Suspense>
      </body>
    </html>
  );
}
