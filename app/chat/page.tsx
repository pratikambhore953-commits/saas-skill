"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import BookSessionModal from "@/components/BookSessionModal";
import {
  ChatConversation,
  ChatMessage,
  PublicUserSkill,
  getChatConversations,
  getChatMessages,
  getPublicUserProfile,
} from "@/lib/api";
const PAGE_SIZE = 50;

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageSkeleton />}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { socket, connected, onlineUsers, setUnreadCount } = useSocket();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSkills, setBookingSkills] = useState<PublicUserSkill[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?next=/chat");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const initialConversationId = searchParams.get("conversation");
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
      setMobileView("chat");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadConversations = async () => {
      try {
        setError(null);
        const nextConversations = await getChatConversations();
        setConversations(nextConversations);
        setUnreadCount(nextConversations.reduce((sum, c) => sum + c.unreadCount, 0));

        if (!selectedConversationId && nextConversations.length > 0) {
          setSelectedConversationId(nextConversations[0].id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load conversations";
        setError(message);
        toast.error(message);
      } finally {
        setLoadingConversations(false);
      }
    };

    void loadConversations();
  }, [isAuthenticated, selectedConversationId, setUnreadCount]);

  useEffect(() => {
    if (!selectedConversationId || !isAuthenticated) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const nextMessages = await getChatMessages(selectedConversationId, 1, PAGE_SIZE);
        setMessages(nextMessages);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === selectedConversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );

        socket?.emit("join_conversation", { conversationId: selectedConversationId });
        socket?.emit("mark_read", { conversationId: selectedConversationId });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load messages";
        setError(message);
        toast.error(message);
      } finally {
        setLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [selectedConversationId, isAuthenticated, socket]);

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (incoming: ChatMessage) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === incoming.conversation_id
            ? {
                ...conversation,
                lastMessage: {
                  id: incoming.id,
                  content: incoming.content,
                  created_at: incoming.created_at,
                  sender_id: incoming.sender_id,
                },
                unreadCount:
                  incoming.conversation_id === selectedConversationId
                    ? 0
                    : conversation.unreadCount + 1,
              }
            : conversation,
        ),
      );

      if (incoming.conversation_id === selectedConversationId) {
        setMessages((prev) => [...prev, incoming]);
        socket.emit("mark_read", { conversationId: selectedConversationId });
      }
    };

    const onMessageNotification = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === selectedConversationId) return;
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: conversation.unreadCount + 1 }
            : conversation,
        ),
      );
    };

    socket.on("new_message", onNewMessage);
    socket.on("message_notification", onMessageNotification);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("message_notification", onMessageNotification);
    };
  }, [socket, selectedConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations;
    const value = query.trim().toLowerCase();
    return conversations.filter((conversation) =>
      conversation.otherUser.name.toLowerCase().includes(value),
    );
  }, [query, conversations]);

  const openBookSession = async () => {
    if (!selectedConversation) return;

    try {
      setBookingLoading(true);
      setError(null);
      const profile = await getPublicUserProfile(selectedConversation.otherUser.id);
      const offeredSkills = profile.skills.filter((skill) => skill.is_offering);
      if (offeredSkills.length === 0) {
        throw new Error("This user has no offered skills available for booking");
      }
      setBookingSkills(offeredSkills);
      setBookingOpen(true);
    } catch (bookingError) {
      const message = bookingError instanceof Error ? bookingError.message : "Unable to open booking";
      setError(message);
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!socket || !selectedConversationId || !user) return;

    const content = text.trim();
    if (!content) return;

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content,
      read: true,
      created_at: new Date().toISOString(),
      sender: { id: user.id, name: user.name, avatar_url: null },
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");

    socket.emit(
      "send_message",
      { conversationId: selectedConversationId, content },
      (result: { ok: boolean; message?: string }) => {
        if (!result.ok) {
          const message = result.message ?? "Failed to send message";
          setError(message);
          toast.error(message);
        }
      },
    );
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 text-slate-300">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
      <aside
        className={`w-full border-r border-slate-700 bg-slate-800/70 p-4 md:w-[300px] ${
          mobileView === "chat" ? "hidden md:block" : "block"
        }`}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Messages</h1>
          <span className={`text-xs ${connected ? "text-emerald-400" : "text-slate-400"}`}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <input
          className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          placeholder="Search conversations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {loadingConversations ? (
          <p className="mt-4 text-sm text-slate-400">Loading conversations...</p>
        ) : filteredConversations.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No conversations found.</p>
        ) : (
          <div className="mt-4 space-y-2 overflow-y-auto pr-1">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  setSelectedConversationId(conversation.id);
                  setMobileView("chat");
                }}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  conversation.id === selectedConversationId
                    ? "border-slate-600 bg-slate-700"
                    : "border-transparent bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600 text-sm font-semibold text-white">
                    {getInitials(conversation.otherUser.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">{conversation.otherUser.name}</p>
                      {conversation.lastMessage && (
                        <span className="text-xs text-slate-400">{formatTime(conversation.lastMessage.created_at)}</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-300">
                      {conversation.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-semibold text-black">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section
        className={`flex flex-1 flex-col bg-slate-900 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}
      >
        {!selectedConversation ? (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 text-slate-200 md:hidden"
                  aria-label="Back to conversation list"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M15 18 9 12l6-6" />
                  </svg>
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
                  {selectedConversation ? getInitials(selectedConversation.otherUser.name) : "--"}
                </div>
                <div>
                  <p className="font-semibold text-white">{selectedConversation?.otherUser.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        selectedConversation && onlineUsers.includes(selectedConversation.otherUser.id)
                          ? "bg-emerald-400"
                          : "bg-slate-500"
                      }`}
                    />
                    <span>
                      {selectedConversation && onlineUsers.includes(selectedConversation.otherUser.id)
                        ? "Online"
                        : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={openBookSession}
                disabled={bookingLoading}
                className="rounded-lg border border-amber-500/60 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-amber-300 transition hover:bg-slate-700 disabled:opacity-70"
              >
                {bookingLoading ? "Loading..." : "Book Session"}
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loadingMessages ? (
                <p className="text-sm text-slate-400">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-400">No messages yet. Say hello.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const mine = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-xl px-3 py-2 ${
                            mine ? "bg-amber-500 text-black" : "bg-slate-700 text-white"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`mt-1 text-[11px] ${mine ? "text-black/70" : "text-slate-300"}`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="border-t border-slate-700 p-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}

        {error && (
          <div className="border-t border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">{error}</div>
        )}
      </section>

      {selectedConversation && (
        <BookSessionModal
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          teacherId={selectedConversation.otherUser.id}
          teacherName={selectedConversation.otherUser.name}
          skills={bookingSkills}
        />
      )}
    </div>
  );
}

function ChatPageSkeleton() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 text-slate-300">
      Loading chat...
    </div>
  );
}
