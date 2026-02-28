# Judge Greg — Implementation Phases (2–7)

Phase 1 (chat UI skeleton + MTG theme) is complete.
This document covers the remaining phases in enough detail to pick up at any point.

---

## Phase 2 — Claude API Client (Multi-turn Conversation)

**Goal:** Replace the stub in `ChatViewModel` with real calls to the Anthropic Messages API, supporting multi-turn conversation within a session.

### New file: `Services/ClaudeService.swift`

Responsible for:
- Holding the Anthropic API key (passed in from the Keychain layer — stubbed as a hardcoded string for now)
- Maintaining no internal state — receives the full conversation history on each call
- Calling `POST https://api.anthropic.com/v1/messages`
- Returning the assistant's text reply

**Request shape:**
```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 1024,
  "system": "<system prompt>",
  "messages": [
    { "role": "user", "content": "What does deathtouch do?" },
    { "role": "assistant", "content": "..." },
    ...
  ]
}
```

**Required headers:**
```
x-api-key: <key>
anthropic-version: 2023-06-01
Content-Type: application/json
```

**System prompt** (defined as a constant in `ClaudeService`):
```
You are a precise and knowledgeable Magic: The Gathering rules judge.
Answer questions about MTG rules, card interactions, format legality,
tournament rules, and priority/timing with accuracy and clarity.
- Cite relevant comprehensive rules sections (e.g. CR 702.15) when applicable.
- Be explicit about game state, timing windows, and priority.
- If a question is ambiguous, state your assumptions clearly.
- Distinguish between Regular and Competitive Rules Enforcement Level when relevant.
```

**Response parsing:** Extract `response.content[0].text` from the JSON.

### Update: `Models/ChatMessage.swift`

Add a helper to convert `[ChatMessage]` into the `[{ role, content }]` array format the API expects. Map `.user` → `"user"`, `.judge` → `"assistant"`.

### Update: `ViewModels/ChatViewModel.swift`

- Inject `ClaudeService` as a dependency
- Replace the `Task.sleep` stub in `sendMessage()` with a call to `ClaudeService.send(messages:)`
- Pass the full `messages` array (excluding the new user message already appended) as history
- Append the returned text as a `.judge` message
- Handle errors: set an error message visible in the UI (simple inline error bubble for now)

### Temporary API key

For Phase 2 only, hardcode the key as a constant at the top of `ClaudeService`. It will be moved to the Keychain in Phase 5.
```swift
// TODO Phase 5: move to Keychain
private let apiKey = "sk-ant-..."
```

### Verification
- Ask "What does lifelink do?" — should get a real Claude answer
- Ask a follow-up "What if the creature also has deathtouch?" — should reference the prior context

---

## Phase 3 — Scryfall API Client + Tool Definitions

**Goal:** Build the Scryfall client and define the two Claude tools as Swift types. No agentic loop yet — just the plumbing.

### New file: `Services/ScryfallService.swift`

Two methods:

**`fetchCard(name: String) async throws -> ScryfallCard`**
- `GET https://api.scryfall.com/cards/named?fuzzy=<name>`
- No auth header needed
- Returns a `ScryfallCard` model

**`searchCards(query: String, limit: Int) async throws -> [ScryfallCard]`**
- `GET https://api.scryfall.com/cards/search?q=<query>&order=name`
- Returns up to `limit` results from `data[]`

### New file: `Models/ScryfallCard.swift`

```swift
struct ScryfallCard: Codable {
    let name: String
    let manaCost: String?
    let typeLine: String
    let oracleText: String?
    let power: String?
    let toughness: String?
    let loyalty: String?
    let legalities: [String: String]  // format name → "legal" / "not_legal" / "banned"
    let rulingsUri: URL?
    let imageUris: ImageUris?

    struct ImageUris: Codable {
        let small: URL?
        let normal: URL?
        let large: URL?
    }
}
```

Use `CodingKeys` to map snake_case JSON → camelCase Swift properties.

**`fetchRulings(uri: URL) async throws -> [ScryfallRuling]`**
- Calls `rulingsUri` from a card to get official WotC rulings
- Returns array of `{ published_at, comment }` objects

### New file: `Models/ClaudeTool.swift`

Define the two tool schemas as static constants that will be serialized into the Claude API request:

**`search_card`:**
```json
{
  "name": "search_card",
  "description": "Look up a Magic: The Gathering card by name. Returns oracle text, mana cost, type, power/toughness, legalities, and official rulings.",
  "input_schema": {
    "type": "object",
    "properties": {
      "card_name": { "type": "string", "description": "Card name (fuzzy matching supported)" }
    },
    "required": ["card_name"]
  }
}
```

**`search_cards`:**
```json
{
  "name": "search_cards",
  "description": "Search for MTG cards using Scryfall query syntax (e.g. 'o:deathtouch t:creature', 'f:modern is:commander').",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "limit": { "type": "integer", "description": "Max results (default 5, max 10)" }
    },
    "required": ["query"]
  }
}
```

Represent both as `Codable` Swift structs so they can be serialized cleanly into the API request body.

