export function chatHref(conversationId: string) {
  return `/chats?c=${encodeURIComponent(conversationId)}`;
}