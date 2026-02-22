"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { StartGame } from "@/game/main";
import { EventBus } from "@/game/EventBus";

export interface IRefPhaserGame {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
}

interface PhaserGameProps {
  currentActiveScene?: (scene: Phaser.Scene) => void;
}

const PhaserGame = forwardRef<IRefPhaserGame, PhaserGameProps>(
  function PhaserGame({ currentActiveScene }, ref) {
    const game = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      if (game.current === null && containerRef.current) {
        game.current = StartGame(containerRef.current.id);

        if (typeof ref === "function") {
          ref({ game: game.current, scene: null });
        } else if (ref) {
          ref.current = { game: game.current, scene: null };
        }
      }

      return () => {
        if (game.current) {
          game.current.destroy(true);
          game.current = null;
        }
      };
    }, [ref]);

    useEffect(() => {
      const onSceneReady = (scene: Phaser.Scene) => {
        if (currentActiveScene) {
          currentActiveScene(scene);
        }
        if (typeof ref === "function") {
          ref({ game: game.current, scene });
        } else if (ref) {
          ref.current = { game: game.current, scene };
        }
      };

      EventBus.on("current-scene-ready", onSceneReady);

      return () => {
        EventBus.removeListener("current-scene-ready", onSceneReady);
      };
    }, [currentActiveScene, ref]);

    return (
      <div
        id="game-container"
        ref={containerRef}
        className="w-full h-full"
      />
    );
  }
);

export default PhaserGame;
