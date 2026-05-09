"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { type BrandingConfig, DEFAULT_BRANDING } from "@/lib/branding";

const BrandingContext = createContext<BrandingConfig>(DEFAULT_BRANDING);

export function useBranding(): BrandingConfig {
  return useContext(BrandingContext);
}

interface BrandingProviderProps {
  branding: BrandingConfig;
  children: ReactNode;
}

export default function BrandingProvider({ branding, children }: BrandingProviderProps) {
  // Inject CSS custom properties for brand colors
  useEffect(() => {
    const root = document.documentElement;
    if (branding.primary_color) {
      root.style.setProperty("--brand-primary", branding.primary_color);
    }
    if (branding.secondary_color) {
      root.style.setProperty("--brand-secondary", branding.secondary_color);
    }

    // Update page title
    if (branding.platform_name && branding.platform_name !== "Adaptable") {
      document.title = document.title.replace(/Adaptable/g, branding.platform_name);
    }

    // Update favicon if provided
    if (branding.favicon_url) {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (link) {
        link.href = branding.favicon_url;
      } else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = branding.favicon_url;
        document.head.appendChild(newLink);
      }
    }
  }, [branding]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}
