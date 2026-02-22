import type { Theme } from "@/types/madlibs";
import type { StoryData, ChapterData } from "@/types/story";

const PIXEL_ART_PREFIX =
  "16-bit retro pixel art style, clean pixel edges, limited color palette, no anti-aliasing, game asset sprite, centered on canvas";

/**
 * Shared character description — used by ALL hero prompts so idle & run
 * sprites have identical clothing, proportions, and weapon.
 */
function buildCharacterDescription(
  theme: Theme,
  entries: Record<string, string>
): string {
  const heroName = entries.heroName || "Hero";
  const heroAdj = entries.heroAdj || "brave";
  const weapon = entries.heroWeapon || "weapon";

  return `character: ${heroName} a ${heroAdj} hero with a ${weapon}, same character same outfit design in every frame, ${theme.artDirection}`;
}

export function buildHeroIdlePrompt(
  theme: Theme,
  _story: StoryData,
  entries: Record<string, string>
): string {
  const charDesc = buildCharacterDescription(theme, entries);

  return `${PIXEL_ART_PREFIX}, ${charDesc}, single character sprite facing right, idle standing pose, flat solid colored background, no shadow, no ground, isolated character sprite on empty background`;
}

export function buildHeroRunPrompt(
  theme: Theme,
  _story: StoryData,
  entries: Record<string, string>
): string {
  const charDesc = buildCharacterDescription(theme, entries);

  return `${PIXEL_ART_PREFIX}, ${charDesc}, single character sprite facing right, running action pose with one leg forward, flat solid colored background, no shadow, no ground, isolated character sprite`;
}

export function buildVillainPrompt(
  theme: Theme,
  story: StoryData,
  entries: Record<string, string>
): string {
  const villainName = entries.villainName || "Villain";
  const villainAdj = entries.villainAdj || "evil";
  const bossChapter = story.chapters.find((c) => c.bossLevel) || story.chapters[story.chapters.length - 1];

  return `${PIXEL_ART_PREFIX}, ${theme.artDirection}, single boss villain character sprite facing left, menacing powerful pose, character: ${villainName} a ${villainAdj} villain, ${bossChapter.enemyDescription}, flat solid colored background, no shadow, no ground, large imposing character, isolated sprite`;
}

export function buildEnemyPrompt(
  theme: Theme,
  chapter: ChapterData
): string {
  return `${PIXEL_ART_PREFIX}, ${theme.artDirection}, single small enemy creature sprite facing left, menacing pose, ${chapter.enemyDescription}, flat solid colored background, no shadow, no ground, isolated sprite`;
}

export function buildCollectiblePrompt(
  theme: Theme,
  entries: Record<string, string>
): string {
  const collectible = entries.collectible || "gem";

  return `${PIXEL_ART_PREFIX}, ${theme.artDirection}, single small collectible item, ${collectible}, glowing magical effect, flat solid colored background, no shadow, isolated game item sprite, simple iconic design`;
}

export function buildBackgroundPrompt(
  theme: Theme,
  chapter: ChapterData
): string {
  return `16-bit retro pixel art game background, horizontal scrolling platformer, ${theme.artDirection}, ${chapter.levelDescription}, wide panoramic scene, no characters, no UI elements, pure environment, atmospheric and detailed`;
}

export function buildPlatformTilesetPrompt(theme: Theme): string {
  return `${PIXEL_ART_PREFIX}, ${theme.artDirection}, game tileset showing 4 platform tiles in a row: ground with grass top, solid ground block, floating platform piece, special decorated block. Each tile is a square, arranged horizontally in one row. Flat magenta (#FF00FF) background for easy transparency keying, clean grid layout`;
}

export function buildChapterIllustrationPrompt(
  theme: Theme,
  chapter: ChapterData
): string {
  return `16-bit retro pixel art cinematic scene illustration, ${theme.artDirection}, ${chapter.levelDescription}, dramatic composition, storytelling scene depicting: ${chapter.narrative.slice(0, 120)}..., atmospheric lighting, wide shot, no text, no UI, detailed environment with mood and atmosphere`;
}

export function buildPowerUpPrompt(theme: Theme): string {
  return `${PIXEL_ART_PREFIX}, ${theme.artDirection}, single glowing power star collectible, bright golden yellow star with sparkle effect, magical aura glow, flat solid colored background, no shadow, isolated game item sprite, iconic power-up design`;
}
