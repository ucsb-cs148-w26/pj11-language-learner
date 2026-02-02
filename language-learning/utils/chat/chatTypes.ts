export type UUID = string;

export type Conversation = {
  id: UUID;
  created_at: string;
  last_message_at: string | null;
  last_message_text: string | null;
};

export type Message = {
  id: UUID;
  conversation_id: UUID;
  sender_id: UUID;
  body: string;
  created_at: string;
};
