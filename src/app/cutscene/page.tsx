"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";

export default function CutscenePage() {
  const router = useRouter();
  const story = useGameStore((s) => s.story);
  const assets = useGameStore((s) => s.assets);
  const setGameStatus = useGameStore((s) => s.setGameStatus);

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    if (!story) {
      router.push("/create");
      return;
    }
  }, [story, router]);

  // Typewriter effect for chapter 1 only
  useEffect(() => {
    if (!story) return;

    const chapter = story.chapters[0];
    if (!chapter) return;

    const fullText = chapter.narrative;
    let charIndex = 0;
    setDisplayedText("");
    setIsTyping(true);
    setShowContinue(false);

    const interval = setInterval(() => {
      charIndex++;
      setDisplayedText(fullText.slice(0, charIndex));

      if (charIndex >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
        setShowContinue(true);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [story]);

  if (!story) return null;

  const chapter = story.chapters[0];

  // Chapter illustration key
  const illustrationKey = "chapter-illustration-0";
  const illustrationBase64 = assets?.[illustrationKey] ?? null;

  const handleContinue = () => {
    if (isTyping) {
      // Skip typewriter — show full text
      setDisplayedText(chapter.narrative);
      setIsTyping(false);
      setShowContinue(true);
      return;
    }

    // Start the game (chapter 2 and 3 will show in-game via LevelTransitionScene)
    setGameStatus("playing");
    router.push("/play");
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)] cursor-pointer"
      onClick={handleContinue}
    >
      <div className="max-w-lg w-full space-y-6">
        {/* Story title */}
        <h1 className="text-3xl font-bold text-[var(--accent)] text-center">
          {story.title}
        </h1>

        {/* Chapter illustration */}
        {illustrationBase64 && (
          <div className="rounded-xl overflow-hidden border border-[var(--surface-light)]">
            <img
              src={`data:image/png;base64,${illustrationBase64}`}
              alt={chapter.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Chapter header */}
        <div className="text-center space-y-1">
          <p className="text-xs text-[var(--accent)] opacity-60 uppercase tracking-widest">
            Chapter {chapter.chapterNumber}
          </p>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {chapter.title}
          </h2>
        </div>

        {/* Narrative text */}
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-light)]">
          <p className="text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-[var(--accent)] ml-0.5 animate-pulse" />
            )}
          </p>
        </div>

        {/* Objective */}
        {showContinue && (
          <div className="text-center space-y-1 animate-fade-in">
            <p className="text-xs text-[var(--accent-secondary)] uppercase tracking-wider">
              Objective
            </p>
            <p className="text-sm text-[var(--foreground)] opacity-80">
              {chapter.objective}
            </p>
          </div>
        )}

        {/* Continue prompt */}
        {showContinue && (
          <p className="text-center text-sm text-[var(--foreground)] opacity-40 animate-pulse">
            Tap to start playing!
          </p>
        )}
      </div>
    </main>
  );
}
