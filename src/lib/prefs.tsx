import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Lang } from './types';

export type Rhythm = 'morning' | 'commute' | 'winddown';
export type Mode = 'read' | 'listen';

export interface ContinueState {
  type: 'journey';
  id: string;
  title: string;
  chapterSeq: number;
  totalChapters: number;
  nextTitle?: string;
}

interface Prefs {
  ready: boolean;
  onboarded: boolean;
  language: Lang;
  intent: string;
  rhythm: Rhythm;
  mode: Mode;
  saved: string[]; // catalog item ids
  continueState: ContinueState | null;
  daysUsed: string[]; // ISO dates the app was opened
  set: (patch: Partial<Omit<Prefs, 'set' | 'ready'>>) => void;
  toggleSaved: (id: string) => void;
}

const KEY = 'kitab.prefs.v1';

const defaults = {
  onboarded: false,
  language: 'en' as Lang,
  intent: '',
  rhythm: 'morning' as Rhythm,
  mode: 'listen' as Mode,
  saved: [] as string[],
  continueState: null as ContinueState | null,
  daysUsed: [] as string[],
};

const PrefsContext = createContext<Prefs>({ ...defaults, ready: false, set: () => {}, toggleSaved: () => {} });

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const loaded = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
        const today = new Date().toISOString().slice(0, 10);
        if (!loaded.daysUsed.includes(today)) loaded.daysUsed = [...loaded.daysUsed, today];
        setState(loaded);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<Prefs>(
    () => ({
      ...state,
      ready,
      set: (patch) =>
        setState((prev) => {
          const next = { ...prev, ...patch };
          AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
          return next;
        }),
      toggleSaved: (id) =>
        setState((prev) => {
          const saved = prev.saved.includes(id)
            ? prev.saved.filter((s) => s !== id)
            : [...prev.saved, id];
          const next = { ...prev, saved };
          AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
          return next;
        }),
    }),
    [state, ready]
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
