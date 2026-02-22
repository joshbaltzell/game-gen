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
        { error: "No image data returned from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: imageData.b64_json });
  } catch (error: unknown) {
    console.error("Single image generation error:", error);

    // Extract meaningful error details
    let errorMessage = "Failed to generate image";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Handle OpenAI-specific errors
    if (typeof error === "object" && error !== null) {
      const apiError = error as { status?: number; message?: string; error?: { message?: string } };
      if (apiError.status === 429) {
        errorMessage = "Rate limited — too many requests. Please wait a moment.";
        statusCode = 429;
      } else if (apiError.status === 400) {
        errorMessage = `Bad request: ${apiError.error?.message || apiError.message || "Invalid parameters"}`;
        statusCode = 400;
      } else if (apiError.status === 401) {
        errorMessage = "Authentication failed — check your API key";
        statusCode = 401;
      } else if (apiError.error?.message) {
        errorMessage = apiError.error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