### Verification
- Write a quick unit test or temporary debug call: `ScryfallService().fetchCard(name: "Lightning Bolt")` and print the result to confirm oracle text + legalities come back correctly.

---

## Phase 4 — Agentic Tool-Use Loop (Claude ↔ Scryfall)

**Goal:** Wire Claude tool use to Scryfall so that Claude can look up cards mid-response before answering.

### How Claude tool use works

When tools are included in the API request, Claude may return a `stop_reason` of `"tool_use"` instead of `"end_turn"`. The response content will contain one or more `tool_use` blocks:

```json
{
  "stop_reason": "tool_use",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_abc123",
      "name": "search_card",
      "input": { "card_name": "Ragavan, Nimble Pilferer" }
    }
  ]
}
```

The app must:
1. Execute the tool (call Scryfall)
2. Append a `tool_result` message back to the conversation
3. Call Claude again
4. Repeat until `stop_reason == "end_turn"`

### Update: `Services/ClaudeService.swift`

Change the method signature to run a loop:

```swift
func sendWithTools(messages: [APIMessage]) async throws -> String
```

**Loop:**
```
while true:
    response = POST /v1/messages (with tools array)
    if response.stop_reason == "end_turn":
        return response.content[0].text
    if response.stop_reason == "tool_use":
        for each tool_use block in response.content:
            result = executeLocally(toolUse)
            append tool_result to messages
        continue loop
```

**Request shape with tools:**
```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 1024,
  "tools": [ <search_card>, <search_cards> ],
  "system": "...",
  "messages": [...]
}
```

**Tool result message shape:**
```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_abc123",
      "content": "<formatted card data string>"
    }
  ]
}
```

### Tool result formatting

The card data passed back to Claude should be a concise text block, not raw JSON:

```
Name: Ragavan, Nimble Pilferer
Mana Cost: {R}
Type: Legendary Creature — Monkey Pirate
Oracle Text: Whenever Ragavan, Nimble Pilferer deals combat damage to a player, create a Treasure token and exile the top card of that player's library. Until end of turn, you may cast that card.
Dash {R} (...)
Power/Toughness: 2/1
Legalities: Standard: not_legal | Modern: legal | Legacy: legal | Commander: legal
Rulings:
- [2021-07-23] The Treasure token is created and the card is exiled...
```

### Update: `ChatViewModel.swift`

- Show a subtle "Looking up cards..." status during tool calls
  - Add a `@Published var toolActivity: String? = nil` property
  - Set it to `"Looking up [card name]..."` when a `search_card` tool call fires
  - Clear it when the final answer arrives
- Convert `[ChatMessage]` to `[APIMessage]` (including any `tool_use`/`tool_result` pairs stored in the session)

### Update: `Models/ChatMessage.swift`

Add two new internal-only role cases to track tool turns in the session (needed to faithfully reconstruct the conversation for subsequent API calls):
```swift
case toolUse(id: String, name: String, input: [String: Any])
case toolResult(toolUseId: String, content: String)
```
These roles are never shown in the UI — only serialized back to the API.

### Update: `Views/ChatView.swift`

Add a small inline status indicator above the input bar when `viewModel.toolActivity != nil`:
```
🔍 Looking up Ragavan, Nimble Pilferer...
```

### Verification
- Ask "What happens if I block a Queza, Augur of Agonies with my creature?"
- Confirm Claude calls `search_card`, the tool activity label briefly appears, and the final answer correctly references Queza's oracle text.
- Ask a multi-card question: "Can my Deathrite Shaman eat a card from an opponent's graveyard if I don't control any Forests?" — should trigger `search_card` for Deathrite Shaman.

---

## Phase 5 — API Key Keychain Storage + Settings Screen

**Goal:** Remove the hardcoded API key and replace it with secure Keychain storage, surfaced via a Settings screen.

### New file: `Services/KeychainService.swift`

Thin wrapper around `Security.framework`:

```swift
struct KeychainService {
    static func save(key: String, value: String) throws
    static func load(key: String) throws -> String
    static func delete(key: String) throws
}
```

Use `kSecClassGenericPassword` with a fixed service identifier (e.g. `"com.judgegreg.apikey"`).

### New file: `Views/SettingsView.swift`

Presented as a sheet from the navigation bar gear icon.

**Contents:**
- Section header: "Anthropic API Key"
- `SecureField` showing masked key with a paste/edit affordance
- "Save" button → writes to Keychain → dismisses sheet
- "Clear Key" destructive button
- Brief instructional text: "Your key is stored securely in the iOS Keychain and never leaves your device."
- Link to `https://console.anthropic.com` (open in Safari) for users to get their key

### Update: `Views/ChatView.swift`

- Add gear icon (`⚙`) to leading toolbar item → presents `SettingsView` as a sheet
- On app launch (in `ChatViewModel.init` or `ChatView.onAppear`): attempt to load key from Keychain
  - If not found: automatically open `SettingsView`
  - If found: proceed normally

### Update: `Services/ClaudeService.swift`

- Remove hardcoded key constant
- Accept key as an initializer parameter: `init(apiKey: String)`
- `ChatViewModel` constructs `ClaudeService(apiKey:)` using the Keychain-loaded value

