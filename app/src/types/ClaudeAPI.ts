export interface APITextBlock {
  type: 'text';
  text: string;
}

export interface APIToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface APIToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

export type APIContentBlock = APITextBlock | APIToolUseBlock | APIToolResultBlock;

export interface APIMessage {
  role: 'user' | 'assistant';
  content: string | APIContentBlock[];
}

export interface ClaudeResponse {
  id: string;
  content: APIContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
}

export const CLAUDE_TOOLS: ClaudeTool[] = [
  {
    name: 'search_card',
    description:
      'Look up a specific Magic: The Gathering card by name. Returns the card\'s oracle text, mana cost, type line, legalities, and official rulings. Use this when the user asks about a specific card by name.',
    input_schema: {
      type: 'object',
      properties: {
        card_name: {
          type: 'string',
          description: 'The name of the card to look up. Fuzzy matching is supported.',
        },
      },
      required: ['card_name'],
    },
  },
  {
    name: 'search_cards',
    description:
      'Search for Magic: The Gathering cards using Scryfall query syntax. Use this to find cards that match certain criteria (e.g., cards with a specific ability, cards legal in a format, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'A Scryfall search query (e.g., "o:deathtouch t:creature", "f:modern o:cascade").',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of results to return. Defaults to 5, max 10.',
        },
      },
      required: ['query'],
    },
  },
];

export const SYSTEM_PROMPT = `You are Judge Greg, a knowledgeable and precise Magic: The Gathering rules judge. You answer rules questions with accuracy and clarity, always citing official rulings when relevant.

When answering questions:
- Use the search_card tool to look up specific cards and their oracle text before answering questions about them
- Use the search_cards tool when you need to find cards that match certain criteria
- Always base your answers on the actual oracle text, not memory
- Cite the relevant rules (Comprehensive Rules) when appropriate
- Be precise about timing, priority, and the stack
- If a question is ambiguous, ask for clarification
- Keep answers focused and practical

You are an impartial judge — you provide the correct ruling regardless of which player it favors.`;
