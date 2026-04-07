"use client";

interface HandoffPromptProps {
  fromName: string;
  toName: string;
  toCreature: string;
  toDomain: string;
  toDomainColor: string;
  toImageUrl?: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

export default function HandoffPrompt(_props: HandoffPromptProps) {
  // Character system disabled until characters are designed.
  return null;
}
