"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGameStore } from "@/stores/gameStore";
import { EventBus } from "@/game/EventBus";
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
  const [sceneReady, setSceneReady] = useState(false);
  const assets = useGameStore((s) => s.assets);
  const assetsSentRef = useRef(false);

  const handleSceneChange = useCallback((scene: Phaser.Scene) => {
    // PreloadScene is the one that listens for assets
    if (scene.scene.key === "PreloadScene") {
      setSceneReady(true);
    }
  }, []);

  // When PreloadScene is ready and we have assets, send them over
  useEffect(() => {
    if (sceneReady && assets && Object.keys(assets).length > 0 && !assetsSentRef.current) {
      assetsSentRef.current = true;
      // Small delay to ensure the EventBus listener in PreloadScene is registered
      const timer = setTimeout(() => {
        EventBus.emit("load-generated-assets", assets);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sceneReady, assets]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[var(--background)]">
      <PhaserGame ref={phaserRef} currentActiveScene={handleSceneChange} />
    </div>
  );
}
