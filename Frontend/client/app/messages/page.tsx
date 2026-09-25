"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useApp } from "@/context/AppContext";
import { MessagesSkeleton } from "@/components/skeletons/MessagesSkeleton";
import { socketService } from "@/lib/socket";
import { ConversationListSkeleton } from "@/components/skeletons/ConversationListSkeleton";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ExternalLink,
  FileUp,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";

function MessagesContent() {
  const searchParams = useSearchParams();
  const urlConvId = searchParams.get("conversationId");

  const {
    conversations,
    messages,
    sendMessage,
    currentUser,
    loadMessages,
    loadConversations,
    markConversationAsRead,
    messagingLoading,
    messagingError,
    conversationsLoading,
    messagesLoading,
    typingUsers,
    notifyTyping,
    userPresence,
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string>(
    urlConvId || (conversations.length > 0 ? conversations[0].id : ""),
  );
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAttachmentNotice, setShowAttachmentNotice] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const urlConversationExists = Boolean(
    urlConvId &&
    conversations.some((conversation) => conversation.id === urlConvId),
  );
  const selectedConvId = urlConversationExists
    ? urlConvId
    : activeConvId || conversations[0]?.id || "";
  const activeConv = conversations.find((c) => c.id === selectedConvId);
  const activeMessages = selectedConvId ? messages[selectedConvId] || [] : [];
  const uniqueActiveMessages = activeMessages.filter(
    (message, index) =>
      activeMessages.findIndex((item) => item.id === message.id) === index,
  );

  // Typing indicator (auto hides 1500ms after the last typing event).
  const [showTyping, setShowTyping] = useState(false);
  const typingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingEmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // 👇 Yeh useEffect apne MessagesContent component ke andar add karein
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !selectedConvId) return;

    // 1. Backend ke mutabiq conversation room join karo
    socket.emit("join-conversation", { conversationId: selectedConvId });

    // 2. Real-time incoming message listen karo
    const handleNewMessage = (data: any) => {
      if (data?.message && data.message.conversationId === selectedConvId) {
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedConvId]);

  useEffect(() => {
    const activeTypers = selectedConvId
      ? (typingUsers[selectedConvId] || []).filter(
          (id: string) => id !== currentUser?.id,
        )
      : [];

    if (activeTypers.length > 0) {
      setShowTyping(true);

      if (typingHideRef.current) {
        clearTimeout(typingHideRef.current);
      }

      typingHideRef.current = setTimeout(() => {
        setShowTyping(false);
      }, 1500);
    }

    return () => {
      if (typingHideRef.current) {
        clearTimeout(typingHideRef.current);
      }
    };
  }, [typingUsers, selectedConvId, currentUser?.id]);

  useEffect(() => {
    setShowTyping(false);
  }, [selectedConvId]);

  const receiverId = activeConv
    ? activeConv.sellerId && activeConv.sellerId !== currentUser?.id
      ? activeConv.sellerId
      : activeConv.buyerId && activeConv.buyerId !== currentUser?.id
        ? activeConv.buyerId
        : activeConv.participant?.id
    : undefined;

  const presenceFor = (participantId?: string) => {
    if (!participantId)
      return { online: false, lastSeen: null as string | null };
    const live = userPresence[participantId];
    return {
      online: live?.online ?? false,
      lastSeen: live?.lastSeen ?? null,
    };
  };

  const presenceLabel = (participantId?: string) => {
    const { online, lastSeen } = presenceFor(participantId);
    if (online) return "Online";
    if (lastSeen)
      return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: false })} ago`;
    return "Offline";
  };

  // Determine if chat view is active on mobile
  const isChatView = mobileView === "chat" || urlConversationExists;

  useEffect(() => {
    if (!currentUser) return;
    loadConversations(currentUser.id).catch(() => undefined);
  }, [currentUser]);

  // Scroll only the chat container to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [selectedConvId, activeMessages.length]);

  useEffect(() => {
    if (!selectedConvId) return;
    loadMessages(selectedConvId).catch(() => undefined);
    markConversationAsRead(selectedConvId);
  }, [selectedConvId]);

  // Filter conversations
  const filteredConversations = conversations.filter(
    (c) =>
      (c.participant?.name || "Unknown user")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (c.lastMessage || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || !selectedConvId || messagingLoading) return;

    // Stop the typing indicator before sending.
    if (isTypingRef.current && selectedConvId && receiverId) {
      notifyTyping(selectedConvId, receiverId, false);
      isTypingRef.current = false;
    }

    // Input ko turant clear kar do taaki WhatsApp jaisa fast experience mile
    setInputText("");

    try {
      await sendMessage(selectedConvId, textToSend);
    } catch {
      // Agar error aaye toh optional hai ki aap wapas text restore karna chahein ya error handle karein
      // Par abhi ke liye context khud error handle kar raha hai
    }
  };

  const handleCannedReply = async (text: string) => {
    if (!selectedConvId || messagingLoading) return;

    try {
      await sendMessage(selectedConvId, text);
    } catch {
      // The context exposes the API error for the page to render.
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (!selectedConvId || !receiverId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      notifyTyping(selectedConvId, receiverId, true);
    }

    if (typingEmitRef.current) clearTimeout(typingEmitRef.current);
    typingEmitRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        notifyTyping(selectedConvId, receiverId, false);
        isTypingRef.current = false;
      }
    }, 1200);
  };

  const handleAttachment = () => {
    setShowAttachmentNotice(true);
    setTimeout(() => setShowAttachmentNotice(false), 2500);
  };

  if (!currentUser) return <MessagesSkeleton />;

  if (conversationsLoading && conversations.length === 0) {
    return <ConversationListSkeleton />;
  }

  if (messagesLoading && selectedConvId && !activeMessages.length) {
    return <MessagesSkeleton />;
  }

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-6 h-[calc(100vh-6rem)] sm:h-[calc(100vh-6rem)] min-h-[500px] flex flex-col font-sans">
      <div className="bg-white border border-slate-200/85 sm:rounded-3xl shadow-xl shadow-slate-100 flex-1 flex overflow-hidden backdrop-blur-xl w-full">
        {/* Left Column: Conversations Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/60 shrink-0 ${
            isChatView ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Inbox Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#1dbf73] shrink-0">
                  <MessageSquare size={18} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-slate-900 text-base truncate">
                    Messages
                  </h1>
                  <p className="text-[11px] text-slate-400 truncate">
                    Manage your client communications
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center justify-center px-2.5 h-6 text-[11px] font-bold bg-[#1dbf73] text-white rounded-full shrink-0">
                {conversations.length} Active
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200/60 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Conversations Threads */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/65 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {messagingError && (
              <div className="p-4 text-center text-xs text-rose-500 bg-rose-50/50 border-b border-rose-100">
                {messagingError}
              </div>
            )}

            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setMobileView("chat");
                  }}
                  className={`w-full text-left p-3.5 sm:p-4 flex items-start gap-3 transition-all relative ${
                    isSelected
                      ? "bg-emerald-50/60 shadow-inner"
                      : "hover:bg-slate-100/50"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1dbf73] rounded-r-full" />
                  )}

                  <div className="relative shrink-0">
                    {conv.participant?.avatar ? (
                      <img
                        src={conv.participant.avatar}
                        alt={conv.participant.name || "Unknown user"}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-xs">
                        {(conv.participant?.name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full shadow-2xs ${
                        presenceFor(conv.participant?.id).online
                          ? "bg-emerald-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {conv.participant?.name || "Unknown user"}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 shrink-0">
                        {formatMessageTime(conv.lastMessageTimestamp)}
                      </span>
                    </div>

                    {conv.gigTitle && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md truncate block mb-1.5 border border-emerald-200/30">
                        {conv.gigTitle}
                      </span>
                    )}

                    <p className="text-xs text-slate-500 truncate leading-relaxed font-normal">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })}

            {conversations.length === 0 && !messagingLoading && (
              <div className="p-8 text-center text-xs text-slate-400">
                No conversations yet. Contact a seller from a gig page to start
                one.
              </div>
            )}

            {conversations.length > 0 && filteredConversations.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching conversations found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div
          className={`flex-1 flex flex-col bg-white min-w-0 ${
            isChatView ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="relative shrink-0">
                    {activeConv.participant?.avatar ? (
                      <img
                        src={activeConv.participant.avatar}
                        alt={activeConv.participant.name || "Unknown user"}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-sm">
                        {(activeConv.participant?.name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                        presenceFor(activeConv.participant?.id).online
                          ? "bg-emerald-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {activeConv.participant?.name || "Unknown user"}
                      </h3>
                      {activeConv.participant?.level && (
                        <span className="hidden xs:inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60 shrink-0">
                          {activeConv.participant.level}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          presenceFor(activeConv.participant?.id).online
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-gray-300"
                        }`}
                      />
                      <span className="truncate">
                        {presenceLabel(activeConv.participant?.id)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {activeConv.gigId && (
                    <Link
                      href={`/gigs/${activeConv.gigId}`}
                      className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-emerald-50/60 text-slate-700 hover:text-[#1dbf73] border border-slate-200/70 rounded-xl text-xs font-semibold transition-all shadow-2xs"
                    >
                      <span className="truncate max-w-[140px]">
                        {activeConv.gigTitle}
                      </span>
                      <ExternalLink size={13} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Message Stream with ref attached */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50/30 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50/80 border border-amber-200/60 text-amber-800 text-[10px] sm:text-[11px] font-semibold rounded-full shadow-2xs backdrop-blur-xs text-center">
                    <ShieldCheck
                      size={13}
                      className="text-amber-600 shrink-0"
                    />
                    <span>
                      To protect your payment, always communicate and transact
                      directly on platform.
                    </span>
                  </div>
                </div>

                {uniqueActiveMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} group`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md lg:max-w-lg px-4 py-2.5 sm:px-4.5 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all break-words ${
                          isMe
                            ? "bg-[#1dbf73] text-white rounded-br-xs shadow-emerald-500/10"
                            : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                        }`}
                      >
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 px-1 font-medium">
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          <>
                            {msg.status === "seen" ? (
                              <CheckCheck
                                size={13}
                                className="text-[#1dbf73]"
                              />
                            ) : msg.status === "delivered" ? (
                              <CheckCheck
                                size={13}
                                className="text-slate-400"
                              />
                            ) : (
                              <Check size={13} className="text-slate-400" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Typing Indicator */}
              {showTyping && (
                <div className="px-4 sm:px-6 py-2 text-[11px] font-medium text-[#1dbf73] flex items-center gap-2 bg-white border-t border-slate-100">
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1dbf73] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1dbf73] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1dbf73] animate-bounce" />
                  </span>
                  <span>
                    {activeConv.participant?.name || "User"} is typing…
                  </span>
                </div>
              )}

              {/* Attachment Toast */}
              {showAttachmentNotice && (
                <div className="mx-4 sm:mx-6 my-2 p-3 bg-blue-50/90 border border-blue-200 text-blue-700 text-xs rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
                  <FileUp size={15} className="shrink-0" />
                  <span className="font-medium truncate">
                    File attachment simulated: Project_Specs_Draft.pdf attached.
                  </span>
                </div>
              )}

              {/* Quick Canned Replies */}
              <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Suggestions:
                </span>
                {[
                  "Can you provide a progress update?",
                  "Looks fantastic, thank you!",
                  "When can I expect the next draft?",
                  "I have uploaded the requested assets.",
                ].map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => handleCannedReply(pill)}
                    className="px-3 py-1.5 bg-slate-100/80 hover:bg-emerald-50 hover:text-[#1dbf73] hover:border-emerald-200 text-slate-600 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all border border-slate-200/60 shadow-2xs shrink-0"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <div className="p-3 sm:p-5 border-t border-slate-100 bg-white">
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  {/* <button
                    type="button"
                    onClick={handleAttachment}
                    className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/60 shrink-0"
                    title="Attach file"
                  >
                    <Paperclip size={18} />
                  </button> */}

                  <input
                    type="text"
                    placeholder={`Message ${activeConv.participant?.name || "this user"}...`}
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50/80 border border-slate-200/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all shadow-2xs"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || messagingLoading}
                    className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none flex items-center gap-1.5 sm:gap-2 shrink-0"
                  >
                    <span>{messagingLoading ? "Sending..." : "Send"}</span>
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/20">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-[#1dbf73] mb-4 shadow-sm border border-emerald-100/50">
                <MessageSquare size={36} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No Conversation Selected
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Choose a conversation from the sidebar or contact a user
                directly to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesSkeleton />}>
      <MessagesContent />
    </Suspense>
  );
}
