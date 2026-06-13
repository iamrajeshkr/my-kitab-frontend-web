import { supabase } from './supabase';
import type { Bite, CatalogItem, Journey, JourneyChapter, Summary } from './types';

function minutesLabel(totalSeconds: number) {
  const m = Math.max(1, Math.round(totalSeconds / 60));
  return `${m} min`;
}

// "02:35" or "21:49" or seconds → minutes label
export function parseDuration(d: string | number | undefined | null): number {
  if (d == null || d === '') return 0;
  if (typeof d === 'number') return d;
  const parts = d.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

export function journeyChapters(j: Journey, lang: 'en' | 'hi'): JourneyChapter[] {
  const chapters = j.audio?.[lang]?.chapters ?? j.audio?.en?.chapters ?? [];
  return [...chapters].sort((a, b) => a.seq - b.seq);
}

export function biteToItem(b: Bite): CatalogItem {
  const secs = parseDuration(b.audio?.en?.duration ?? b.audio?.hi?.duration);
  return {
    type: 'byte',
    id: b.id,
    title: b.title ?? 'Untitled',
    author: b.author ?? '',
    cover: b.cover,
    category: b.category,
    difficulty: b.difficulty,
    durationLabel: secs ? minutesLabel(secs) : 'short read',
    raw: b,
  };
}

export function summaryToItem(s: Summary): CatalogItem {
  const secs = parseDuration(s.audio?.en?.duration ?? s.audio?.hi?.duration);
  return {
    type: 'summary',
    id: s.id,
    title: s.title ?? 'Untitled',
    author: s.author ?? '',
    cover: s.cover,
    category: null,
    difficulty: null,
    durationLabel: secs ? minutesLabel(secs) : '',
    raw: s,
  };
}

export function journeyToItem(j: Journey): CatalogItem {
  const chapters = journeyChapters(j, 'en');
  const total = chapters.reduce((acc, c) => acc + (c.duration || 0), 0);
  const sections = new Set(chapters.map((c) => c.section)).size;
  return {
    type: 'journey',
    id: j.id,
    title: j.title ?? 'Untitled',
    author: j.author ?? '',
    cover: j.cover,
    category: null,
    difficulty: null,
    durationLabel: chapters.length
      ? `${sections} parts · ${chapters.length} chapters · ${minutesLabel(total)}`
      : '',
    raw: j,
  };
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
  // Light columns only — content/chapter jsonb is huge and loaded per-item on the detail screen
  const [bites, journeys, summaries] = await Promise.all([
    supabase
      .from('bites')
      .select('id,cover,author,title,audio,difficulty,category,author_bilingual,title_bilingual'),
    supabase.from('journeys').select('id,cover,author,title,tags'),
    supabase.from('summaries').select('id,cover,author,title,audio'),
  ]);
  const err = bites.error ?? journeys.error ?? summaries.error;
  if (err) throw err;
  return [
    ...((journeys.data as Journey[]) ?? []).map(journeyToItem),
    ...((bites.data as Bite[]) ?? []).map(biteToItem),
    ...((summaries.data as Summary[]) ?? []).map(summaryToItem),
  ];
}

const TABLE: Record<string, string> = {
  byte: 'bites',
  journey: 'journeys',
  summary: 'summaries',
};

export async function fetchItem(type: string, id: string) {
  const { data, error } = await supabase.from(TABLE[type]).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
