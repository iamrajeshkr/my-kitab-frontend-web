import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
import type { ItemType, Lang } from './types';
import type { Weather } from './weather';

// Thin client for the Kitab AI backend. Owns guest auth: a stable device_id is
// stored locally, exchanged once for a backend-minted JWT (no Supabase Auth),
// and re-minted automatically on a 401.

const DEVICE_KEY = 'kitab.device_id';
const TOKEN_KEY = 'kitab.token';

let token: string | null = null;
let authInFlight: Promise<string> | null = null;

// RFC4122-ish v4 — fine for an anonymous device identity.
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function deviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = uuid();
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

async function ensureToken(): Promise<string> {
  if (token) return token;
  const cached = await AsyncStorage.getItem(TOKEN_KEY);
  if (cached) return (token = cached);
  // Single-flight: concurrent calls share one /auth/guest request.
  authInFlight ??= (async () => {
    const id = await deviceId();
    const res = await fetch(`${API_URL}/v1/auth/guest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ device_id: id }),
    });
    if (!res.ok) throw new Error(`auth/guest ${res.status}`);
    const { token: t } = (await res.json()) as { token: string; userId: string };
    token = t;
    await AsyncStorage.setItem(TOKEN_KEY, t);
    authInFlight = null;
    return t;
  })();
  return authInFlight;
}

async function authed<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const t = await ensureToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${t}`, ...(init.headers ?? {}) },
  });
  if (res.status === 401 && retry) {
    token = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    return authed<T>(path, init, false);
  }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown) =>
  authed<T>(path, { method: 'POST', body: JSON.stringify(body) });
const get = <T>(path: string) => authed<T>(path);

// ---- response shapes (mirror the backend) --------------------------------
export interface ComposedPage {
  title: string;
  paragraphs: string[];
  sources: { kind: ItemType; id: string; heading: string | null }[];
}
export interface CatalogRef {
  kind: ItemType;
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
}
export interface RecItem extends CatalogRef {
  score: number;
  reason: string;
}
export interface AskTurn {
  role: 'user' | 'model';
  text: string;
}
export interface SitPlan {
  id: number;
  for_date: string;
  weather: Weather;
  plan: {
    arrive: string;
    read: { kind: ItemType; id: string; title: string } | null;
    reflect: string;
    carry: string;
  };
}
export interface LineAnswer {
  answer: string;
  grounded: boolean;
}
export interface ReflectionResult {
  id: number;
  safety: { severity: 0 | 1 | 2 | 3; resources?: { message: string; lines: { name: string; contact: string }[] } };
}

export interface Garden {
  practices_kept: number;
  pages_read: number;
  days_used: number;
  leaves: { text: string; kept: number; status: 'active' | 'kept' | 'released' }[];
}
export interface MirrorSnapshot {
  portrait: string;
  traits: Record<string, number>;
  deltas: { note?: string } | Record<string, never>;
  week_start: string;
  generated_at: string;
}
export interface Letter {
  body: string;
  week_start: string;
  lang: Lang;
  generated_at: string;
}

export interface EventInput {
  type: string;
  kind?: ItemType;
  id?: string;
  payload?: Record<string, unknown>;
}

export const api = {
  composePage: (b: { weather: Weather; intent?: string; lang: Lang }) =>
    post<ComposedPage>('/v1/compose-page', b),
  dailySit: (b: { weather: Weather; lang: Lang }) => post<SitPlan>('/v1/sit', b),
  recommend: (b: { weather?: Weather; limit?: number }) =>
    post<{ items: RecItem[] }>('/v1/recommend', b),
  search: (b: { q: string; lang: Lang; limit?: number }) =>
    post<{ items: (RecItem & { similarity: number })[] }>('/v1/search', b),
  askLine: (b: { kind: ItemType; id: string; lang: Lang; quote: string; question?: string }) =>
    post<LineAnswer>('/v1/ask-line', b),
  ask: (b: { query: string; lang: Lang; history?: AskTurn[] }) =>
    post<{ reply: string; items: CatalogRef[] }>('/v1/companion', b),
  reflect: (b: { text: string; lang: Lang; context?: Record<string, unknown> }) =>
    post<ReflectionResult>('/v1/reflections', b),
  setWeather: (b: { weather: Weather; local_hour?: number }) => post<{ ok: true }>('/v1/weather', b),
  createPractice: (b: { text: string; source_kind?: ItemType; source_id?: string; keep?: boolean }) =>
    post<{ id: number }>('/v1/practices', b),
  keepPractice: (id: number) => post<{ ok: true }>(`/v1/practices/${id}/keep`, {}),
  logEvents: (events: EventInput[]) => post<{ accepted: number }>('/v1/events', { events }),

  getCatalog: () => get<{ bites: any[]; journeys: any[]; summaries: any[] }>('/v1/catalog'),
  getItem: (kind: ItemType, id: string) => get<any>(`/v1/catalog/${kind}/${id}`),
  getGarden: () => get<Garden>('/v1/garden'),
  getMirror: () => get<{ latest: MirrorSnapshot | null; first: MirrorSnapshot | null }>('/v1/mirror'),
  generateMirror: () => post<MirrorSnapshot>('/v1/mirror/generate', {}),
  getLetter: () => get<{ letter: Letter | null }>('/v1/letter'),
  generateLetter: (lang: Lang) => post<Letter>(`/v1/letter/generate?lang=${lang}`, {}),
};
