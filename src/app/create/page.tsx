"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { themes, getThemeById } from "@/data/themes";
import { checkBlockedWords } from "@/data/blockedWords";
import { useGameStore } from "@/stores/gameStore";
import type { Theme, ThemeBlank } from "@/types/madlibs";

export default function CreatePage() {
  const router = useRouter();
  const setFormData = useGameStore((s) => s.setFormData);
  const setGameStatus = useGameStore((s) => s.setGameStatus);

  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const handleThemeSelect = (themeId: string) => {
    const theme = getThemeById(themeId);
    if (theme) {
      setSelectedTheme(theme);
      setEntries({});
      setErrors({});
      setModerationError(null);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setEntries((prev) => ({ ...prev, [id]: value }));

    // Clear error on change
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validateAndSubmit = async () => {
    if (!selectedTheme) return;

    const newErrors: Record<string, string> = {};

    // Validate all fields
    for (const blank of selectedTheme.blanks) {
      const value = (entries[blank.id] || "").trim();

      if (!value) {
        newErrors[blank.id] = "This field is required";
        continue;
      }

      if (value.length > blank.maxLength) {
        newErrors[blank.id] = `Max ${blank.maxLength} characters`;
        continue;
      }

      // Client-side blocklist
      const blockCheck = checkBlockedWords(value);
      if (blockCheck.blocked) {
        newErrors[blank.id] = blockCheck.reason || "Not allowed";
        continue;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setModerationError(null);

    try {
      // Server-side moderation
      const modRes = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      const modData = await modRes.json();

      if (modData.flagged) {
        setModerationError(
          "Some of your entries were flagged. Please revise and try again."
        );
        if (modData.flaggedFields) {
          const flaggedErrors: Record<string, string> = {};
          for (const field of modData.flaggedFields) {
            flaggedErrors[field] = "This entry was flagged — try something else";
          }
          setErrors(flaggedErrors);
        }
        setIsSubmitting(false);
        return;
      }

      // Save to store and navigate to loading
      setFormData(selectedTheme.id, entries);
      setGameStatus("generating");
      router.push("/loading");
    } catch {
      setModerationError("Failed to validate. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Theme selection screen
  if (!selectedTheme) {
    return (
      <main className="min-h-screen p-6 bg-[var(--background)]">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[var(--accent)]">
              Choose Your Theme
            </h1>
            <p className="text-sm opacity-60">
              Pick a world for your adventure
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className="p-6 rounded-xl bg-[var(--surface)] border-2 border-transparent hover:border-[var(--accent)] transition-all text-left space-y-2 active:scale-95 transform"
              >
                <div className="text-4xl">{theme.icon}</div>
                <div className="font-bold text-[var(--foreground)]">
                  {theme.name}
                </div>
                <div className="text-xs opacity-50">{theme.description}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Mad Libs form
  return (
    <main className="min-h-screen p-6 bg-[var(--background)] overflow-y-auto">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedTheme(null)}
            className="text-sm text-[var(--accent)] hover:opacity-80"
          >
            ← Back
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {selectedTheme.icon} {selectedTheme.name}
            </h1>
          </div>
          <div className="w-12" />
        </div>

        <p className="text-sm text-center opacity-60">
          Fill in each blank to create your unique adventure!
        </p>

        {moderationError && (
          <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm text-center">
            {moderationError}
          </div>
        )}

        <div className="space-y-4">
          {selectedTheme.blanks.map((blank: ThemeBlank) => (
            <div key={blank.id} className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                {blank.label}
                <span className="text-xs opacity-40">({blank.partOfSpeech})</span>
              </label>
              <input
                type="text"
                placeholder={blank.placeholder}
                maxLength={blank.maxLength}
                value={entries[blank.id] || ""}
                onChange={(e) => handleInputChange(blank.id, e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-[var(--surface)] border-2 text-[var(--foreground)] placeholder:opacity-30 focus:outline-none focus:border-[var(--accent)] transition-colors ${
                  errors[blank.id]
                    ? "border-red-500"
                    : "border-[var(--surface-light)]"
                }`}
              />
              {errors[blank.id] && (
                <p className="text-xs text-red-400">{errors[blank.id]}</p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={validateAndSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-lg bg-[var(--accent)] text-[var(--background)] font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95 transform"
        >
          {isSubmitting ? "Checking..." : "Generate My Game!"}
        </button>
      </div>
    </main>
  );
}
