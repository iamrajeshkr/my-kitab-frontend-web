export type Lang = 'en' | 'hi';

export interface AudioTrack {
  url: string;
  type?: string;
  duration?: string | number;
  language?: string;
  vo_artist?: string;
}

export interface JourneyChapter {
  seq: number;
  url: string;
  type?: string;
  title: string;
  section: number;
  duration: number; // seconds
  subsection: number;
  section_title: string;
}

export interface Bite {
  id: string;
  cover: string | null;
  author: string | null;
  title: string | null;
  audio: Partial<Record<Lang, AudioTrack>> | null;
  content: Partial<Record<Lang, string>> | null;
  tags: string[] | null;
  difficulty: string | null;
  category: string | null;
  author_bilingual: Partial<Record<Lang, string>> | null;
  title_bilingual: Partial<Record<Lang, string>> | null;
}

export interface Summary {
  id: string;
  cover: string | null;
  author: string | null;
  title: string | null;
  audio: Partial<Record<Lang, AudioTrack>> | null;
  content: Partial<Record<Lang, string>> | null;
  tags: string[] | null;
}

export interface Journey {
  id: string;
  cover: string | null;
  author: string | null;
  title: string | null;
  content: Partial<Record<Lang, string>> | null;
  audio: Partial<Record<Lang, { chapters: JourneyChapter[] }>> | null;
  content_chapterwise: Partial<Record<Lang, Record<string, string>>> | null;
  tags: string[] | null;
}

export type ItemType = 'byte' | 'journey' | 'summary';

export interface CatalogItem {
  type: ItemType;
  id: string;
  title: string;
  author: string;
  cover: string | null;
  category: string | null;
  difficulty: string | null;
  durationLabel: string; // e.g. "5 min", "11 chapters · 27 min"
  raw: Bite | Summary | Journey;
}
