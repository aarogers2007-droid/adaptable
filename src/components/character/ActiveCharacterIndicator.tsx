"use client";

import CharacterAvatar from "./CharacterAvatar";

interface ActiveCharacterIndicatorProps {
  name: string;
  creature: string;
  domain: string;
  domainColor: string;
  imageUrl?: string | null;
}

export default function ActiveCharacterIndicator({
  name,
  creature,
  domain,
  domainColor,
  imageUrl,
}: ActiveCharacterIndicatorProps) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
      style={{ backgroundColor: `${domainColor}1A` }}
    >
      <CharacterAvatar
        name={name}
        domainColor={domainColor}
        imageUrl={imageUrl}
        size={24}
      />
      <span className="text-xs font-medium text-[var(--text-secondary)]">
        {name} &middot; {domain} Guide
      </span>
    </div>
  );
}
