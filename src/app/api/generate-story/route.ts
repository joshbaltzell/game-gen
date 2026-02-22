import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { buildStoryPrompt } from "@/lib/storyGenerator";
import { getThemeById } from "@/data/themes";
import type { StoryData } from "@/types/story";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { themeId, entries } = await request.json();

    if (!themeId || !entries) {
      return NextResponse.json(
        { error: "Missing themeId or entries" },
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

    const openai = getOpenAIClient();
    const messages = buildStoryPrompt(theme, entries);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const story: StoryData = JSON.parse(content);

    // Validate structure
    if (
      !story.title ||
      !story.chapters ||
      !Array.isArray(story.chapters) ||
      story.chapters.length !== theme.levelCount
    ) {
      return NextResponse.json(
        { error: "Invalid story structure" },
        { status: 500 }
      );
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Story generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
