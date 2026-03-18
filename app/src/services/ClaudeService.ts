// Phase 2 & 4: Claude Messages API client
import { APIMessage, ClaudeResponse, CLAUDE_TOOLS, SYSTEM_PROMPT } from '@/types/ClaudeAPI';
import { ScryfallService } from './ScryfallService';
import { ScryfallCard } from '@/types/ScryfallCard';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-6';
const MAX_TOOL_ITERATIONS = 5;

function formatCardForClaude(card: ScryfallCard, rulings: { comment: string; published_at: string }[]): string {
  const lines: string[] = [];

  lines.push(`**${card.name}**`);
  if (card.mana_cost) lines.push(`Mana Cost: ${card.mana_cost}`);
  lines.push(`Type: ${card.type_line}`);
  if (card.oracle_text) lines.push(`\nOracle Text:\n${card.oracle_text}`);
  if (card.power && card.toughness) lines.push(`\nP/T: ${card.power}/${card.toughness}`);
  if (card.loyalty) lines.push(`Loyalty: ${card.loyalty}`);

  const relevantFormats = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper'];
  const legalIn = relevantFormats.filter((f) => card.legalities[f] === 'legal');
  const bannedIn = relevantFormats.filter((f) => card.legalities[f] === 'banned');
  if (legalIn.length > 0) lines.push(`\nLegal in: ${legalIn.join(', ')}`);
  if (bannedIn.length > 0) lines.push(`Banned in: ${bannedIn.join(', ')}`);

  if (rulings.length > 0) {
    lines.push('\nOfficial Rulings:');
    rulings.slice(0, 5).forEach((r) => {
      lines.push(`• [${r.published_at}] ${r.comment}`);
    });
  }

  return lines.join('\n');
}

async function callClaude(messages: APIMessage[], apiKey: string, useTools: boolean): Promise<ClaudeResponse> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  };

  if (useTools) {
    body.tools = CLAUDE_TOOLS;
  }

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    if (response.status === 401) throw new Error('INVALID_KEY');
    if (response.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(error.error?.message ?? `API error: ${response.status}`);
  }

  return response.json() as Promise<ClaudeResponse>;
}

export const ClaudeService = {
  // Phase 2: simple multi-turn send (no tools)
  async send(messages: APIMessage[], apiKey: string): Promise<string> {
    const response = await callClaude(messages, apiKey, false);
    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  },

  // Phase 4: agentic tool-use loop
  async sendWithTools(
    messages: APIMessage[],
    apiKey: string,
    onToolActivity: (activity: string | null) => void,
    onCardLookedUp?: (name: string, card: ScryfallCard) => void,
  ): Promise<string> {
    const workingMessages = [...messages];
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      const response = await callClaude(workingMessages, apiKey, true);

      if (response.stop_reason === 'end_turn') {
        onToolActivity(null);
        const textBlock = response.content.find((b) => b.type === 'text');
        return textBlock && 'text' in textBlock ? textBlock.text : '';
      }

      if (response.stop_reason === 'tool_use') {
        // Append the assistant's tool_use response
        workingMessages.push({ role: 'assistant', content: response.content });

        const toolResultContents: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;

          onToolActivity(`Looking up ${String(block.input.card_name ?? block.input.query ?? 'cards')}...`);

          let resultText: string;
          try {
            if (block.name === 'search_card') {
              const card = await ScryfallService.fetchCard(String(block.input.card_name));
              const rulings = card.rulings_uri
                ? await ScryfallService.fetchRulings(card.rulings_uri)
                : [];
              resultText = formatCardForClaude(card, rulings);
              onCardLookedUp?.(card.name, card);
            } else if (block.name === 'search_cards') {
              const limit = typeof block.input.limit === 'number' ? block.input.limit : 5;
              const cards = await ScryfallService.searchCards(String(block.input.query), limit);
              if (cards.length === 0) {
                resultText = 'No cards found matching that query.';
              } else {
                const cardTexts = await Promise.all(
                  cards.map(async (card) => {
                    const rulings = card.rulings_uri
                      ? await ScryfallService.fetchRulings(card.rulings_uri)
                      : [];
                    onCardLookedUp?.(card.name, card);
                    return formatCardForClaude(card, rulings);
                  })
                );
                resultText = cardTexts.join('\n\n---\n\n');
              }
            } else {
              resultText = `Unknown tool: ${block.name}`;
            }
          } catch (e) {
            resultText = `Tool error: ${e instanceof Error ? e.message : String(e)}`;
          }

          toolResultContents.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: resultText,
          });
        }

        // Append all tool results as a single user turn
        workingMessages.push({ role: 'user', content: toolResultContents });
        continue;
      }

      // Unexpected stop reason
      break;
    }

    onToolActivity(null);
    return 'Sorry, I hit a limit while looking up card data. Please try again.';
  },
};
