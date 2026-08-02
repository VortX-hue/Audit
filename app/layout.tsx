import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Auditly — Shopify Store Audit Tool",
  description:
    "Paste a Shopify store URL and get an instant listing audit — SEO gaps, missing images, pricing errors, and inventory issues flagged in seconds.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Auditly — Shopify Store Audit Tool",
    description:
      "Instant Shopify listing audits: SEO, images, pricing, and inventory issues, scored and explained.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auditly — Shopify Store Audit Tool",
    description:
      "Instant Shopify listing audits: SEO, images, pricing, and inventory issues, scored and explained.",
  },
};

// Runs before React hydrates, so the correct theme is applied on the very
// first paint. Without this, the page would flash light mode for a beat
// before switching to dark for users who have dark mode saved.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body>
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}