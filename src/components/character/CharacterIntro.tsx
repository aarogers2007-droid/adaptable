"use client";

import { useEffect } from "react";

interface CharacterIntroProps {
  name: string;
  creature: string;
  domain: string;
  domainColor: string;
  openingLine: string;
  imageUrl?: string | null;
  onContinue: () => void;
}

export default function CharacterIntro({ onContinue }: CharacterIntroProps) {
  // Character system disabled until characters are designed.
  // Auto-dismiss so the chat continues without showing the intro modal.
  useEffect(() => {
    onContinue();
  }, [onContinue]);
  return null;
}
