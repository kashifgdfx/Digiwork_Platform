'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { MessagesSkeleton } from '@/components/skeletons/MessagesSkeleton';
import { ConversationListSkeleton } from '@/components/skeletons/ConversationListSkeleton';
import {
  ArrowLeft,
  CheckCheck,
  ExternalLink,
  FileUp,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

function MessagesContent() {
  const searchParams = useSearchParams();
  const urlConvId = searchParams.get('conversationId');

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
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string>(
    urlConvId || (conversations.length > 0 ? conversations[0].id : '')
  );
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachmentNotice, setShowAttachmentNotice] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const urlConversationExists = Boolean(
    urlConvId && conversations.some((conversation) => conversation.id === urlConvId)
  );
  const selectedConvId = urlConversationExists
    ? urlConvId
    : activeConvId || conversations[0]?.id || '';
  const activeConv = conversations.find((c) => c.id === selectedConvId);
  const activeMessages = selectedConvId ? messages[selectedConvId] || [] : [];
  const isChatView = mobileView === 'chat' || urlConversationExists;

  useEffect(() => {
    if (!currentUser) return;
    loadConversations(currentUser.id).catch(() => undefined);
  }, [currentUser]);

  // Scroll only the chat container to bottom (Fixes page jumping issue)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedConvId, activeMessages.length]);

  useEffect(() => {
    if (!selectedConvId) return;
    loadMessages(selectedConvId).catch(() => undefined);
    markConversationAsRead(selectedConvId);
  }, [selectedConvId]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    (c.participant?.name || 'Unknown user').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConvId || messagingLoading) return;

    try {
      await sendMessage(selectedConvId, inputText);
      setInputText('');
    } catch {
      // The context exposes the API error for the page to render.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-6rem)] min-h-[600px] flex flex-col font-sans">
      <div className="bg-white border border-slate-200/85 rounded-3xl shadow-xl shadow-slate-100 flex-1 flex overflow-hidden backdrop-blur-xl">

        {/* Left Column: Conversations Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/60 ${
            isChatView ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Inbox Header */}
          <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#1dbf73]">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 text-base">Messages</h1>
                  <p className="text-[11px] text-slate-400">Manage your client communications</p>
                </div>
              </div>
              <span className="inline-flex items-center justify-center w-16 h-6 text-[11px] font-bold bg-[#1dbf73] text-white rounded-full">
                {conversations.length} Active
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
              const isSelected = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setMobileView('chat');
                  }}
                  className={`w-full text-left p-4 flex items-start gap-3.5 transition-all relative ${
                    isSelected
                      ? 'bg-emerald-50/60 shadow-inner'
                      : 'hover:bg-slate-100/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1dbf73] rounded-r-full" />
                  )}

                  <div className="relative shrink-0">
                    {conv.participant?.avatar ? (
                      <img
                        src={conv.participant.avatar}
                        alt={conv.participant.name || 'Unknown user'}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-xs">
                        {(conv.participant?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-2xs" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {conv.participant?.name || 'Unknown user'}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 shrink-0">
                        {conv.lastMessageTimestamp}
                      </span>
                    </div>

                    {conv.gigTitle && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md truncate block mb-1.5 border border-emerald-200/30">
                        {conv.gigTitle}
                      </span>
                    )}

                    <p className="text-xs text-slate-500 truncate leading-relaxed font-normal">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}

            {conversations.length === 0 && !messagingLoading && (
              <div className="p-8 text-center text-xs text-slate-400">
                No conversations yet. Contact a seller from a gig page to start one.
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
          className={`flex-1 flex flex-col bg-white ${
            isChatView ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="relative">
                    {activeConv.participant?.avatar ? (
                      <img
                        src={activeConv.participant.avatar}
                        alt={activeConv.participant.name || 'Unknown user'}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-sm">
                        {(activeConv.participant?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {activeConv.participant?.name || 'Unknown user'}
                      </h3>
                      {activeConv.participant?.level && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60">
                          {activeConv.participant.level}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online • Response time: {activeConv.participant.responseTime || '1 hour'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activeConv.gigId && (
                    <Link
                      href={`/gigs/${activeConv.gigId}`}
                      className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-emerald-50/60 text-slate-700 hover:text-[#1dbf73] border border-slate-200/70 rounded-xl text-xs font-semibold transition-all shadow-2xs"
                    >
                      <span className="truncate max-w-[160px]">{activeConv.gigTitle}</span>
                      <ExternalLink size={13} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Message Stream with ref attached */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50/80 border border-amber-200/60 text-amber-800 text-[11px] font-semibold rounded-full shadow-2xs backdrop-blur-xs">
                    <ShieldCheck size={13} className="text-amber-600" />
                    <span>To protect your payment, always communicate and transact directly on platform.</span>
                  </div>
                </div>

                {activeMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      <div
                        className={`max-w-md sm:max-w-lg px-4.5 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                          isMe
                            ? 'bg-[#1dbf73] text-white rounded-br-xs shadow-emerald-500/10'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 px-1 font-medium">
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          <>
                            {msg.status === 'seen' ? (
                              <CheckCheck size={13} className="text-[#1dbf73]" />
                            ) : (
                              <CheckCheck size={13} className="text-slate-400" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Attachment Toast */}
              {showAttachmentNotice && (
                <div className="mx-6 my-2 p-3 bg-blue-50/90 border border-blue-200 text-blue-700 text-xs rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
                  <FileUp size={15} />
                  <span className="font-medium">File attachment simulated: Project_Specs_Draft.pdf attached.</span>
                </div>
              )}

              {/* Quick Canned Replies */}
              <div className="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Suggestions:</span>
                {[
                  'Can you provide a progress update?',
                  'Looks fantastic, thank you!',
                  'When can I expect the next draft?',
                  'I have uploaded the requested assets.',
                ].map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => handleCannedReply(pill)}
                    className="px-3 py-1.5 bg-slate-100/80 hover:bg-emerald-50 hover:text-[#1dbf73] hover:border-emerald-200 text-slate-600 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all border border-slate-200/60 shadow-2xs"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAttachment}
                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/60"
                    title="Attach file"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    placeholder={`Message ${activeConv.participant?.name || 'this user'}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50/80 border border-slate-200/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all shadow-2xs"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || messagingLoading}
                    className="px-5 py-3 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none flex items-center gap-2"
                  >
                    <span>{messagingLoading ? 'Sending...' : 'Send'}</span>
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
              <h3 className="text-base font-bold text-slate-800">No Conversation Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Choose a conversation from the sidebar or contact a user directly to start messaging.
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