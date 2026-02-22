import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { getThemeById } from "@/data/themes";
import type { StoryData } from "@/types/story";
import {
  buildHeroIdlePrompt,
  buildHeroRunPrompt,
  buildVillainPrompt,
  buildEnemyPrompt,
  buildCollectiblePrompt,
  buildBackgroundPrompt,
  buildPlatformTilesetPrompt,
} from "@/lib/imageGenerator";

export const maxDuration = 300;

async function generateImage(
  prompt: string,
  options: {
    size?: "1024x1024" | "1536x1024" | "1024x1536";
    quality?: "low" | "medium" | "high";
    background?: "transparent" | "opaque";
  } = {}
): Promise<string> {
  const openai = getOpenAIClient();

  const {
    size = "1024x1024",
    quality = "medium",
    background = "transparent",
  } = options;

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size,
      quality,
      background,
    });

    const imageData = response.data?.[0];
    if (!imageData || !imageData.b64_json) {
      throw new Error("No image data returned");
    }

    return imageData.b64_json;
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { themeId, story, entries } = (await request.json()) as {
      themeId: string;
      story: StoryData;
      entries: Record<string, string>;
    };

    if (!themeId || !story || !entries) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const theme = getThemeById(themeId);
    if (!theme) {
      return NextResponse.json(
        { error: "Invalid theme" },
        { status: 400 }
      );
    }

    // Generate all images in parallel batches
    // Batch 1: Character sprites (need transparency)
    const [heroIdle, heroRun, villain, enemyA, enemyB] = await Promise.all([
      generateImage(buildHeroIdlePrompt(theme, story, entries), {
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
      }).catch(() => ""),
      generateImage(buildHeroRunPrompt(theme, story, entries), {
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
      }).catch(() => ""),
      generateImage(buildVillainPrompt(theme, story, entries), {
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
      }).catch(() => ""),
      generateImage(buildEnemyPrompt(theme, story.chapters[0]), {
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
      }).catch(() => ""),
      generateImage(
        buildEnemyPrompt(
          theme,
          story.chapters[1] || story.chapters[0]
        ),
        {
          size: "1024x1024",
          quality: "medium",
          background: "transparent",
        }
      ).catch(() => ""),
    ]);

    // Batch 2: Backgrounds + collectible + tileset
    const backgroundPromises = story.chapters.map((chapter) =>
      generateImage(buildBackgroundPrompt(theme, chapter), {
        size: "1536x1024",
        quality: "low",
        background: "opaque",
      }).catch(() => "")
    );

    const [collectible, tileset, ...backgrounds] = await Promise.all([
      generateImage(buildCollectiblePrompt(theme, entries), {
        size: "1024x1024",
        quality: "low",
        background: "transparent",
      }).catch(() => ""),
      generateImage(buildPlatformTilesetPrompt(theme), {
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
      }).catch(() => ""),
      ...backgroundPromises,
    ]);

    return NextResponse.json({
      heroIdle,
      heroRun,
      villain,
      enemyA,
      enemyB,
      collectible,
      backgrounds,
      platformTiles: [tileset], // We'll handle slicing client-side for now
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate images" },
      { status: 500 }
    );
  }
}
