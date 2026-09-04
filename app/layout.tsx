import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daddy's Home",
  description: "Premium menswear & accessories — Pudukkottai.",
  applicationName: "Daddy's Home POS",
  // iOS ignores the web manifest, so the standalone behaviour and home-screen
  // title have to be declared separately here.
  appleWebApp: {
    capable: true,
    title: "DH POS",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
  formatDetection: {
    // Stops iOS turning invoice numbers and totals into tappable phone links.
    telephone: false,
  },
  other: {
    // Next emits the standard `mobile-web-app-capable`; iOS versions before 17
    // only honour Apple's legacy name, so declare it too for older shop phones.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#C1272D",
  width: "device-width",
  initialScale: 1,
  // The POS has small numeric inputs; leave pinch-zoom available.
  maximumScale: 5,
  viewportFit: "cover",
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
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
