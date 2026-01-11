import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Reactive Ltd | Find Trusted Local Contractors",
  description: "Access the Reactive Network - Connect with verified local contractors for all your residential and commercial needs. Plumbing, electrical, carpentry, building, and more.",
  keywords: "contractors, tradespeople, plumbers, electricians, builders, home improvement, commercial maintenance, UK",
  authors: [{ name: "Reactive Ltd" }],
  openGraph: {
    title: "Reactive Ltd | Find Trusted Local Contractors",
    description: "Access the Reactive Network - Connect with verified local contractors for all your residential and commercial needs.",
    type: "website",
    locale: "en_GB",
    siteName: "Reactive Ltd",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reactive Ltd | Find Trusted Local Contractors",
    description: "Access the Reactive Network - Connect with verified local contractors.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.jpeg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
