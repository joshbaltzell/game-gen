import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { checkBlockedWords } from "@/data/blockedWords";

export async function POST(request: Request) {
  try {
    const { entries } = await request.json();

    if (!entries || typeof entries !== "object") {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // First pass: local blocklist (instant)
    const flaggedFields: string[] = [];
    for (const [key, value] of Object.entries(entries)) {
      if (typeof value === "string") {
        const check = checkBlockedWords(value);
        if (check.blocked) {
          flaggedFields.push(key);
        }
      }
    }

    if (flaggedFields.length > 0) {
      return NextResponse.json({
        flagged: true,
        flaggedFields,
        reason: "Content blocked by local filter",
      });
    }

    // Second pass: OpenAI Moderation API (free)
    try {
      const openai = getOpenAIClient();
      const allText = Object.values(entries).join(" | ");

      const moderation = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: allText,
      });

      const result = moderation.results[0];
      if (result.flagged) {
        // Find which categories were flagged
        const flaggedCategories = Object.entries(result.categories)
          .filter(([, flagged]) => flagged)
          .map(([category]) => category);

        return NextResponse.json({
          flagged: true,
          flaggedFields: [], // OpenAI doesn't give per-field results
          reason: `Content flagged: ${flaggedCategories.join(", ")}`,
        });
      }
    } catch {
      // If moderation API fails, still allow through
      // (the story generation will also have safety filters)
      console.warn("Moderation API call failed, proceeding anyway");
    }

    return NextResponse.json({ flagged: false });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
