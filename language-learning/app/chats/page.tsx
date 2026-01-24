import Link from "next/link";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: Brand + Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-semibold">
                L
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-gray-900">Language Learner</div>
                <div className="text-xs text-gray-500">Chat</div>
              </div>
            </div>

            <nav className="hidden sm:flex items-center gap-1 rounded-xl bg-gray-100 p-1">
              <Link
                href="/profile"
                className="px-3 py-1.5 text-sm rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition"
              >
                Profile
              </Link>
              <Link
                href="/connections"
                className="px-3 py-1.5 text-sm rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition"
              >
                Connections
              </Link>
              <Link
                href="/discover"
                className="px-3 py-1.5 text-sm rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition"
              >
                Discover
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition"
              >
                Dashboard
              </Link>

              {/* Current page indicator (Chat) */}
              <span className="px-3 py-1.5 text-sm rounded-lg bg-white shadow-sm text-gray-900 font-medium">
                Chat
              </span>
            </nav>
          </div>

          {/* Right: Search + Button */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-600 w-64">
              <span className="select-none">⌘</span>
              <input
                className="w-full outline-none placeholder:text-gray-400"
                placeholder="Search chats..."
              />
            </div>

            <button className="rounded-xl bg-gray-900 text-white text-sm px-4 py-2 hover:bg-gray-800 transition">
              New Chat
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden mx-auto max-w-5xl px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            <Link
              href="/profile"
              className="shrink-0 px-3 py-2 text-sm rounded-xl bg-white border text-gray-700"
            >
              Profile
            </Link>
            <Link
              href="/connections"
              className="shrink-0 px-3 py-2 text-sm rounded-xl bg-white border text-gray-700"
            >
              Connections
            </Link>
            <Link
              href="/discover"
              className="shrink-0 px-3 py-2 text-sm rounded-xl bg-white border text-gray-700"
            >
              Discover
            </Link>
            <Link
              href="/dashboard"
              className="shrink-0 px-3 py-2 text-sm rounded-xl bg-white border text-gray-700"
            >
              Dashboard
            </Link>
            <span className="shrink-0 px-3 py-2 text-sm rounded-xl bg-gray-900 text-white">
              Chat
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Chat</h1>
          <p className="text-sm text-gray-600 mt-1">
            Messages and connections will appear here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: Chat list */}
          <section className="md:col-span-1 rounded-2xl border bg-white shadow-sm">
            <div className="p-4 border-b">
              <div className="text-sm font-medium text-gray-900">Conversations</div>
              <div className="text-xs text-gray-500 mt-1">Select a chat to start messaging</div>
            </div>
            <div className="p-2 space-y-2">
              {/* Placeholder items */}
              {["Annie", "Jovia", "Natalie"].map((name) => (
                <button
                  key={name}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        Last message preview will go here...
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Right: Chat window */}
          <section className="md:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Chat Window</div>
                <div className="text-xs text-gray-500">Pick a conversation to view messages</div>
              </div>
              <button className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 transition">
                Details
              </button>
            </div>

            {/* Message area */}
            <div className="p-4 h-[360px] overflow-auto bg-gray-50">
              <div className="text-sm text-gray-500">
                Waiting to put some chat messages and information…
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Type a message..."
                />
                <button className="rounded-xl bg-gray-900 text-white text-sm px-4 py-2 hover:bg-gray-800 transition">
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}