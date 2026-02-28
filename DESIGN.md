# Judge Greg — Design Document

## Overview

Judge Greg is a native iOS application that acts as a knowledgeable Magic: The Gathering rules judge. Users can ask natural-language questions about card rules, card interactions, format legality, tournament rules, and timing/priority. The app uses the Scryfall API to fetch precise card data and the Anthropic Claude API (with tool use) to produce accurate, well-reasoned answers.

---

## Goals

- Serve both casual and competitive players with clear, precise rules answers
- Support general MTG knowledge questions as well as specific card interaction rulings
- Feel like consulting a knowledgeable, neutral Level 2 judge
- Keep the implementation simple for personal use

---

## Platform & Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Platform | iOS (iPhone) | Personal use, native feel |
| Language | Swift | Best-in-class iOS development |
| UI Framework | SwiftUI | Modern, declarative, well-suited for chat UI |
| LLM | Anthropic Claude API | Best reasoning for rules questions |
| Card Data | Scryfall REST API | Comprehensive, free, no auth required |
| Backend | None (direct API calls) | Simplicity; personal use only |

---

## Architecture

```
┌─────────────────────────────────┐
│           SwiftUI App           │
│                                 │
│  ┌──────────┐  ┌─────────────┐  │
│  │ Chat UI  │  │ Card Viewer │  │
│  └────┬─────┘  └──────┬──────┘  │
│       │               │         │
│  ┌────▼───────────────▼──────┐  │
│  │      Session Manager      │  │
│  │  (in-memory conversation) │  │
│  └────────────┬──────────────┘  │
│               │                 │
│  ┌────────────▼──────────────┐  │
│  │      Claude API Client    │  │
│  │   (Messages + Tool Use)   │  │
│  └────────────┬──────────────┘  │
│               │ tool calls      │
│  ┌────────────▼──────────────┐  │
│  │    Scryfall API Client    │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Key Components

**Session Manager**
- Holds the current conversation as an array of `Message` objects (role: user/assistant/tool)
- Ephemeral — cleared when the app is closed or the user taps "New Session"
- Passed in full to the Claude API with each new message to maintain context

**Claude API Client**
- Calls the Anthropic Messages API (`/v1/messages`)
- Sends the full conversation history + system prompt on each turn
- Implements an **agentic tool-use loop**:
  1. Send messages to Claude
  2. If Claude returns a `tool_use` block, execute the requested tool locally
  3. Append the `tool_result` to the conversation
  4. Call Claude again with the result
  5. Repeat until Claude returns a plain `text` response

**Scryfall API Client**
- Implements the tools Claude can invoke (see Tools section)
- No authentication required
- Parses Scryfall JSON into structured Swift models

---

## Claude System Prompt

```
You are a precise and knowledgeable Magic: The Gathering rules judge.
Your role is to answer questions about MTG rules, card interactions,
format legality, tournament rules, and priority/timing with accuracy
and clarity.

When answering:
- Cite the relevant comprehensive rules section when applicable (e.g. CR 702.2)
- Be explicit about game state, timing windows, and who has priority
- If a specific card is mentioned, use the search_card or search_cards tool
  to retrieve its current oracle text before answering
- If a question involves multiple cards, look them all up
- Distinguish between competitive rules enforcement (Rules Enforcement Level:
  Regular vs. Competitive) when relevant
- If a question is ambiguous, state your assumptions clearly
```

---

## Claude Tools (Scryfall)

### `search_card`
Look up a single card by name (fuzzy matching supported).

```json
{
  "name": "search_card",
  "description": "Look up a Magic: The Gathering card by name using the Scryfall API. Returns oracle text, mana cost, type line, power/toughness, loyalty, legalities, and rulings.",
  "input_schema": {
    "type": "object",
    "properties": {
      "card_name": {
        "type": "string",
        "description": "The name of the card to look up. Fuzzy matching is supported."
      }
    },
    "required": ["card_name"]
  }
}
```

**Scryfall endpoint:** `GET https://api.scryfall.com/cards/named?fuzzy={card_name}`

**Data returned to Claude:**
- `name`
- `mana_cost`
- `type_line`
- `oracle_text`
- `power` / `toughness` / `loyalty` (if applicable)
- `legalities` (Standard, Modern, Legacy, Commander, etc.)
- `rulings_uri` → fetched separately to include official rulings

