import { supabase } from './supabase';
import type { Bite, CatalogItem, Journey, JourneyChapter, Summary } from './types';

function minutesLabel(totalSeconds: number) {
  const m = Math.max(1, Math.round(totalSeconds / 60));
  return `${m} min`;
}

// Several jsonb columns in this DB are double-encoded (stored as a JSON string
// rather than an object), which silently breaks content/audio/tags/bilingual
// reads for bites & journeys. Normalise rows on the way out so the rest of the
// app always sees real objects.
const JSON_FIELDS = [
  'content', 'audio', 'tags', 'content_chapterwise',
  'title_bilingual', 'author_bilingual', 'feedback',
] as const;

function parseMaybe(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function normalizeRow<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const out: Record<string, any> = { ...row };
  for (const f of JSON_FIELDS) if (f in out) out[f] = parseMaybe(out[f]);
  return out as T;
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
    ...((journeys.data ?? []) as Journey[]).map((r) => journeyToItem(normalizeRow(r))),
    ...((bites.data ?? []) as Bite[]).map((r) => biteToItem(normalizeRow(r))),
    ...((summaries.data ?? []) as Summary[]).map((r) => summaryToItem(normalizeRow(r))),
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
  return normalizeRow(data);
}
