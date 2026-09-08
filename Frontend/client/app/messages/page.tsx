'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
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
    messagingLoading,
    messagingError,
  } = useApp();
  const [activeConvId, setActiveConvId] = useState<string>(
    urlConvId || (conversations.length > 0 ? conversations[0].id : '')
  );
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachmentNotice, setShowAttachmentNotice] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId, messages]);

  useEffect(() => {
    if (!selectedConvId) return;

    loadMessages(selectedConvId).catch(() => undefined);

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

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-8rem)] min-h-[600px] flex flex-col">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-md flex-1 flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-gray-50/50 ${
                    isChatView ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Inbox Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-[#1dbf73]" />
                <h1 className="font-extrabold text-gray-900 text-lg">Inbox</h1>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-[#1dbf73] rounded-full border border-emerald-200">
                {conversations.length} Active
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#1dbf73] focus:bg-white"
              />
            </div>
          </div>

          {/* Conversations Threads */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {messagingError && (
              <div className="p-4 text-center text-xs text-red-500 bg-red-50 border-b border-red-100">
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
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/70 border-l-4 border-[#1dbf73]'
                      : 'hover:bg-gray-100/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    {conv.participant?.avatar ? (
                      <img
                        src={conv.participant.avatar}
                        alt={conv.participant.name || 'Unknown user'}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold ring-2 ring-white">
                        {(conv.participant?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {conv.participant?.name || 'Unknown user'}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {conv.lastMessageTimestamp}
                      </span>
                    </div>

                    {conv.gigTitle && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded truncate block mb-1">
                        {conv.gigTitle}
                      </span>
                    )}

                    <p className="text-xs text-gray-500 truncate leading-relaxed">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}

            {conversations.length === 0 && !messagingLoading && (
              <div className="p-8 text-center text-xs text-gray-400">
                No conversations yet. Contact a seller from a gig page to start one.
              </div>
            )}

            {conversations.length > 0 && filteredConversations.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">
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
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1 text-gray-500 hover:text-gray-900"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="relative">
                    {activeConv.participant?.avatar ? (
                      <img
                        src={activeConv.participant.avatar}
                        alt={activeConv.participant.name || 'Unknown user'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {(activeConv.participant?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">
                        {activeConv.participant?.name || 'Unknown user'}
                      </h3>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {activeConv.participant.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Online • Avg. response time: {activeConv.participant.responseTime || '1 hour'}
                    </p>
                  </div>
                </div>

                {/* Linked Gig Pill */}
                {activeConv.gigId && (
                  <Link
                    href={`/gigs/${activeConv.gigId}`}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-[#1dbf73] border border-gray-200 rounded-full text-xs font-semibold transition-colors"
                  >
                    <span className="truncate max-w-[180px]">{activeConv.gigTitle}</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/40">
                {/* Security reminder pill */}
                <div className="text-center my-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-full">
                    <Sparkles size={12} className="text-[#1dbf73]" />
                    <span>To protect your payment, always communicate and transact directly on Fiverr.</span>
                  </span>
                </div>

                {activeMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md sm:max-w-lg px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-[#1dbf73] text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 px-1">
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck size={12} className="text-[#1dbf73]" />}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Toast */}
              {showAttachmentNotice && (
                <div className="mx-4 my-1 p-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
                  <FileUp size={14} />
                  <span>File attachment simulated: Project_Specs_Draft.pdf attached.</span>
                </div>
              )}

              {/* Quick Canned Replies */}
              <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] font-semibold text-gray-400 shrink-0">Quick reply:</span>
                {[
                  'Can you provide a progress update?',
                  'Looks fantastic, thank you!',
                  'When can I expect the next draft?',
                  'I have uploaded the requested assets.',
                ].map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => handleCannedReply(pill)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-[#1dbf73] text-gray-600 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border border-gray-200"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAttachment}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Attach file"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    placeholder={`Message ${activeConv.participant?.name || 'this user'}... (Press Enter to send)`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#1dbf73] focus:bg-white"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="px-4 py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <span>{messagingLoading ? 'Sending...' : 'Send'}</span>
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-3">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-700">No Conversation Selected</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Choose a conversation from the left sidebar or contact a seller directly from any gig page.
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
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
