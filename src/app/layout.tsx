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
  title: {
    default: "Lyzr HR Candidate Sourcing Agent",
    template: "%s | Lyzr HR Sourcing"
  },
  description: "AI-powered candidate sourcing and recruitment platform. Find the perfect candidates for your job openings using advanced AI agents that search LinkedIn and match profiles to your requirements.",
  keywords: [
    "HR",
    "recruitment",
    "candidate sourcing",
    "AI recruitment",
    "LinkedIn search",
    "talent acquisition",
    "job matching",
    "AI agents",
    "Lyzr",
    "hiring"
  ],
  authors: [{ name: "Lyzr AI" }],
  creator: "Lyzr AI",
  publisher: "Lyzr AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Lyzr HR Candidate Sourcing Agent',
    description: 'AI-powered candidate sourcing and recruitment platform. Find the perfect candidates for your job openings using advanced AI agents.',
    siteName: 'Lyzr HR Sourcing',
    images: [
      {
        url: '/lyzr.png',
        width: 1200,
        height: 630,
        alt: 'Lyzr HR Candidate Sourcing Agent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lyzr HR Candidate Sourcing Agent',
    description: 'AI-powered candidate sourcing and recruitment platform. Find the perfect candidates for your job openings using advanced AI agents.',
    images: ['/lyzr.png'],
    creator: '@lyzrai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/lyzr.png" type="image/png" />
        <link rel="apple-touch-icon" href="/lyzr.png" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lyzr HR Sourcing" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Lyzr HR Candidate Sourcing Agent",
              "description": "AI-powered candidate sourcing and recruitment platform. Find the perfect candidates for your job openings using advanced AI agents.",
              "url": process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "Lyzr AI",
                "url": "https://lyzr.ai"
              },
              "featureList": [
                "AI-powered candidate search",
                "LinkedIn profile analysis",
                "Job description matching",
                "Real-time candidate sourcing",
                "Profile saving and management"
              ]
            })
          }}
        />
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
