import type { Theme } from "@/types/madlibs";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export function buildStoryPrompt(
  theme: Theme,
  entries: Record<string, string>
): ChatCompletionMessageParam[] {
  const entryList = theme.blanks
    .map((blank) => `${blank.label}: ${entries[blank.id] || blank.placeholder}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `You are a creative children's game story writer. You write short, exciting adventure stories in a family-friendly tone. Your stories MUST be structured as exactly ${theme.levelCount} chapters that map to platformer game levels.

You MUST respond with valid JSON in this exact format:
{
  "title": "string - a catchy story title",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "string - chapter title",
      "narrative": "string - 1-2 short paragraphs of story text shown as a cutscene",
      "levelDescription": "string - vivid description of the level environment for pixel art generation",
      "enemyDescription": "string - clear description of what enemies look like in this level",
      "objective": "string - what the player must do (collect items, reach the end, defeat boss)",
      "bossLevel": false
    }
  ],
  "epilogue": "string - victory text shown after the final level"
}

Rules:
- Chapter 1 is the introduction/easy level with a welcoming environment
- Chapter 2 introduces more challenge and a darker environment
- Chapter 3 is the boss/climax level where the hero faces the villain (bossLevel: true)
- ALL user-provided names and words MUST appear naturally in the narrative
- Keep each narrative under 120 words
- Level descriptions should be vivid enough to guide pixel art generation
- Enemy descriptions should describe appearance clearly for image generation
- Keep the tone fun, exciting, and appropriate for all ages
- The story should have a clear beginning, rising action, and satisfying conclusion`,
    },
    {
      role: "user",
      content: `Theme: ${theme.name}

${entryList}

Write a ${theme.levelCount}-chapter ${theme.storyPromptTemplate} story incorporating ALL of the above entries naturally into the narrative.`,
    },
  ];
}
