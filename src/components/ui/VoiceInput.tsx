"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

type VoiceState = "idle" | "listening" | "processing";

/**
 * Voice input using the browser's Web Speech API (SpeechRecognition).
 * Free, no API key, works on Chrome/Chromebooks.
 * Falls back to hidden if browser doesn't support it.
 */
export default function VoiceInput({
  onTranscription,
  disabled = false,
  className = "",
}: VoiceInputProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [showHint, setShowHint] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Show voice hint on first visit
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("voice-hint-seen")) {
      const timer = setTimeout(() => setShowHint(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Check browser support
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = ""; // Auto-detect language

    let finalTranscript = "";

    recognition.onstart = () => {
      setState("listening");
      setTranscript("");
      finalTranscript = "";
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setSupported(false);
      }
      setState("idle");
      setTranscript("");
    };

    recognition.onend = () => {
      const text = finalTranscript.trim();
      if (text) {
        onTranscription(text);
      }
      setState("idle");
      setTranscript("");
      recognitionRef.current = null;
    };

    recognition.start();
  }, [onTranscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    if (state === "listening") {
      stopListening();
    } else if (state === "idle") {
      if (showHint) {
        setShowHint(false);
        localStorage.setItem("voice-hint-seen", "true");
      }
      startListening();
    }
  }, [state, stopListening, startListening, showHint]);

  if (!supported) return null;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showHint && state === "idle" && (
        <span
          className="text-xs text-[var(--primary)] font-medium animate-pulse cursor-pointer"
          onClick={() => { setShowHint(false); localStorage.setItem("voice-hint-seen", "true"); }}
        >
          Tap to speak
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={state === "listening" ? "Stop listening" : "Start voice input"}
        className="relative flex items-center justify-center rounded-full transition-colors"
        style={{
          width: 40,
          height: 40,
          minWidth: 40,
          minHeight: 40,
          background: state === "listening" ? "var(--error)" : disabled ? "var(--bg-muted)" : "var(--bg-subtle)",
          color: state === "listening" ? "#FFFFFF" : disabled ? "var(--text-muted)" : "var(--text-secondary)",
          border: "1px solid var(--border)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {/* Microphone icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="1" width="6" height="12" rx="3" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>

        {/* Pulsing recording indicator */}
        {state === "listening" && (
          <span
            className="absolute -top-0.5 -right-0.5 block rounded-full"
            style={{
              width: 10,
              height: 10,
              background: "#FFFFFF",
              animation: "voice-pulse 1.2s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Live transcript preview */}
      {state === "listening" && (
        <span
          className="text-sm font-medium select-none"
          style={{ color: "var(--error)", fontFamily: "var(--font-display)" }}
        >
          {transcript ? transcript.slice(-40) + (transcript.length > 40 ? "" : "") : "Listening..."}
        </span>
      )}

      <style>{`
        @keyframes voice-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
