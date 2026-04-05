"use client";

import CharacterAvatar from "./CharacterAvatar";

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

export default function HandoffPrompt({
  fromName,
  toName,
  toCreature,
  toDomain,
  toDomainColor,
  toImageUrl,
  onAccept,
  onDecline,
}: HandoffPromptProps) {
  return (
    <div className="msg-enter flex justify-start">
      <div
        className="max-w-[85%] rounded-2xl border-2 px-5 py-4"
        style={{ borderColor: `${toDomainColor}66` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <CharacterAvatar
            name={toName}
            domainColor={toDomainColor}
            imageUrl={toImageUrl}
            size={36}
          />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {toName} the {toCreature}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{toDomain} Guide</p>
          </div>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {fromName} thinks {toName} the {toCreature} might be better for this
          question.
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onAccept}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: toDomainColor }}
          >
            Bring in {toName}
          </button>
          <button
            onClick={onDecline}
            className="rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--bg-muted)]"
            style={{
              borderColor: toDomainColor,
              color: toDomainColor,
            }}
          >
            Stay with {fromName}
          </button>
        </div>
      </div>
    </div>
  );
}
