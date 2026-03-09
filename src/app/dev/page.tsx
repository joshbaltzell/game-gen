"use client";

import { useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { IRefPhaserGame } from "@/components/game/PhaserGame";

// Set dev mode flag BEFORE Phaser loads — PreloadScene reads this
if (typeof window !== "undefined") {
  (window as Record<string, unknown>).__DEV_MODE__ = true;
}

const PhaserGame = dynamic(() => import("@/components/game/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[var(--background)]">
      <p className="text-[var(--accent)] font-mono">Loading game engine...</p>
    </div>
  ),
});

/**
 * Dev test page — launches the game immediately with placeholder textures.
 * No AI generation, no story data. Just raw gameplay for testing.
 * Visit /dev to use.
 */
export default function DevPage() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  const handleSceneChange = useCallback(() => {
    // No-op — game auto-starts via __DEV_MODE__ flag in PreloadScene
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[var(--background)]">
      <div className="absolute top-2 left-2 z-10 bg-black/70 text-white font-mono text-xs px-2 py-1 rounded">
        DEV MODE — Placeholder textures only
      </div>
      <PhaserGame ref={phaserRef} currentActiveScene={handleSceneChange} />
    </div>
  );
}
