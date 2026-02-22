import { create } from "zustand";
import type { StoryData } from "@/types/story";
import type { GeneratedAssets } from "@/types/assets";

export type GameStatus =
  | "menu"
  | "creating"
  | "generating"
  | "cutscene"
  | "playing"
  | "paused"
  | "victory"
  | "defeat";

interface GameState {
  themeId: string | null;
  entries: Record<string, string>;
  story: StoryData | null;
  assets: GeneratedAssets | null;
  currentLevel: number;
  score: number;
  lives: number;
  collectiblesFound: number;
  totalCollectibles: number;
  gameStatus: GameStatus;

  setFormData: (themeId: string, entries: Record<string, string>) => void;
  setGameData: (data: {
    story: StoryData;
    assets: GeneratedAssets;
  }) => void;
  setStory: (story: StoryData) => void;
  setAssets: (assets: GeneratedAssets) => void;
  setGameStatus: (status: GameStatus) => void;
  advanceLevel: () => void;
  addScore: (points: number) => void;
  collectItem: () => void;
  loseLife: () => void;
  setTotalCollectibles: (total: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  themeId: null,
  entries: {},
  story: null,
  assets: null,
  currentLevel: 0,
  score: 0,
  lives: 3,
  collectiblesFound: 0,
  totalCollectibles: 0,
  gameStatus: "menu",

  setFormData: (themeId, entries) => set({ themeId, entries }),

  setGameData: ({ story, assets }) => set({ story, assets }),

  setStory: (story) => set({ story }),

  setAssets: (assets) => set({ assets }),

  setGameStatus: (gameStatus) => set({ gameStatus }),

  advanceLevel: () =>
    set((state) => ({
      currentLevel: state.currentLevel + 1,
      collectiblesFound: 0,
    })),

  addScore: (points) =>
    set((state) => ({ score: state.score + points })),

  collectItem: () =>
    set((state) => ({
      collectiblesFound: state.collectiblesFound + 1,
      score: state.score + 100,
    })),

  loseLife: () =>
    set((state) => ({
      lives: state.lives - 1,
      gameStatus: state.lives <= 1 ? "defeat" : state.gameStatus,
    })),

  setTotalCollectibles: (total) => set({ totalCollectibles: total }),

  reset: () =>
    set({
      themeId: null,
      entries: {},
      story: null,
      assets: null,
      currentLevel: 0,
      score: 0,
      lives: 3,
      collectiblesFound: 0,
      totalCollectibles: 0,
      gameStatus: "menu",
    }),
}));
