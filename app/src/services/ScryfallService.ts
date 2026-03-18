// Phase 3: Scryfall API client
import { ScryfallCard, ScryfallRuling, ScryfallSearchResponse } from '@/types/ScryfallCard';

const BASE_URL = 'https://api.scryfall.com';

export const ScryfallService = {
  async fetchCard(name: string): Promise<ScryfallCard> {
    const url = `${BASE_URL}/cards/named?fuzzy=${encodeURIComponent(name)}`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { details?: string }).details ?? `Card not found: ${name}`);
    }
    return response.json() as Promise<ScryfallCard>;
  },

  async searchCards(query: string, limit = 5): Promise<ScryfallCard[]> {
    const url = `${BASE_URL}/cards/search?q=${encodeURIComponent(query)}&order=name`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Search failed: ${response.status}`);
    }
    const data = (await response.json()) as ScryfallSearchResponse;
    return data.data.slice(0, Math.min(limit, 10));
  },

  async fetchRulings(rulingsUri: string): Promise<ScryfallRuling[]> {
    const response = await fetch(rulingsUri);
    if (!response.ok) return [];
    const data = (await response.json()) as { data: ScryfallRuling[] };
    return data.data;
  },
};
