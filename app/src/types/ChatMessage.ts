export type MessageRole = 'user' | 'judge';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isError?: boolean;
}

// Internal API-only message types (never rendered directly in the UI)
export interface ToolUseMessage {
  id: string;
  role: 'tool_use';
  toolUseId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
}

export interface ToolResultMessage {
  id: string;
  role: 'tool_result';
  toolUseId: string;
  content: string;
}

export type SessionMessage = ChatMessage | ToolUseMessage | ToolResultMessage;
