import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitAdmin - Gym Management Dashboard",
  description: "Modern gym administration dashboard for managing fitness ecosystems with real-time insights.",
  keywords: ["gym", "fitness", "dashboard", "management", "admin"],
  authors: [{ name: "FitAdmin Team" }],
  openGraph: {
    title: "FitAdmin Dashboard",
    description: "Modern gym administration dashboard",
    url: "https://fitadmin.com",
    siteName: "FitAdmin",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitAdmin Dashboard",
    description: "Modern gym administration dashboard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