### Verification
- Fresh install (or delete app): SettingsView auto-presents on launch
- Enter key, save, send a question — works
- Force-quit, reopen — key persists, no prompt
- Clear key from Settings — SettingsView auto-presents again on next question attempt

---

## Phase 6 — Card Detail Sheet + Tappable Card Names

**Goal:** When a card name appears in a judge answer, make it tappable to show a card detail sheet with full Scryfall data and art.

### Approach: Detecting card names in responses

Parse the judge's answer text for card names that were looked up during the tool-use loop. Since we already track which cards were fetched (they come through `tool_result` messages), store them in the session:

In `ChatViewModel`, maintain:
```swift
var lookedUpCards: [String: ScryfallCard] = [:]  // card name → card data
```

Populated whenever a `tool_result` comes back.

### New file: `Views/CardDetailView.swift`

Displayed as a `.sheet` when a tappable card name is tapped.

**Contents (in a `ScrollView`):**
- Card image (`imageUris.normal`) loaded asynchronously via `AsyncImage`
  - Placeholder: mana color gradient rectangle while loading
- Card name (large, bold)
- Mana cost (rendered as colored circle symbols — can use emoji or simple text like `{2}{R}{G}` for v1)
- Type line
- Oracle text (in a rounded card-style box)
- Power/Toughness or Loyalty
- Legalities grid: show Standard, Pioneer, Modern, Legacy, Commander as colored chips (green = legal, gray = not_legal, red = banned)
- Official rulings (collapsible, shown as a list of dated bullets)

### New file: `Views/LinkedTextView.swift`

A SwiftUI view that renders a string and makes known card names tappable.

Simple approach for v1: search the message text for exact matches against `lookedUpCards.keys` and use `AttributedString` to underline/highlight them. On tap, set a `@State var selectedCard: ScryfallCard?` which drives the `.sheet`.

```swift
// Pseudo-approach
func buildAttributedString(text: String, cardNames: Set<String>) -> AttributedString
```

### Update: `Views/MessageBubbleView.swift`

- Replace plain `Text(message.content)` in judge bubbles with `LinkedTextView`
- Pass `viewModel.lookedUpCards` keys as the set of linkable names
- On card name tap → set `selectedCard` → sheet presents `CardDetailView`

### Verification
- Ask "What does Ragavan, Nimble Pilferer do?" — "Ragavan, Nimble Pilferer" appears underlined/highlighted in the response
- Tap it → card detail sheet with art, oracle text, and legalities opens

---

## Phase 7 — Polish, Error Handling & Edge Cases

**Goal:** Make the app feel solid and handle all the ways things can go wrong.

### Error handling improvements

| Scenario | Current behavior | Target behavior |
|---|---|---|
| No network | Crash / timeout | Inline error bubble with retry button |
| Claude API error (4xx/5xx) | Crash | Error bubble with status code message |
| Rate limit (429) | Crash | "Rate limit reached. Please wait a moment." |
| Invalid API key (401) | Crash | Auto-open Settings with "Invalid API key" message |
| Scryfall card not found | Tool returns error JSON | Pass `"Card not found: [name]"` as tool result; Claude handles gracefully |
| Scryfall network error | Crash | Pass error message as tool result; Claude responds gracefully |
| Tool loop exceeds 5 iterations | Infinite loop | Break loop, return partial answer with a note |

### UX polish

- **Keyboard handling:** Ensure input bar lifts above keyboard properly on all iPhone sizes (`.ignoresSafeArea(.keyboard)` on scroll area only)
- **Haptics:** Light impact feedback on message send (`UIImpactFeedbackGenerator`)
- **Copy to clipboard:** Long-press on any judge bubble → context menu with "Copy" option
- **Input clear button:** Small ✕ button inside the input field when text is present
- **Empty send guard:** Already handled, but double-check edge case of whitespace-only input
- **Loading state:** Disable input and send button while `isLoading` (already implemented, verify visually)
- **Safe area:** Verify layout on devices with Dynamic Island and home indicator

### Code quality

- Extract `APIMessage` and related Codable types into `Models/APIMessage.swift`
- Add `// MARK:` section separators to all files longer than ~60 lines
- Remove the Phase 2 `// TODO Phase 5` comment from `ClaudeService`
- Run through all `try?` usages and make sure errors are surfaced rather than silently dropped

### Final verification checklist

- [ ] Ask a simple rules question → correct Claude answer citing CR
- [ ] Ask a card-specific question → tool use fires, card detail tappable in answer
- [ ] Ask a multi-card interaction question → multiple tool calls, coherent answer
- [ ] Ask a follow-up question → prior context referenced correctly
- [ ] Kill app mid-session → conversation gone (ephemeral confirmed)
- [ ] Tap "New Session" → confirmation alert → chat cleared
- [ ] Delete API key → SettingsView opens automatically
- [ ] Enter wrong API key → clear error message, Settings re-prompts
- [ ] Turn off WiFi → send question → network error bubble appears
- [ ] Tap card name in answer → detail sheet with art opens
- [ ] Test on iPhone SE (small screen) and iPhone Pro Max (large screen)
