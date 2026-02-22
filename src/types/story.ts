export interface ChapterData {
  chapterNumber: number;
  title: string;
  narrative: string;
  levelDescription: string;
  enemyDescription: string;
  objective: string;
  bossLevel: boolean;
}

export interface StoryData {
  title: string;
  chapters: ChapterData[];
  epilogue: string;
}
