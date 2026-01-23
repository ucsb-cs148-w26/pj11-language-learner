import ChatLayout from "@/components/chat/ChatLayout";

// STATUS: This page is just for demonstration purposes.
// It shows how the chat components can be used together to form a chat page.

export default function Chat() {
  return (
    <main className="h-screen bg-zinc-50 p-6">
      <div className="mx-auto h-full max-w-4xl">
        <ChatLayout
          partnerId="jane-doe"
          partnerFirstName="Jane"
          partnerLastName="Doe"
          partnerAvatarUrl="/globe.svg"
          language="English"
          messages={[
            { id: "1", sender: "partner", text: "Hey!", sentAt: new Date(Date.now() - 1567 * 60_000).toISOString() },
            { id: "2", sender: "me", text: "Hi!", sentAt: new Date(Date.now() - 60 * 60_000).toISOString() },
            { id: "3", sender: "partner", text: "Can we practice our English?", sentAt: new Date(Date.now() - 32 * 60_000).toISOString() },
            { id: "4", sender: "me", text: "Yes.", sentAt: new Date(Date.now() - 16 * 60_000).toISOString() },
            { id: "5", sender: "me", text: "Where is the library?", sentAt: new Date(Date.now() - 16 * 60_000).toISOString() },
            { id: "6", sender: "partner", text: "The library is in the middle of the campus.", sentAt: new Date(Date.now() - 7 * 60_000).toISOString() },
            { id: "7", sender: "me", text: "I agree.", sentAt: new Date(Date.now() - 4 * 60_000).toISOString() },
            { id: "8", sender: "partner", text: "I am happy, because we share this feeling.", sentAt: new Date(Date.now() - 3 * 60_000).toISOString() },
            { id: "9", sender: "me", text: "What is your favorite food?", sentAt: new Date(Date.now() + 3 * 60_000).toISOString() },
            { id: "10", sender: "me", text: "Good night.", sentAt: new Date(Date.now() + 115 * 60_000).toISOString() },
          ]}
        />
      </div>
    </main>
  );
}
