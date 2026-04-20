"use client";

import { useEffect } from "react";

/**
 * Forces light mode on public pages. Removes the dark class on mount,
 * restores the user's preference on unmount (when navigating away).
 */
export default function ForceLightMode() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    return () => {
      if (localStorage.getItem("theme") === "dark") {
        document.documentElement.classList.add("dark");
      }
    };
  }, []);

  return null;
}
