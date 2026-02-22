"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  buildChapterIllustrationPrompt,
  buildPowerUpPrompt,
} from "@/lib/imageGenerator";
import type { StoryData } from "@/types/story";
import type { PipelineStatus, StepStatus } from "@/types/assets";
import type { Theme } from "@/types/madlibs";

interface DebugEntry {
  timestamp: number;
  step: string;
  message: string;
  level: "info" | "success" | "error";
  duration?: number;
}

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
  errorMessage?: string;
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
    {
      id: "power-up",
      label: "Creating power star",
      icon: "⭐",
      phaserKey: "power-up",
      status: "pending",
      preview: null,
      prompt: buildPowerUpPrompt(theme),
      size: "1024x1024",
      quality: "medium",
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
      size: "1536x1024" as string,
      quality: "low" as string,
      background: "opaque" as string,
    })),
    ...story.chapters.map((chapter, i) => ({
      id: `chapter-illustration-${i}`,
      label: `Chapter ${i + 1} illustration`,
      icon: "🖼️",
      phaserKey: `chapter-illustration-${i}`,
      status: "pending" as StepStatus,
      preview: null,
      prompt: buildChapterIllustrationPrompt(theme, chapter),
      size: "1536x1024" as string,
      quality: "medium" as string,
      background: "opaque" as string,
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
): Promise<{ image: string; error?: undefined } | { image?: undefined; error: string }> {
  try {
    const res = await fetch("/api/generate-single-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, size, quality, background }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || `HTTP ${res.status}` };
    }
    return { image: data.image };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
}

export default function LoadingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--accent)] font-mono">Loading...</p>
      </main>
    }>
      <LoadingPageInner />
    </Suspense>
  );
}

function LoadingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDebug = searchParams.get("debug") === "true";

  const themeId = useGameStore((s) => s.themeId);
  const entries = useGameStore((s) => s.entries);
  const setStory = useGameStore((s) => s.setStory);
  const setAssets = useGameStore((s) => s.setAssets);
  const setGameStatus = useGameStore((s) => s.setGameStatus);

  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [storyStatus, setStoryStatus] = useState<StepStatus>("pending");
  const [imageSteps, setImageSteps] = useState<GenerationStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const [debugVisible, setDebugVisible] = useState(showDebug);

  const addDebug = useCallback((step: string, message: string, level: DebugEntry["level"], duration?: number) => {
    setDebugLog((prev) => [...prev, { timestamp: Date.now(), step, message, level, duration }]);
  }, []);

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
        addDebug("story", "Generating story with GPT...", "info");
        const storyStart = Date.now();

        const storyRes = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themeId, entries }),
        });

        if (!storyRes.ok) {
          const errData = await storyRes.json().catch(() => ({}));
          throw new Error(errData.error || "Story generation failed");
        }

        const { story } = (await storyRes.json()) as { story: StoryData };
        setStory(story);
        setStoryStatus("complete");
        addDebug("story", `Story generated: "${story.title}" (${story.chapters.length} chapters)`, "success", Date.now() - storyStart);

        // Step 2: Build image generation steps from story
        const steps = buildImageSteps(theme, story, entries);
        setImageSteps(steps);
        addDebug("pipeline", `${steps.length} images queued for generation`, "info");

        // Step 3: Generate images progressively in batches of 3
        const assets: Record<string, string> = {};

        for (let i = 0; i < steps.length; i += 3) {
          const batch = steps.slice(i, i + 3);

          // Mark batch as loading
          for (const step of batch) {
            updateStep(step.id, { status: "loading" });
            addDebug(step.id, `Generating ${step.label}...`, "info");
          }

          // Generate batch in parallel
          const startTimes = batch.map(() => Date.now());
          const results = await Promise.allSettled(
            batch.map(async (step) => {
              const result = await generateSingleImage(
                step.prompt!,
                step.size!,
                step.quality!,
                step.background!
              );
              return { id: step.id, phaserKey: step.phaserKey, ...result };
            })
          );

          // Process results
          for (let j = 0; j < results.length; j++) {
            const result = results[j];
            const step = batch[j];
            const elapsed = Date.now() - startTimes[j];

            if (result.status === "fulfilled") {
              const val = result.value;
              if (val.image) {
                assets[val.phaserKey] = val.image;
                updateStep(val.id, { status: "complete", preview: val.image });
                addDebug(val.id, `${step.label} complete`, "success", elapsed);
              } else {
                updateStep(val.id, { status: "error", errorMessage: val.error });
                addDebug(val.id, `Failed: ${val.error}`, "error", elapsed);
              }
            } else {
              const reason = result.reason instanceof Error ? result.reason.message : "Unknown error";
              updateStep(step.id, { status: "error", errorMessage: reason });
              addDebug(step.id, `Failed: ${reason}`, "error", elapsed);
            }
          }
        }

        // Step 4: Store assets and navigate
        const successCount = Object.keys(assets).length;
        addDebug("pipeline", `Pipeline complete: ${successCount}/${steps.length} images generated`, successCount === steps.length ? "success" : "info");

        setAssets(assets);
        setStatus("ready");
        setGameStatus("cutscene");

        await new Promise((r) => setTimeout(r, 800));
        router.push("/cutscene");
      } catch (err) {
        console.error("Generation pipeline error:", err);
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        addDebug("pipeline", `Pipeline error: ${msg}`, "error");
        setStatus("error");
      }
    })();
  }, [themeId, entries, status, router, setStory, setAssets, setGameStatus, updateStep, addDebug]);

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
            <div key={step.id}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  step.status === "loading"
                    ? "bg-[var(--surface-light)]"
                    : step.status === "complete"
                    ? "bg-[var(--surface)]"
                    : step.status === "error"
                    ? "bg-red-900/20"
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
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {step.label}
                    {step.status === "loading" && (
                      <span className="animate-pulse">...</span>
                    )}
                  </div>
                  {step.status === "error" && step.errorMessage && (
                    <p className="text-xs text-red-400 mt-1">{step.errorMessage}</p>
                  )}
                </div>
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
                setDebugLog([]);
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

        {/* Debug Log Panel */}
        <div className="border-t border-[var(--surface-light)] pt-3">
          <button
            onClick={() => setDebugVisible((v) => !v)}
            className="text-xs text-[var(--foreground)] opacity-40 hover:opacity-70 transition-opacity"
          >
            {debugVisible ? "▼ Hide Debug Log" : "▶ Show Debug Log"}
          </button>

          {debugVisible && debugLog.length > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-black/50 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
              {debugLog.map((entry, i) => (
                <div
                  key={i}
                  className={
                    entry.level === "error"
                      ? "text-red-400"
                      : entry.level === "success"
                      ? "text-green-400"
                      : "text-gray-400"
                  }
                >
                  <span className="opacity-50">
                    [{new Date(entry.timestamp).toLocaleTimeString()}]
                  </span>{" "}
                  <span className="opacity-70">[{entry.step}]</span>{" "}
                  {entry.message}
                  {entry.duration !== undefined && (
                    <span className="opacity-50"> ({(entry.duration / 1000).toFixed(1)}s)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
