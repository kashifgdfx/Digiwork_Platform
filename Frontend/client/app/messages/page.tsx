"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useApp } from "@/context/AppContext";
import { MessagesSkeleton } from "@/components/skeletons/MessagesSkeleton";
import { socketService } from "@/lib/socket";
import { getAuthToken } from "@/lib/api";
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
  Pencil,
  Trash2,
  X,
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
    setMessages,
  } = useApp() as any;

  const [activeConvId, setActiveConvId] = useState<string>(
    urlConvId || (conversations.length > 0 ? conversations[0].id : ""),
  );
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAttachmentNotice, setShowAttachmentNotice] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [messageActionError, setMessageActionError] = useState("");

  // Edit & Delete States
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const urlConversationExists = Boolean(
    urlConvId &&
    conversations.some((conversation: any) => conversation.id === urlConvId),
  );
  const selectedConvId = urlConversationExists
    ? urlConvId
    : activeConvId || conversations[0]?.id || "";
  const activeConv = conversations.find((c: any) => c.id === selectedConvId);
  const activeMessages = selectedConvId ? messages[selectedConvId] || [] : [];
  const uniqueActiveMessages = activeMessages.filter(
    (message: any, index: number) =>
      activeMessages.findIndex((item: any) => item.id === message.id) === index,
  );

  // Typing indicator states
  const [showTyping, setShowTyping] = useState(false);
  const typingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingEmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Socket setup for joining room, receiving new messages, edits & deletions
  useEffect(() => {
    if (!currentUser?.id || !selectedConvId) return;
    const socket = socketService.getSocket()
      || socketService.connect(currentUser.id, getAuthToken() || undefined);
    const joinSelectedConversation = () => {
      setMessageActionError("");
      socket.emit("join-conversation", { conversationId: selectedConvId });
    };
    const handleConnectionError = () => {
      setMessageActionError("Live messaging is disconnected. Please check your connection and try again.");
    };
    if (socket.connected) joinSelectedConversation();
    socket.on("connect", joinSelectedConversation);
    socket.on("connect_error", handleConnectionError);

    const handleNewMessage = (data: any) => {
      if (data?.message && data.message.conversationId === selectedConvId) {
        // Handled by context
      }
    };

    const handleMessageEdited = (updatedMessage: any) => {
      const messageId = updatedMessage?.messageId || updatedMessage?.id;
      if (!messageId || updatedMessage?.conversationId !== selectedConvId) return;
      setMessageActionError("");

      setMessages?.((prev: any) => {
        const conversationMessages = prev?.[selectedConvId];
        if (!Array.isArray(conversationMessages)) return prev;
        return {
          ...prev,
          [selectedConvId]: conversationMessages.map((msg: any) =>
            msg.id === messageId
              ? { ...msg, text: updatedMessage.newText ?? updatedMessage.text, isEdited: true }
              : msg,
          ),
        };
      });
    };

    const handleMessageDeleted = (deletedData: any) => {
      const messageId = deletedData?.messageId || deletedData?.id;
      if (!messageId || deletedData?.conversationId !== selectedConvId) return;
      setMessageActionError("");

      setMessages?.((prev: any) => {
        const conversationMessages = prev?.[selectedConvId];
        if (!Array.isArray(conversationMessages)) return prev;
        return {
          ...prev,
          [selectedConvId]: conversationMessages.map((msg: any) =>
            msg.id === messageId
              ? { ...msg, text: deletedData.text || "This message was deleted", isDeleted: true }
              : msg,
          ),
        };
      });
    };

    const handleMessageError = (payload: { message?: string }) => {
      setMessageActionError(payload?.message || "Message action failed. Please try again.");
      if (selectedConvId) loadMessages(selectedConvId).catch(() => undefined);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message:edited", handleMessageEdited);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("message:error", handleMessageError);

    return () => {
      socket.off("connect", joinSelectedConversation);
      socket.off("connect_error", handleConnectionError);
      socket.off("new_message", handleNewMessage);
      socket.off("message:edited", handleMessageEdited);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("message:error", handleMessageError);
    };
  }, [currentUser?.id, selectedConvId, setMessages]);

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

  const isChatView = mobileView === "chat" || urlConversationExists;

  useEffect(() => {
    if (!currentUser) return;
    loadConversations(currentUser.id).catch(() => undefined);
  }, [currentUser]);

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

  const filteredConversations = conversations.filter(
    (c: any) =>
      (c.participant?.name || "Unknown user")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (c.lastMessage || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || !selectedConvId || messagingLoading) return;

    if (isTypingRef.current && selectedConvId && receiverId) {
      notifyTyping(selectedConvId, receiverId, false);
      isTypingRef.current = false;
    }

    setInputText("");

    try {
      await sendMessage(selectedConvId, textToSend);
    } catch {
      // Error handled by context
    }
  };

  // Edit Message Handler
  const handleSaveEdit = (msgId: string) => {
    if (!editText.trim()) return;
    if (!selectedConvId || !currentUser?.id) return;
    const socket = socketService.getSocket()
      || socketService.connect(currentUser.id, getAuthToken() || undefined);
    setMessageActionError("");
    socket.emit("message:edit", { messageId: msgId, newText: editText.trim(), conversationId: selectedConvId });
    setMessages?.((prev: any) => {
      const conversationMessages = prev?.[selectedConvId];
      if (!Array.isArray(conversationMessages)) return prev;
      return {
        ...prev,
        [selectedConvId]: conversationMessages.map((msg: any) =>
          msg.id === msgId ? { ...msg, text: editText.trim(), isEdited: true } : msg,
        ),
      };
    });
    setEditingMessageId(null);
    setEditText("");
  };

  // Delete Message Handler
  const handleDeleteMessage = (msgId: string) => {
    if (!selectedConvId || !currentUser?.id) return;
    const socket = socketService.getSocket()
      || socketService.connect(currentUser.id, getAuthToken() || undefined);
    setMessageActionError("");
    socket.emit("message:delete", { messageId: msgId, conversationId: selectedConvId });
    setMessages?.((prev: any) => {
      const conversationMessages = prev?.[selectedConvId];
      if (!Array.isArray(conversationMessages)) return prev;
      return {
        ...prev,
        [selectedConvId]: conversationMessages.map((msg: any) =>
          msg.id === msgId
            ? { ...msg, text: "This message was deleted", isDeleted: true }
            : msg,
        ),
      };
    });
  };

  const handleCannedReply = async (text: string) => {
    if (!selectedConvId || messagingLoading) return;
    try {
      await sendMessage(selectedConvId, text);
    } catch {
      // Error handled by context
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

  if (!currentUser) return <MessagesSkeleton />;

  if (conversationsLoading && conversations.length === 0) {
    return <ConversationListSkeleton />;
  }

  if (messagesLoading && selectedConvId && !activeMessages.length) {
    return <MessagesSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-6 h-[calc(100vh-6rem)] sm:h-[calc(100vh-6rem)] min-h-[500px] flex flex-col font-sans">
      <div className="bg-white border border-slate-200/85 sm:rounded-3xl shadow-xl shadow-slate-100 flex-1 flex overflow-hidden backdrop-blur-xl w-full">
        {/* Left Column: Conversations Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/60 shrink-0 ${
            isChatView ? "hidden md:flex" : "flex"
          }`}
        >
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

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/65 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {messagingError && (
              <div className="p-4 text-center text-xs text-rose-500 bg-rose-50/50 border-b border-rose-100">
                {messagingError}
              </div>
            )}

            {filteredConversations.map((conv: any) => {
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

              {/* Message Stream */}
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

                {uniqueActiveMessages.map((msg: any) => {
                  const isMe = msg.senderId === currentUser.id;
                  const isBeingEdited = editingMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} group relative`}
                    >
                      <div className="flex items-center gap-2 max-w-[85%] sm:max-w-md lg:max-w-lg">
                        {isMe && !msg.isDeleted && !isBeingEdited && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-slate-200 shadow-xs rounded-lg px-1.5 py-0.5">
                            <button
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditText(msg.text);
                              }}
                              className="text-slate-500 hover:text-[#1dbf73] p-1"
                              title="Edit message"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-slate-500 hover:text-rose-600 p-1"
                              title="Delete message"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}

                        <div
                          className={`px-4 py-2.5 sm:px-4.5 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all break-words ${
                            isMe
                              ? "bg-[#1dbf73] text-white rounded-br-xs shadow-emerald-500/10"
                              : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                          }`}
                        >
                          {isBeingEdited ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-2 py-1 bg-white text-slate-900 rounded text-xs border border-slate-300 focus:outline-none"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px]"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.text}
                              {msg.isEdited && (
                                <span className="text-[10px] opacity-75 ml-1.5 italic">
                                  (edited)
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 px-1 font-medium">
                        <span>{msg.timestamp || formatMessageTime(msg.createdAt)}</span>
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

              {messageActionError && (
                <p className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700" role="alert">
                  {messageActionError}
                </p>
              )}

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
