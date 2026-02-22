"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { IRefPhaserGame } from "@/components/game/PhaserGame";

const PhaserGame = dynamic(() => import("@/components/game/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[var(--background)]">
      <p className="text-[var(--accent)] font-mono">Loading game engine...</p>
    </div>
  ),
});

export default function PlayPage() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [, setCurrentScene] = useState<Phaser.Scene | null>(null);

  const handleSceneChange = (scene: Phaser.Scene) => {
    setCurrentScene(scene);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[var(--background)]">
      <PhaserGame ref={phaserRef} currentActiveScene={handleSceneChange} />
    </div>
  );
}
