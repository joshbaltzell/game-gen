"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { getThemeById } from "@/data/themes";
import {
  buildHeroIdlePrompt,
  buildHeroRunPrompt,
  buildVillainPrompt,
  buildEnemyPrompt,
  buildCollectiblePrompt,
  buildBackgroundPrompt,
  buildPlatformTilesetPrompt,
} from "@/lib/imageGenerator";
import type { StoryData } from "@/types/story";
import type { PipelineStatus, StepStatus } from "@/types/assets";
import type { Theme } from "@/types/madlibs";

interface GenerationStep {
  id: string;
  label: string;
  icon: string;
  phaserKey: string;
  status: StepStatus;
  preview: string | null;
  prompt?: string;
  size?: string;
  quality?: string;
  background?: string;
}

function buildImageSteps(
  theme: Theme,
  story: StoryData,
  entries: Record<string, string>
): GenerationStep[] {
  return [
    {
      id: "hero-idle",
      label: "Drawing your hero",
      icon: "🦸",
      phaserKey: "hero-idle",
      status: "pending",
      preview: null,
      prompt: buildHeroIdlePrompt(theme, story, entries),
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
    },
    {
      id: "hero-run",
      label: "Hero running pose",
      icon: "🏃",
      phaserKey: "hero-run",
      status: "pending",
      preview: null,
      prompt: buildHeroRunPrompt(theme, story, entries),
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
    },
    {
      id: "villain",
      label: "Creating the villain",
      icon: "😈",
      phaserKey: "villain",
      status: "pending",
      preview: null,
      prompt: buildVillainPrompt(theme, story, entries),
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
    },
    {
      id: "enemy-a",
      label: "Spawning enemies",
      icon: "👾",
      phaserKey: "enemy-a",
      status: "pending",
      preview: null,
      prompt: buildEnemyPrompt(theme, story.chapters[0]),
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
    },
    {
      id: "enemy-b",
      label: "More enemies",
      icon: "👹",
      phaserKey: "enemy-b",
      status: "pending",
      preview: null,
      prompt: buildEnemyPrompt(theme, story.chapters[1] || story.chapters[0]),
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
    },
    {
      id: "collectible",
      label: "Crafting collectibles",
      icon: "✨",
      phaserKey: "collectible",
      status: "pending",
      preview: null,
      prompt: buildCollectiblePrompt(theme, entries),
      size: "1024x1024",
      quality: "low",
      background: "transparent",
    },
    ...story.chapters.map((chapter, i) => ({
      id: `bg-level-${i}`,
      label: `Painting world ${i + 1}`,
      icon: "🎨",
      phaserKey: `bg-level-${i}`,
      status: "pending" as StepStatus,
      preview: null,
      prompt: buildBackgroundPrompt(theme, chapter),
      size: "1536x1024",
      quality: "low",
      background: "opaque",
    })),
    {
      id: "platform-tile-0",
      label: "Building platforms",
      icon: "🧱",
      phaserKey: "platform-tile-0",
      status: "pending",
      preview: null,
      prompt: buildPlatformTilesetPrompt(theme),
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
    },
  ];
}

async function generateSingleImage(
  prompt: string,
  size: string,
  quality: string,
  background: string
): Promise<string> {
  const res = await fetch("/api/generate-single-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, size, quality, background }),
  });
  if (!res.ok) throw new Error("Image generation failed");
  const data = await res.json();
  return data.image;
}

