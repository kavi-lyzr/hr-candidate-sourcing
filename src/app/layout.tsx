import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { HeaderWithSection } from "@/components/header-with-section";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lyzr HR Candidate Sourcing Agent",
  description: "AI-powered candidate sourcing and recruitment platform",
};

import { AuthProvider } from "@/lib/AuthProvider";

// ... (rest of the imports)

// ... (font definitions)

// ... (metadata)

import { AuthGuard } from "@/components/AuthGuard";

// ... (rest of the imports)

// ... (font definitions)

// ... (metadata)

import { Toaster } from "@/components/ui/toaster";

// ... (rest of the imports)

// ... (font definitions)

// ... (metadata)

import { ThemeProvider } from "@/components/ThemeProvider";

// ... (rest of the imports)

// ... (font definitions)

// ... (metadata)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@1,2&display=swap" rel="stylesheet"></link>
        <title>Lyzr HR Candidate Sourcing Agent</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <AuthProvider>
            <SidebarProvider>
              <AuthGuard>
                <AppSidebar />
                <main className="flex-1">
                  <HeaderWithSection />
                  <div className="flex-1 p-4">
                    {children}
                  </div>
                </main>
              </AuthGuard>
            </SidebarProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
