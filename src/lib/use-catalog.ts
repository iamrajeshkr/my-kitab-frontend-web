import { useEffect, useState } from 'react';
import { fetchCatalog } from './content';
import type { CatalogItem } from './types';

let cache: CatalogItem[] | null = null;

export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[] | null>(cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    fetchCatalog()
      .then((data) => {
        cache = data;
        if (alive) setItems(data);
      })
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, []);

  return { items, error, loading: items === null && !error };
}
