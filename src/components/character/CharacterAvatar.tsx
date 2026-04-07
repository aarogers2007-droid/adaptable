"use client";

interface CharacterAvatarProps {
  name: string;
  domainColor: string;
  imageUrl?: string | null;
  size?: number;
  showName?: boolean;
}

export default function CharacterAvatar(_props: CharacterAvatarProps) {
  // Character system disabled until characters are designed.
  // Component preserved for re-enable. See lib/character-system.ts.
  return null;
}