---

### `search_cards`
Search for multiple cards using Scryfall query syntax.

```json
{
  "name": "search_cards",
  "description": "Search for Magic: The Gathering cards using Scryfall search syntax. Useful for finding cards with specific abilities, types, or properties.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "A Scryfall search query (e.g. 'o:deathtouch t:creature', 'f:modern is:commander')"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum number of results to return (default 5, max 10)"
      }
    },
    "required": ["query"]
  }
}
```

**Scryfall endpoint:** `GET https://api.scryfall.com/cards/search?q={query}`

---

## Data Flow — Example Interaction

**User:** "If I attack with Queza, Augur of Agonies and my opponent has no cards in hand, does she still deal damage?"

1. User message appended to session
2. Claude API called with full conversation + system prompt + tools
3. Claude returns `tool_use`: `search_card("Queza, Augur of Agonies")`
4. App calls Scryfall, gets card data + rulings
5. Tool result appended to conversation
6. Claude API called again
7. Claude returns final text answer with ruling explanation
8. Answer displayed in chat UI

---

## UI Design

### Theme
- **Background:** Deep dark (near-black, `#0D0D0D`)
- **Accent colors:** Inspired by the five MTG mana colors
  - White: `#F9FAF4`
  - Blue: `#0E68AB`
  - Black: `#8C4A9C`
  - Red: `#D3202A`
  - Green: `#00733E`
- **Primary UI accent:** Blue (`#0E68AB`) — used for send button, user bubbles
- **Text:** Off-white (`#E8E8E8`) on dark backgrounds
- **Font:** System (SF Pro) — clean and readable

### Screens

**1. Chat Screen (Main)**
- Full-screen chat interface
- Message bubbles:
  - User messages: right-aligned, blue background
  - Judge responses: left-aligned, dark gray background
  - Tool activity: subtle inline indicator ("Looking up card...")
- Text input bar pinned to bottom with send button
- "New Session" button in navigation bar (clears conversation with confirmation)

**2. Card Detail View (Sheet)**
- Triggered when a card is referenced in the answer
- Shows card name, mana cost, type line, oracle text, legalities
- Optional: card image fetched from Scryfall image URIs

### Interaction Flow
```
[Chat Screen]
     │
     ├── User types question → tap Send
     │        │
     │        ▼
     │   "Looking up cards..." indicator shown
     │        │
     │        ▼
     │   Judge answer appears (streamed or full)
     │        │
     │        └── Tappable card names → [Card Detail Sheet]
     │
     └── Tap "New Session" → confirmation alert → clear chat
```

---

## API Key Management

Since this is a personal-use app with no backend, the Anthropic API key will be stored in the iOS **Keychain** rather than hardcoded in the binary. On first launch, the app prompts the user to enter their API key, which is then stored securely in the Keychain.

- Scryfall requires no API key
- The key entry screen doubles as a Settings screen (accessible via gear icon)

---

## Error Handling

| Scenario | Handling |
|---|---|
| No internet connection | Show inline error message in chat |
| Claude API error / rate limit | Show user-friendly error with retry button |
| Scryfall card not found | Claude is informed via tool result; it responds gracefully |
| Invalid API key | Prompt user to re-enter key in Settings |

---

## Out of Scope (v1)

- Voice input (planned for future)
- Conversation history persistence across sessions
- App Store distribution
- Backend server / user accounts
- Push notifications
- Deck building or collection tracking
- Card image browsing

---

## Future Considerations

- **Voice input** via AVFoundation / Speech framework
- **Persistent history** using SwiftData or Core Data
- **Card image display** in chat inline
- **Response streaming** via Anthropic streaming API for faster perceived response
- **Backend proxy** if distributing to others (to protect API key)
- **Haptic feedback** on message send/receive

---

## Milestones

| Phase | Deliverable |
|---|---|
| 1 | Project setup, SwiftUI chat UI skeleton, dark MTG theme |
| 2 | Claude API client with multi-turn conversation |
| 3 | Scryfall API client + tool definitions |
| 4 | Agentic tool-use loop (Claude ↔ Scryfall) |
| 5 | API key Keychain storage + Settings screen |
| 6 | Card detail sheet + tappable card names |
| 7 | Polish, error handling, edge cases |
