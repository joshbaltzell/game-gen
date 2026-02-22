"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import type { AssetGenerationProgress, PipelineStatus } from "@/types/assets";

const STEPS = [
  { key: "story" as const, label: "Writing your story", icon: "📝" },
  { key: "heroSprite" as const, label: "Drawing your hero", icon: "🦸" },
  { key: "enemySprites" as const, label: "Creating enemies", icon: "👾" },
  { key: "backgrounds" as const, label: "Painting your world", icon: "🎨" },
  { key: "tileset" as const, label: "Building platforms", icon: "🧱" },
  { key: "processing" as const, label: "Assembling your game", icon: "⚙️" },
];

export default function LoadingPage() {
  const router = useRouter();
  const themeId = useGameStore((s) => s.themeId);
  const entries = useGameStore((s) => s.entries);
  const setStory = useGameStore((s) => s.setStory);
  const setAssets = useGameStore((s) => s.setAssets);
  const setGameStatus = useGameStore((s) => s.setGameStatus);

  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [progress, setProgress] = useState<AssetGenerationProgress>({
    story: "pending",
    heroSprite: "pending",
    enemySprites: "pending",
    backgrounds: "pending",
    tileset: "pending",
    processing: "pending",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!themeId || Object.keys(entries).length === 0) {
      router.push("/create");
      return;
    }

    if (status !== "idle") return;
    setStatus("generating");

    (async () => {
      try {
        // Step 1: Generate story
        setProgress((p) => ({ ...p, story: "loading" }));
        const storyRes = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themeId, entries }),
        });

        if (!storyRes.ok) throw new Error("Story generation failed");
        const { story } = await storyRes.json();
        setStory(story);
        setProgress((p) => ({ ...p, story: "complete" }));

        // Step 2: Generate images
        setProgress((p) => ({
          ...p,
          heroSprite: "loading",
          enemySprites: "loading",
          backgrounds: "loading",
          tileset: "loading",
        }));

        const imageRes = await fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themeId, story, entries }),
        });

        if (!imageRes.ok) throw new Error("Image generation failed");
        const assets = await imageRes.json();
        setAssets(assets);

        setProgress((p) => ({
          ...p,
          heroSprite: "complete",
          enemySprites: "complete",
          backgrounds: "complete",
          tileset: "complete",
        }));

        // Step 3: Processing
        setProgress((p) => ({ ...p, processing: "loading" }));
        // Brief delay to show the step
        await new Promise((r) => setTimeout(r, 500));
        setProgress((p) => ({ ...p, processing: "complete" }));

        setStatus("ready");
        setGameStatus("cutscene");

        // Navigate to cutscene
        await new Promise((r) => setTimeout(r, 800));
        router.push("/cutscene");
      } catch (err) {
        console.error("Generation pipeline error:", err);
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        setStatus("error");
      }
    })();
  }, [themeId, entries, status, router, setStory, setAssets, setGameStatus]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--accent)]">
            Creating Your Game
          </h1>
          <p className="text-sm opacity-60">
            AI is building your unique adventure...
          </p>
        </div>

        <div className="space-y-3">
          {STEPS.map((step) => {
            const stepStatus = progress[step.key];
            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  stepStatus === "loading"
                    ? "bg-[var(--surface-light)]"
                    : stepStatus === "complete"
                    ? "bg-[var(--surface)] opacity-70"
                    : "bg-[var(--surface)] opacity-40"
                }`}
              >
                <div className="text-xl w-8 text-center">
                  {stepStatus === "complete"
                    ? "✅"
                    : stepStatus === "loading"
                    ? "⏳"
                    : stepStatus === "error"
                    ? "❌"
                    : step.icon}
                </div>
                <div className="flex-1 text-sm font-medium">
                  {step.label}
                  {stepStatus === "loading" && (
                    <span className="animate-pulse">...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="text-center space-y-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => {
                setStatus("idle");
                setError(null);
                setProgress({
                  story: "pending",
                  heroSprite: "pending",
                  enemySprites: "pending",
                  backgrounds: "pending",
                  tileset: "pending",
                  processing: "pending",
                });
              }}
              className="px-6 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {status === "ready" && (
          <p className="text-center text-[var(--accent)] animate-pulse">
            Ready! Loading your adventure...
          </p>
        )}
      </div>
    </main>
  );
}
