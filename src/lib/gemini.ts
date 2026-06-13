import type { CatalogItem, Lang } from './types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
const MODEL = 'gemini-2.5-flash';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export interface AskResult {
  reply: string;
  itemIds: string[];
}

export async function askKitab(
  query: string,
  catalog: CatalogItem[],
  lang: Lang,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<AskResult> {
  const catalogLines = catalog
    .map(
      (c) =>
        `- id:${c.id} | type:${c.type} | "${c.title}" by ${c.author}` +
        (c.category ? ` | category:${c.category}` : '') +
        (c.difficulty ? ` | ${c.difficulty}` : '') +
        ` | ${c.durationLabel}`
    )
    .join('\n');

  const system =
    `You are "Ask Kitab", a warm, wise librarian inside Kitab — a bilingual (English/Hindi) ` +
    `mindfulness and self-growth reading & listening app. The user tells you how they feel or ` +
    `what they want to become. Respond with 2-3 sentences of gentle, concrete guidance ` +
    `(${lang === 'hi' ? 'in Hindi (Devanagari)' : 'in English'}), then recommend 1-3 items ` +
    `from the catalog below that genuinely fit. Prefer a journey for sustained change, a byte ` +
    `for today, a summary for depth.\n\nCATALOG:\n${catalogLines}\n\n` +
    `Reply ONLY with JSON: {"reply": string, "item_ids": string[]}`;

  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: query }] },
  ];

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const parsed = JSON.parse(text);
  const valid = new Set(catalog.map((c) => c.id));
  return {
    reply: parsed.reply ?? '',
    itemIds: (parsed.item_ids ?? []).filter((id: string) => valid.has(id)),
  };
}
