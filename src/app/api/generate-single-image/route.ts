import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { prompt, size, quality, background } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: size || "1024x1024",
      quality: quality || "medium",
      background: background || "transparent",
    });

    const imageData = response.data?.[0];
    if (!imageData || !imageData.b64_json) {
      return NextResponse.json(
        { error: "No image data returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: imageData.b64_json });
  } catch (error) {
    console.error("Single image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
