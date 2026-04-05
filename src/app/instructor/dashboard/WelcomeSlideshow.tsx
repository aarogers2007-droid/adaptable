"use client";

import { useState, useEffect } from "react";

const SLIDES = [
  {
    step: 1,
    title: "Students discover their Ikigai",
    description:
      "Each student completes an interactive Ikigai exercise to find the intersection of what they love, what they're good at, what the world needs, and what can earn money.",
    icon: "🎯",
  },
  {
    step: 2,
    title: "8 conversational AI lessons",
    description:
      "Every lesson is personalized to the student's actual business idea. AI-guided conversations help them build a real plan — not a classroom exercise.",
    icon: "💬",
  },
  {
    step: 3,
    title: "You get live visibility",
    description:
      "See every student's progress, business ideas, and learning journey in real time. No waiting for assignments to be turned in.",
    icon: "👁️",
  },
  {
    step: 4,
    title: "Alerts surface what matters",
    description:
      "Get notified when students are stuck, inactive, or need support. Focus your attention where it has the most impact.",
    icon: "🔔",
  },
];

const STORAGE_KEY = "adaptable_instructor_welcomed";

export default function WelcomeSlideshow() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const welcomed = localStorage.getItem(STORAGE_KEY);
    if (!welcomed) {
      setIsOpen(true);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
    setCurrentSlide(0);
  }

  function handleNext() {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((s) => s + 1);
    } else {
      handleClose();
    }
  }

  function handlePrev() {
    if (currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
    }
  }

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8 shadow-lg">
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === currentSlide
                  ? "bg-[var(--primary)]"
                  : "bg-[var(--bg-muted)]"
              }`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="text-center">
          <div className="mb-4 text-4xl">{slide.icon}</div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Step {slide.step} of {SLIDES.length}
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
            {slide.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {slide.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:invisible"
          >
            Back
          </button>
          <button
            onClick={handleClose}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] transition-colors"
          >
            {currentSlide === SLIDES.length - 1 ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
