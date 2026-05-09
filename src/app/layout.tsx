import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, EB_Garamond, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { headers } from "next/headers";
import "./globals.css";
import SplashScreen from "@/components/ui/SplashScreen";
import SupportBubble from "@/components/ui/SupportBubble";
import BrandingProvider from "@/components/BrandingProvider";
import { getTenantBranding } from "@/lib/get-tenant-branding";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-diploma",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adaptable — Design Your Venture",
  description:
    "An AI-native venture studio where students design, plan, and prepare to launch real businesses.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const hostname = headersList.get("host");
  const branding = await getTenantBranding(hostname);

  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${jetbrainsMono.variable} ${ebGaramond.variable} ${playfairDisplay.variable}`}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-[family-name:var(--font-body)]">
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=location.pathname;if(p==="/demo"||p==="/for-schools"||p==="/venture"||p==="/"||p==="/invention"||p==="/onboarding"||p.startsWith("/onboarding"))return;var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}}())` }} />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-lg focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-white focus:text-sm">
          Skip to content
        </a>
        <BrandingProvider branding={branding}>
          <SplashScreen>
            {children}
          </SplashScreen>
        </BrandingProvider>
        <SupportBubble />
        <Analytics />
      </body>
    </html>
  );
}
