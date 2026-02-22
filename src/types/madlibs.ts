export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "name"
  | "place"
  | "creature"
  | "weapon"
  | "item";

export interface ThemeBlank {
  id: string;
  label: string;
  placeholder: string;
  partOfSpeech: PartOfSpeech;
  maxLength: number;
  suggestions?: string[];
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  blanks: ThemeBlank[];
  artDirection: string;
  storyPromptTemplate: string;
  levelCount: number;
  colorPalette: string[];
}
