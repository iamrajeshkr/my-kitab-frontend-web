import { journeyChapters } from './content';
import type { Bite, ItemType, Journey, Lang, Summary } from './types';

// A Track is one playable audio. The queue is built per content type:
//  byte/summary -> 1 track ; journey -> one track per chapter (in order).
export interface Track {
  url: string;
  title: string;
  chapterSeq?: number;
  section?: string;
}
export interface NowPlaying {
  kind: ItemType;
  itemId: string;
  title: string;
  author: string | null;
  cover: string | null;
  lang: Lang;
}

export function buildQueue(kind: ItemType, row: any, lang: Lang): { nowPlaying: NowPlaying; tracks: Track[] } {
  const cover = row?.cover ?? null;
  const np: NowPlaying = { kind, itemId: row.id, title: row.title ?? 'Untitled', author: row.author ?? null, cover, lang };

  if (kind === 'journey') {
    const chapters = journeyChapters(row as Journey, lang);
    const tracks = chapters
      .filter((c) => c.url)
      .map((c) => ({ url: c.url, title: c.title, chapterSeq: c.seq, section: c.section_title }));
    return { nowPlaying: np, tracks };
  }

  const r = row as Bite | Summary;
  const audio = r.audio?.[lang] ?? r.audio?.en;
  const tracks = audio?.url ? [{ url: audio.url, title: r.title ?? '' }] : [];
  return { nowPlaying: np, tracks };
}
