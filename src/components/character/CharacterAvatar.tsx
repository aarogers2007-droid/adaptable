"use client";

interface CharacterAvatarProps {
  name: string;
  domainColor: string;
  imageUrl?: string | null;
  size?: number;
  showName?: boolean;
}

export default function CharacterAvatar({
  name,
  domainColor,
  imageUrl,
  size = 32,
  showName = false,
}: CharacterAvatarProps) {
  const fontSize = Math.round(size * 0.45);

  return (
    <div className="inline-flex items-center gap-2">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full font-bold text-white shrink-0"
          style={{
            width: size,
            height: size,
            backgroundColor: domainColor,
            fontSize,
          }}
        >
          {name.charAt(0)}
        </div>
      )}
      {showName && (
        <span className="text-xs text-[var(--text-secondary)] font-medium">
          {name}
        </span>
      )}
    </div>
  );
}