export default function LoadingPage() {
  const router = useRouter();
  const themeId = useGameStore((s) => s.themeId);
  const entries = useGameStore((s) => s.entries);
  const setStory = useGameStore((s) => s.setStory);
  const setAssets = useGameStore((s) => s.setAssets);
  const setGameStatus = useGameStore((s) => s.setGameStatus);

  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [storyStatus, setStoryStatus] = useState<StepStatus>("pending");
  const [imageSteps, setImageSteps] = useState<GenerationStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const updateStep = useCallback(
    (id: string, update: Partial<GenerationStep>) => {
      setImageSteps((prev) =>
        prev.map((step) => (step.id === id ? { ...step, ...update } : step))
      );
    },
    []
  );

  useEffect(() => {
    if (!themeId || Object.keys(entries).length === 0) {
      router.push("/create");
      return;
    }

    if (status !== "idle") return;
    setStatus("generating");

    const theme = getThemeById(themeId);
    if (!theme) return;

    (async () => {
      try {
        // Step 1: Generate story
        setStoryStatus("loading");
        const storyRes = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themeId, entries }),
        });

        if (!storyRes.ok) throw new Error("Story generation failed");
        const { story } = (await storyRes.json()) as { story: StoryData };
        setStory(story);
        setStoryStatus("complete");

        // Step 2: Build image generation steps from story
        const steps = buildImageSteps(theme, story, entries);
        setImageSteps(steps);

        // Step 3: Generate images progressively in batches of 3
        const assets: Record<string, string> = {};

        for (let i = 0; i < steps.length; i += 3) {
          const batch = steps.slice(i, i + 3);

          // Mark batch as loading
          for (const step of batch) {
            updateStep(step.id, { status: "loading" });
          }

          // Generate batch in parallel
          const results = await Promise.allSettled(
            batch.map(async (step) => {
              const base64 = await generateSingleImage(
                step.prompt!,
                step.size!,
                step.quality!,
                step.background!
              );
              return { id: step.id, phaserKey: step.phaserKey, base64 };
            })
          );

          // Process results
          for (const result of results) {
            if (result.status === "fulfilled") {
              const { id, phaserKey, base64 } = result.value;
              assets[phaserKey] = base64;
              updateStep(id, {
                status: "complete",
                preview: base64,
              });
            } else {
              const failedIndex = results.indexOf(result);
              const failedStep = batch[failedIndex];
              if (failedStep) {
                updateStep(failedStep.id, { status: "error" });
              }
            }
          }
        }

        // Step 4: Store assets and navigate
        setAssets(assets);
        setStatus("ready");
        setGameStatus("cutscene");

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
  }, [themeId, entries, status, router, setStory, setAssets, setGameStatus, updateStep]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)] overflow-y-auto">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--accent)]">
            Creating Your Game
          </h1>
          <p className="text-sm opacity-60">
            AI is building your unique adventure...
          </p>
        </div>

        {/* Story step */}
        <div
          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
            storyStatus === "loading"
              ? "bg-[var(--surface-light)]"
              : storyStatus === "complete"
              ? "bg-[var(--surface)] opacity-70"
              : "bg-[var(--surface)] opacity-40"
          }`}
        >
          <div className="text-xl w-8 text-center">
            {storyStatus === "complete"
              ? "✅"
              : storyStatus === "loading"
              ? "⏳"
              : "📝"}
          </div>
          <div className="flex-1 text-sm font-medium">
            Writing your story
            {storyStatus === "loading" && (
              <span className="animate-pulse">...</span>
            )}
          </div>
        </div>

        {/* Image steps with previews */}
        <div className="space-y-3">
          {imageSteps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                step.status === "loading"
                  ? "bg-[var(--surface-light)]"
                  : step.status === "complete"
                  ? "bg-[var(--surface)]"
                  : "bg-[var(--surface)] opacity-40"
              }`}
            >
              {/* Preview thumbnail or icon */}
              <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden flex items-center justify-center bg-[var(--background)]">
                {step.preview ? (
                  <img
                    src={`data:image/png;base64,${step.preview}`}
                    alt={step.label}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xl">
                    {step.status === "complete"
                      ? "✅"
                      : step.status === "loading"
                      ? "⏳"
                      : step.status === "error"
                      ? "❌"
                      : step.icon}
                  </span>
                )}
              </div>
              <div className="flex-1 text-sm font-medium">
                {step.label}
                {step.status === "loading" && (
                  <span className="animate-pulse">...</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-center space-y-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => {
                setStatus("idle");
                setError(null);
                setStoryStatus("pending");
                setImageSteps([]);
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
