import { supabase } from "@/lib/supabaseClient";
import { Conversation, Message } from "./chatTypes";

export async function getMyConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMessages(
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function sendMessage(
  conversationId: string,
  body: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Not authenticated");

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (error) throw error;
}

export async function startConversation(partnerId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // create conversation
  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (convoError) throw convoError;

  // add both participants
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: partnerId },
    ]);

  if (partError) throw partError;

  return convo.id;
}
