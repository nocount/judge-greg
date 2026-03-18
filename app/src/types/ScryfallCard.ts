export interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  art_crop?: string;
}

export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  color_identity?: string[];
  set: string;
  set_name: string;
  legalities: Record<string, 'legal' | 'not_legal' | 'banned' | 'restricted'>;
  rulings_uri?: string;
  image_uris?: ScryfallImageUris;
  // Double-faced cards
  card_faces?: Array<{
    name: string;
    mana_cost?: string;
    type_line: string;
    oracle_text?: string;
    image_uris?: ScryfallImageUris;
  }>;
}

export interface ScryfallRuling {
  source: string;
  published_at: string;
  comment: string;
}

export interface ScryfallSearchResponse {
  data: ScryfallCard[];
  total_cards: number;
  has_more: boolean;
}
