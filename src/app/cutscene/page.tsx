"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";

export default function CutscenePage() {
  const router = useRouter();
  const story = useGameStore((s) => s.story);
  const setGameStatus = useGameStore((s) => s.setGameStatus);

  const [currentChapter, setCurrentChapter] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    if (!story) {
      router.push("/create");
      return;
    }
  }, [story, router]);

  // Typewriter effect
  useEffect(() => {
    if (!story) return;

    const chapter = story.chapters[currentChapter];
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
  }, [story, currentChapter]);

  if (!story) return null;

  const chapter = story.chapters[currentChapter];
  const isLastChapter = currentChapter >= story.chapters.length - 1;

  const handleContinue = () => {
    if (isTyping) {
      // Skip typewriter — show full text
      setDisplayedText(chapter.narrative);
      setIsTyping(false);
      setShowContinue(true);
      return;
    }

    if (isLastChapter) {
      // Start the game
      setGameStatus("playing");
      router.push("/play");
    } else {
      setCurrentChapter((prev) => prev + 1);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)] cursor-pointer"
      onClick={handleContinue}
    >
      <div className="max-w-lg w-full space-y-6">
        {/* Story title */}
        {currentChapter === 0 && (
          <h1 className="text-3xl font-bold text-[var(--accent)] text-center">
            {story.title}
          </h1>
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
            {isLastChapter ? "Tap to start playing!" : "Tap to continue..."}
          </p>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {story.chapters.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === currentChapter
                  ? "bg-[var(--accent)]"
                  : i < currentChapter
                  ? "bg-[var(--accent)] opacity-40"
                  : "bg-[var(--surface-light)]"
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
