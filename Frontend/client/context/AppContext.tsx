'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Conversation,
  Gig,
  Message,
  NotificationItem,
  Order,
  OrderStatus,
  User,
  UserRole,
} from '@/types';
import {
  mockGigs,
} from '@/data/mockData';
import { apiFetch } from '@/lib/api';
import { socketService } from '@/lib/socket';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthLoading: boolean;
  profileLoading: boolean;
  gigsLoading: boolean;
  gigLoading: boolean;
  messagesLoading: boolean;
  conversationsLoading: boolean;
  ordersLoading: boolean;
  reviewsLoading: boolean;
  dashboardLoading: boolean;
  favoritesLoading: boolean;
  refreshCurrentUser: () => Promise<User | null>;
  updateCurrentUser: (user: User) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  addProfileItem: (collection: string, item: unknown) => Promise<User>;
  updateProfileItem: (collection: string, id: string, item: unknown) => Promise<User>;
  deleteProfileItem: (collection: string, id: string) => Promise<User>;
  uploadAvatar: (avatar: string) => Promise<User>;
  logout: () => Promise<void>;
  loadConversations: (userId: string) => Promise<void>;
  currentRole: UserRole;
  toggleRole: () => void;
  gigs: Gig[];
  orders: Order[];
  favorites: string[];
  toggleFavorite: (gigId: string) => void;
  isFavorite: (gigId: string) => boolean;
  addGig: (gigData: Partial<Gig>) => Gig;
  updateGig: (gigId: string, gigData: Partial<Gig>) => void;
  deleteGig: (gigId: string) => void;
  placeOrder: (gig: Gig, packageTier: 'Basic' | 'Standard' | 'Premium') => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  notifications: NotificationItem[];
  unreadMessagesCount: number;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  startConversationWithSeller: (seller: User, gig?: Gig) => Promise<string>;
  messagingLoading: boolean;
  messagingError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typingUsers: Record<string, string[]>;
  notifyTyping: (conversationId: string, receiverId: string, isTyping: boolean) => void;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  unreadNotificationsCount: number;
  userPresence: Record<string, { online: boolean; lastSeen: string | null }>;
  updateOrderFromRealtime: (order: Order) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  GIGS: 'fiverr_clone_gigs',
  FAVORITES: 'fiverr_clone_favorites',
  ROLE: 'fiverr_clone_role',
};

function normalizeUser(user: Partial<User> & { id: string; name?: string; email?: string }): User {
  const resolvedName = user.name || user.username || user.email?.split('@')[0] || 'Unknown user';

  return {
    id: user.id,
    name: resolvedName,
    username: user.username || user.email?.split('@')[0] || user.id,
    avatar: user.avatar || '',
    level: user.level || 'New Seller',
    rating: user.rating || 0,
    reviewCount: user.reviewCount || 0,
    country: user.country || '',
    memberSince: user.memberSince || '',
    responseTime: user.responseTime || '',
    bio: user.bio || '',
    languages: user.languages || [],
    phone: user.phone || '',
    headline: user.headline || '',
    state: user.state || '',
    city: user.city || '',
    timezone: user.timezone || '',
    skills: user.skills || [],
    education: user.education || [],
    certifications: user.certifications || [],
    experience: user.experience || [],
    portfolio: user.portfolio || [],
    socialLinks: user.socialLinks || {},
    sellerMetrics: user.sellerMetrics,
    profileCompletion: user.profileCompletion || { percentage: 0 },
    // Supports accounts created before the buyer/seller/admin migration.
    role: user.role === 'admin' || user.role === 'seller' ? user.role : 'buyer',
    accountStatus: user.accountStatus || 'active',
  };
}



function normalizeConversation(conversation: Conversation, fallbackParticipant?: User): Conversation {
  const payload = conversation as Conversation & {
    _id?: string;
    participant?: Partial<User>;
    seller?: Partial<User>;
    buyer?: Partial<User>;
    participantId?: string;
    participantName?: string;
    buyerId?: string;
    sellerId?: string;
  };

  const participant = payload.participant || payload.seller || payload.buyer || fallbackParticipant;
  const participantId = participant?.id || payload.participantId || payload.buyerId || payload.sellerId || 'unknown-participant';
  const participantName =
    participant?.name ||
    participant?.username ||
    participant?.email?.split('@')[0] ||
    payload.participantName ||
    'Unknown user';

  return {
    ...conversation,
    buyerId: payload.buyerId,
    sellerId: payload.sellerId,
    id: conversation.id || payload._id || `conversation-${Date.now()}`,
    participant: normalizeUser({
      ...participant,
      id: participantId,
      name: participantName,
    }),
    lastMessage: conversation.lastMessage || '',
    lastMessageTimestamp: conversation.lastMessageTimestamp || '',
    unreadCount: conversation.unreadCount || 0,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [gigsLoading, setGigsLoading] = useState(false);
  const [gigLoading, setGigLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('buyer');
  const [gigs, setGigs] = useState<Gig[]>(mockGigs);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [messagingError, setMessagingError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [userPresence, setUserPresence] = useState<Record<string, { online: boolean; lastSeen: string | null }>>({});
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  // The server emits two compatibility event names for the same notification.
  // Keep a small in-memory record so it is rendered and sounded only once.
  const processedRealtimeNotificationIds = useRef<Set<string>>(new Set());
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const notificationAudioUnlockedRef = useRef(false);
  const pendingNotificationSoundRef = useRef(false);

  const refreshCurrentUser = async (): Promise<User | null> => {
    setProfileLoading(true);
    try {
      const response = await apiFetch('/api/auth/me');
      if (!response.ok) {
        setCurrentUser(null);
        return null;
      }

      const data = await response.json();
      const user = data.user ? normalizeUser(data.user) : null;
      setCurrentUser(user);
      return user;
    } catch {
      setCurrentUser(null);
      return null;
    } finally {
      setProfileLoading(false);
      setIsAuthLoading(false);
    }
  };

  const playNotificationSound = () => {
    const audio = notificationAudioRef.current;
    if (!audio) return;

    if (!notificationAudioUnlockedRef.current) {
      pendingNotificationSoundRef.current = true;
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.error('Notification sound failed:', err);
    });
  };

  // Preload one audio instance and unlock it after the first user interaction.
  useEffect(() => {
    const audio = new Audio('/beep.wav');
    audio.preload = 'auto';
    audio.volume = 0.4;
    notificationAudioRef.current = audio;

    const unlockAudio = () => {
      if (notificationAudioUnlockedRef.current) return;
      audio.currentTime = 0;
      audio.muted = true;

audio.play()
  .then(() => {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;

    notificationAudioUnlockedRef.current = true;

    console.log("🔊 Notification audio unlocked");

    if (pendingNotificationSoundRef.current) {
      pendingNotificationSoundRef.current = false;
      playNotificationSound();
    }
  })
        .catch((err) => {
          console.error('Notification sound failed:', err);
        });
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      audio.pause();
      notificationAudioRef.current = null;
      notificationAudioUnlockedRef.current = false;
    };
  }, []);

  const triggerBrowserNotification = (senderName: string, senderAvatar: string, text: string, conversationId: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification('New Message', {
        body: `${senderName} sent you a message`,
        icon: senderAvatar || '/images/default-avatar.png',
      });

      notification.onclick = () => {
        window.focus();
        const url = `/messages?conversationId=${encodeURIComponent(conversationId)}`;
        window.location.href = url;
      };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
      socketService.disconnect();
    }
  };

  const upsertMessageIntoState = (conversationId: string, incoming: Message) => {
    setMessages((prev) => {
      const existing = prev[conversationId] || [];
      const alreadyExists = existing.some((item) => item.id === incoming.id);
      if (alreadyExists) return prev;
      return {
        ...prev,
        [conversationId]: [...existing, incoming],
      };
    });

    setConversations((prev) => prev.map((convo) =>
      convo.id === conversationId
        ? {
            ...convo,
            lastMessage: incoming.text,
            lastMessageTimestamp: incoming.timestamp,
            unreadCount: incoming.senderId === currentUser?.id ? convo.unreadCount : 0,
          }
        : convo
    ));
  };

  const loadConversations = async (userId: string) => {
    setConversationsLoading(true);
    setMessagingLoading(true);
    setMessagingError(null);

    try {
      const response = await apiFetch(`/api/conversations/${encodeURIComponent(userId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load conversations');

      const normalized = (data.conversations || []).map((conversation: Conversation) =>
        normalizeConversation(conversation)
      );
      setConversations(normalized);

      // Task 2: Seed userPresence immediately from whatever isOnline value
      // the REST response already carries — gives instant UI before socket responds.
      setUserPresence((prev) => {
        const next = { ...prev };
        for (const conv of normalized) {
          const pid = conv.participant?.id;
          if (pid && pid !== userId) {
            const apiOnline = (conv.participant as any)?.isOnline;
            if (typeof apiOnline === 'boolean' && !next[pid]) {
              next[pid] = { online: apiOnline, lastSeen: null };
            }
          }
        }
        return next;
      });

      // Task 3: Ask the socket for live presence for every participant.
      // The existing handlePresenceSnapshot listener will handle the response
      // and overwrite the seeded values with real-time data (Task 4).
      const participantIds = normalized
        .map((conv: Conversation) => conv.participant?.id)
        .filter((pid: string | undefined): pid is string => Boolean(pid) && pid !== userId);

      if (participantIds.length > 0) {
        const liveSocket = socketService.getSocket();
        if (liveSocket?.connected) {
          liveSocket.emit('presence:get', { userIds: participantIds });
        } else {
          // Socket may still be connecting — wait for it then fire.
          liveSocket?.once('connect', () => {
            liveSocket.emit('presence:get', { userIds: participantIds });
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load conversations';
      setMessagingError(message);
      throw err;
    } finally {
      setConversationsLoading(false);
      setMessagingLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    setMessagingLoading(true);
    setMessagingError(null);

    try {
      const response = await apiFetch(`/api/messages/${encodeURIComponent(conversationId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load messages');

      const nextMessages = (data.messages || []).map((message: Message) => ({
        ...message,
        isRead: message.isRead ?? true,
        status: message.status || (message.isRead ? 'seen' : 'sent'),
      }));

      setMessages((prev) => ({
        ...prev,
        [conversationId]: nextMessages,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load messages';
      setMessagingError(message);
      throw err;
    } finally {
      setMessagesLoading(false);
      setMessagingLoading(false);
    }
  };

  const markConversationAsRead = (conversationId: string) => {
    if (!conversationId || !currentUser) return;

    const unreadForConversation = conversations.find((conversation) => conversation.id === conversationId)?.unreadCount || 0;

    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((message) =>
        message.senderId !== currentUser.id
          ? { ...message, isRead: true, status: 'seen', seenAt: new Date().toISOString() }
          : message
      ),
    }));

    setConversations((prev) => prev.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
    ));

    if (unreadForConversation > 0) {
      setUnreadMessagesCount((prev) => Math.max(0, prev - unreadForConversation));
    }

    const socket = socketService.getSocket();
    socket?.emit('mark_read', { conversationId });
  };

  const refreshNotifications = async () => {
    try {
      const response = await apiFetch('/api/notifications');
      if (!response.ok) return;
      const data = await response.json();
      const list: NotificationItem[] = (data.notifications || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        link: item.link,
        meta: item.meta,
        createdAt: item.createdAt,
        read: item.read,
        isRead: item.read,
        timestamp: item.createdAt,
      }));
      setNotifications(list);
      setUnreadNotificationsCount(
        typeof data.unreadCount === 'number' ? data.unreadCount : list.filter((n) => !n.read).length
      );
    } catch {
      // Bell simply stays as-is on network error.
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true, isRead: true } : item))
    );
    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    apiFetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PATCH' }).catch(
      () => undefined
    );
  };

  const clearNotifications = () => {
    setUnreadNotificationsCount(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true, isRead: true })));
    apiFetch('/api/notifications/read-all', { method: 'PATCH' }).catch(() => undefined);
  };

  const notifyTyping = (conversationId: string, receiverId: string, isTyping: boolean) => {
    const socket = socketService.getSocket();
    if (!socket) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId, receiverId });
  };

  const updateOrderFromRealtime = (order: Order) => {
    if (!order?.id) return;
    setOrders((prev) => {
      const exists = prev.some((item) => item.id === order.id);
      if (exists) return prev.map((item) => (item.id === order.id ? { ...item, ...order } : item));
      return [order, ...prev];
    });
  };

  const updateCurrentUser = (user: User) => setCurrentUser(normalizeUser(user));

  const requestProfile = async (path: string, init?: RequestInit): Promise<User> => {
    const response = await apiFetch(path, init);
    const data = await response.json();
    if (!response.ok || !data.user) throw new Error(data.error || 'Unable to update profile');
    const user = normalizeUser(data.user);
    setCurrentUser(user);
    return user;
  };

  const updateProfile = (updates: Partial<User>) => requestProfile('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const addProfileItem = (collection: string, item: unknown) => requestProfile(`/api/profile/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });

  const updateProfileItem = (collection: string, id: string, item: unknown) => requestProfile(`/api/profile/${collection}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });

  const deleteProfileItem = (collection: string, id: string) => requestProfile(`/api/profile/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });

  const uploadAvatar = (avatar: string) => requestProfile('/api/profile/avatar', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar }),
  });

  useEffect(() => {
    refreshCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    processedRealtimeNotificationIds.current.clear();

    const socket = socketService.connect(currentUser.id);
    socket.emit('join-user');
    socket.emit('join', currentUser.id);

    const handleNewMessage = (rawPayload: any) => {
      const payload = rawPayload?.message
        ? { ...rawPayload.message, conversationId: rawPayload.message.conversationId || rawPayload.conversation?.id }
        : rawPayload;
      const conversationId = payload.conversationId;
      const senderIsCurrentUser = payload.senderId === currentUser.id;
      const message: Message = {
        id: payload.id || `msg-${Date.now()}`,
        conversationId,
        senderId: payload.senderId,
        senderName: payload.senderName || payload.sender?.name || 'User',
        senderAvatar: payload.senderAvatar || payload.sender?.avatar || '',
        text: payload.text,
        timestamp: new Date(payload.timestamp || payload.sentAt || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: senderIsCurrentUser,
        status: senderIsCurrentUser ? 'seen' : payload.status || 'sent',
      };

      setMessages((prev) => {
        const existingMessages = prev[conversationId] || [];
        if (existingMessages.some((existingMessage) => existingMessage.id === message.id)) {
          return prev;
        }

        return {
          ...prev,
          [conversationId]: [...existingMessages, message],
        };
      });

      setConversations((prev) => {
        const existing = prev.find((conversation) => conversation.id === conversationId);
        const next = prev.filter((conversation) => conversation.id !== conversationId);

        const updated = {
          ...(existing || {
            id: conversationId,
            participant: {
              id: payload.senderId || 'unknown-user',
              name: payload.senderName || 'New contact',
              username: payload.senderName || 'new-contact',
              email: '',
              avatar: payload.senderAvatar || '',
              level: 'New Seller',
              rating: 0,
              reviewCount: 0,
              country: '',
              memberSince: '',
              responseTime: '',
              bio: '',
              languages: [],
              skills: [],
            } as User,
            lastMessage: '',
            lastMessageTimestamp: '',
            unreadCount: 0,
          }),
          lastMessage: payload.text,
          lastMessageTimestamp: message.timestamp,
          unreadCount: senderIsCurrentUser ? existing?.unreadCount || 0 : (existing?.unreadCount || 0) + 1,
        };

        return [updated, ...next];
      });

      if (!senderIsCurrentUser) {
        setUnreadMessagesCount((prev) => prev + 1);
        // Do NOT push a local notification here — the backend already persists one
        // via createNotification() and pushes it through the 'notification' socket
        // event → handleNotification. Adding one here too causes a duplicate entry
        // in the bell during the same session.
        triggerBrowserNotification(
          payload.senderName || 'User',
          payload.senderAvatar || '/images/default-avatar.png',
          payload.text,
          conversationId,
        );
      }
    };

    const handleMessageSent = (rawPayload: any) => {
      const payload = rawPayload?.message
        ? { ...rawPayload.message, conversationId: rawPayload.message.conversationId || rawPayload.conversation?.id }
        : rawPayload;
      const conversationId = payload.conversationId;
      const message: Message = {
        id: payload.id || `msg-${Date.now()}`,
        conversationId,
        senderId: payload.senderId,
        senderName: payload.senderName || currentUser.name,
        senderAvatar: payload.senderAvatar || currentUser.avatar,
        text: payload.text,
        timestamp: new Date(payload.timestamp || payload.sentAt || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: true,
        status: 'sent',
      };

      setMessages((prev) => {
        const existingMessages = prev[conversationId] || [];
        if (existingMessages.some((existingMessage) => existingMessage.id === message.id)) {
          return prev;
        }

        return {
          ...prev,
          [conversationId]: [...existingMessages, message],
        };
      });
    };

    const handleTypingStart = ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (userId === currentUser.id) return;
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []).filter((id) => id !== userId), userId],
      }));
    };

    const handleTypingStop = ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter((id) => id !== userId),
      }));
    };

    const handleMessagesRead = ({ conversationId, senderId }: { conversationId: string; senderId: string }) => {
      if (senderId === currentUser.id) return;

      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((item) =>
          item.senderId === currentUser.id ? { ...item, isRead: true, seenAt: new Date().toISOString(), status: 'seen' } : item
        ),
      }));

      const unreadForConversation = conversations.find((conversation) => conversation.id === conversationId)?.unreadCount || 0;
      setConversations((prev) => prev.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
      ));
      if (unreadForConversation > 0) {
        setUnreadMessagesCount((prev) => Math.max(0, prev - unreadForConversation));
      }
    };

    const handlePresenceUpdate = ({ userId, online, lastSeen }: { userId: string; online: boolean; lastSeen?: string | null }) => {
      if (!userId || userId === currentUser.id) return;
      setUserPresence((prev) => ({
        ...prev,
        [userId]: { online, lastSeen: lastSeen || (online ? null : new Date().toISOString()) },
      }));
      setConversations((prev) => prev.map((conversation) => {
        if (conversation.participant?.id === userId) {
          return {
            ...conversation,
            participant: {
              ...conversation.participant,
              online,
            } as User,
          };
        }
        return conversation;
      }));
    };

    const handlePresenceSnapshot = (
      presence: Array<{ userId: string; online: boolean; lastSeen?: string | null }>,
    ) => {
      setUserPresence((prev) => {
        const next = { ...prev };
        for (const entry of presence) {
          if (entry.userId) {
            next[entry.userId] = {
              online: Boolean(entry.online),
              lastSeen: entry.lastSeen || null,
            };
          }
        }
        return next;
      });
    };

    const handleOrderEvent = (payload: { order?: Order }) => {
      if (!payload?.order) return;
      updateOrderFromRealtime(payload.order);
      // The 'notification' socket event (fired by createNotification on the backend)
      // handles the bell badge. Here we fire a browser notification so the user
      // gets an OS-level alert when the tab is in the background.
      const order = payload.order;
      const isMyOrder = order.buyerId === currentUser.id || order.sellerId === currentUser.id;
      if (!isMyOrder) return;
      const statusLabels: Record<string, { title: string; body: string }> = {
        'in_progress': { title: 'Order in progress', body: `"${order.gigTitle}" is now being worked on.` },
        'revision':    { title: 'Revision requested', body: `A revision was requested for "${order.gigTitle}".` },
        'delivered':   { title: 'Order delivered', body: `"${order.gigTitle}" has been delivered!` },
        'completed':   { title: 'Order completed', body: `"${order.gigTitle}" is complete. Funds released.` },
        'cancelled':   { title: 'Order cancelled', body: `"${order.gigTitle}" was cancelled.` },
      };
      const label = statusLabels[order.status];
      if (label && typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification(label.title, { body: label.body, icon: '/images/default-avatar.png' });
      }
    };

    const handleNotification = (payload: any) => {
      if (!payload) return;
      const notificationId = payload.id || `notif-${Date.now()}`;
      if (processedRealtimeNotificationIds.current.has(notificationId)) return;
      processedRealtimeNotificationIds.current.add(notificationId);

      playNotificationSound();
      setNotifications((prev) => [{
        id: notificationId,
        type: payload.type || 'order',
        title: payload.title,
        message: payload.message,
        link: payload.link,
        meta: payload.meta,
        createdAt: payload.createdAt || new Date().toISOString(),
        read: false,
        isRead: false,
        timestamp: payload.createdAt || new Date().toISOString(),
      }, ...prev]);
      setUnreadNotificationsCount((prev) => prev + 1);
    };

    const handleMessageDelivered = ({ conversationId, messageId, deliveredAt }: { conversationId: string; messageId?: string; deliveredAt?: string }) => {
      setMessages((prev) => {
        const list = prev[conversationId];
        if (!list) return prev;
        return {
          ...prev,
          [conversationId]: list.map((item) =>
            item.senderId === currentUser.id && (!messageId || item.id === messageId)
              ? { ...item, status: 'delivered' as const, deliveredAt: deliveredAt || new Date().toISOString() }
              : item
          ),
        };
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('receive-message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message:sent', handleMessageSent);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_online', handlePresenceUpdate);
    socket.on('user_offline', handlePresenceUpdate);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('presence:snapshot', handlePresenceSnapshot);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:seen', handleMessagesRead);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('order-created', handleOrderEvent);
    socket.on('order-progress', handleOrderEvent);
    socket.on('order-delivered', handleOrderEvent);
    socket.on('order-completed', handleOrderEvent);
    socket.on('order:update', handleOrderEvent);
    socket.on('notification', handleNotification);
    // Also listen for the alias the backend emits from notify.js
    socket.on('notification:new', handleNotification);
    // When the socket reconnects after a drop, refresh notifications from the
    // REST API so any events missed during the disconnect are caught.
    socket.on('connect', refreshNotifications);
    // Real-time gig listing update when any seller publishes a new gig.
    socket.on('gig:new', ({ gig }: { gig: any }) => {
      if (gig) setGigs((prev) => {
        if (prev.some((g) => g.id === gig.id)) return prev;
        return [gig, ...prev];
      });
    });
    refreshNotifications();

    conversations.forEach((conversation) => {
      socket.emit('join-conversation', { conversationId: conversation.id });
    });

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('receive-message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message:sent', handleMessageSent);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_online', handlePresenceUpdate);
      socket.off('user_offline', handlePresenceUpdate);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('presence:snapshot', handlePresenceSnapshot);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:seen', handleMessagesRead);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('order-created', handleOrderEvent);
      socket.off('order-progress', handleOrderEvent);
      socket.off('order-delivered', handleOrderEvent);
      socket.off('order-completed', handleOrderEvent);
      socket.off('order:update', handleOrderEvent);
      socket.off('notification', handleNotification);
      socket.off('notification:new', handleNotification);
      socket.off('connect', refreshNotifications);
      socket.off('gig:new');
    };
  }, [currentUser?.id]);

  // 1. Initial LocalStorage Read for instantaneous render
  useEffect(() => {
    try {
      const storedGigs = localStorage.getItem(STORAGE_KEYS.GIGS);
      if (storedGigs) setGigs(JSON.parse(storedGigs));

      const storedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (storedFavs) setFavorites(JSON.parse(storedFavs));

      const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE);
      if (storedRole === 'buyer' || storedRole === 'seller') setCurrentRole(storedRole);

    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }
    setIsHydrated(true);
  }, []);

  // 2. Fetch live data from MongoDB backend API
  useEffect(() => {
    async function syncWithMongoDB() {
      setGigsLoading(true);
      setOrdersLoading(true);

      try {
        const [gigsRes, ordersRes] = await Promise.all([
          apiFetch('/api/gigs'),
          apiFetch('/api/orders'),
        ]);

        if (gigsRes.ok) {
          const data = await gigsRes.json();
          if (data.gigs && data.gigs.length > 0) {
            setGigs(data.gigs);
          }
        }

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          if (data.orders && data.orders.length > 0) {
            setOrders(data.orders);
          }
        }

      } catch (err) {
        console.warn('MongoDB API sync notice (running with cached dataset):', err);
      } finally {
        setGigsLoading(false);
        setOrdersLoading(false);
      }
    }

    syncWithMongoDB();
  }, []);

  // 3. Save changes to localStorage after hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(gigs));
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  }, [gigs, orders, favorites, currentRole, conversations, messages, isHydrated]);

  const toggleRole = () => {
    setCurrentRole((prev) => (prev === 'buyer' ? 'seller' : 'buyer'));
  };

  const toggleFavorite = (gigId: string) => {
    setFavoritesLoading(true);
    setFavorites((prev) =>
      prev.includes(gigId) ? prev.filter((id) => id !== gigId) : [...prev, gigId]
    );
    setTimeout(() => setFavoritesLoading(false), 150);
  };

  const isFavorite = (gigId: string) => favorites.includes(gigId);

  const addGig = (gigData: Partial<Gig>): Gig => {
    if (!currentUser) throw new Error('You must be logged in to create a gig.');

    const newGig: Gig = {
      id: gigData.id || `gig-${Date.now()}`,
      sellerId: currentUser.id,
      title: gigData.title || 'Untitled Gig',
      description: gigData.description || 'No description provided.',
      category: gigData.category || 'Programming & Tech',
      subcategory: gigData.subcategory || 'Website Development',
      seller: currentUser,
      images: gigData.images && gigData.images.length > 0
        ? gigData.images
        : ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80'],
      packages: gigData.packages || {
        basic: {
          name: 'Basic',
          title: 'Starter Tier',
          description: 'Basic deliverable package',
          price: gigData.startingPrice || 50,
          deliveryDays: 2,
          revisions: 2,
          features: [{ name: 'Core Feature', included: true }],
        },
        standard: {
          name: 'Standard',
          title: 'Standard Tier',
          description: 'Complete standard deliverables',
          price: (gigData.startingPrice || 50) * 2,
          deliveryDays: 4,
          revisions: 4,
          features: [{ name: 'Core Feature', included: true }, { name: 'Enhanced Assets', included: true }],
        },
        premium: {
          name: 'Premium',
          title: 'Premium Tier',
          description: 'Full-service enterprise deliverable',
          price: (gigData.startingPrice || 50) * 4,
          deliveryDays: 7,
          revisions: 'Unlimited',
          features: [{ name: 'Core Feature', included: true }, { name: 'Full Priority Delivery', included: true }],
        },
      },
      rating: 5.0,
      reviewCount: 0,
      startingPrice: gigData.startingPrice || 50,
      tags: gigData.tags || ['Service', 'Pro'],
      ordersInQueue: 0,
      faqs: gigData.faqs || [
        {
          question: 'What is included in this gig?',
          answer: 'All high-resolution production assets and source files specified in the selected package.',
        },
      ],
      isFeatured: false,
    };

    // Optimistic UI update
    setGigs((prev) => [newGig, ...prev]);

    // Async persistence to MongoDB API
    apiFetch('/api/gigs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGig),
    }).catch((err) => console.warn('Failed to persist gig to MongoDB:', err));

    return newGig;
  };

  const updateGig = (gigId: string, gigData: Partial<Gig>): void => {
    setGigs((prev) => {
      const exists = prev.some((gig) => gig.id === gigId);
      return exists
        ? prev.map((gig) => gig.id === gigId ? { ...gig, ...gigData, id: gigId } : gig)
        : [{ ...gigData, id: gigId } as Gig, ...prev];
    });
    apiFetch(`/api/gigs/${encodeURIComponent(gigId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...gigData, id: gigId }),
    }).catch((err) => console.warn('Failed to persist gig update:', err));
  };

  const deleteGig = (gigId: string) => {
    // Optimistic UI update
    setGigs((prev) => prev.filter((g) => g.id !== gigId));

    // Async persistence to MongoDB API
    apiFetch(`/api/gigs/${gigId}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Failed to delete gig from MongoDB:', err));
  };
  const placeOrder = async (gig: Gig, packageTier: 'Basic' | 'Standard' | 'Premium'): Promise<Order> => {
    if (!currentUser) throw new Error('You must be logged in to place an order.');

    const pkg = gig.packages[packageTier.toLowerCase() as keyof typeof gig.packages];
    const deliveryDays = pkg?.deliveryDays || 3;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + deliveryDays);

    const newOrder: Order = {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      gigId: gig.id,
      gigTitle: gig.title,
      gigImage: gig.images[0] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80',
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      sellerId: gig.seller.id,
      sellerName: gig.seller.name,
      sellerAvatar: gig.seller.avatar,
      packageTier,
      price: pkg?.price || gig.startingPrice,
      status: 'in_progress',
      orderedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      deliveryDate: targetDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      progressPercent: 15,
    };

    // Persist before reporting a successful checkout. Previously any HTTP 500
    // still displayed a successful order because only network failures were caught.
    const response = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.order) {
      throw new Error(data.error || 'Unable to place the order. Please try again.');
    }

    const savedOrder = data.order as Order;
    setOrders((prev) => [savedOrder, ...prev.filter((order) => order.id !== savedOrder.id)]);
    return savedOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          let progressPercent = order.progressPercent;
          if (status === 'delivered') progressPercent = 100;
          if (status === 'completed') progressPercent = 100;
          if (status === 'in_progress') progressPercent = 50;
          return { ...order, status, progressPercent };
        }
        return order;
      })
    );

    // Async persistence to MongoDB API
    apiFetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch((err) => console.warn('Failed to update order status in MongoDB:', err));
  };

  const sendMessage = async (conversationId: string, text: string) => {
    if (!currentUser || !text.trim()) return;

    const clientMessageId = `msg-${crypto.randomUUID()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const optimisticMessage: Message = {
      id: clientMessageId,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: text.trim(),
      timestamp,
      isRead: true,
      status: 'sent',
    };

    setMessages((prev) => {
      const existingMessages = prev[conversationId] || [];
      if (existingMessages.some((message) => message.id === clientMessageId)) return prev;

      return {
        ...prev,
        [conversationId]: [...existingMessages, optimisticMessage],
      };
    });

    setConversations((prev) => prev.map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            lastMessage: optimisticMessage.text,
            lastMessageTimestamp: timestamp,
            unreadCount: 0,
          }
        : conversation
    ));

    setMessagingLoading(true);
    setMessagingError(null);

    try {
      const activeConversation = conversations.find((conversation) => conversation.id === conversationId);
      const receiverId =
        activeConversation?.sellerId && activeConversation.sellerId !== currentUser.id
          ? activeConversation.sellerId
          : activeConversation?.buyerId && activeConversation.buyerId !== currentUser.id
            ? activeConversation.buyerId
            : activeConversation?.participant?.id || 'unknown-participant';

      const payload = {
        conversationId,
        senderId: currentUser.id,
        receiverId,
        text: text.trim(),
        clientMessageId,
      };

      const response = await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send message');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send message';
      setMessagingError(message);
      throw err;
    } finally {
      setMessagingLoading(false);
    }
  };

  const startConversationWithSeller = async (seller: User, gig?: Gig): Promise<string> => {
    if (!currentUser) throw new Error('You must be logged in to start a conversation.');
    if (currentUser.id === seller.id) {
      const error = new Error('You cannot start a conversation with yourself.');
      setMessagingError(error.message);
      throw error;
    }

    const existing = conversations.find((c) => {
      const sameSeller = c.sellerId === seller.id || c.participant?.id === seller.id;
      const sameBuyer = c.buyerId === currentUser.id;
      return sameSeller && sameBuyer;
    }) || conversations.find((c) => c.participant?.id === seller.id || c.sellerId === seller.id);

    if (existing) {
      const socket = socketService.getSocket();
      socket?.emit('join-conversation', { conversationId: existing.id });
      return existing.id;
    }

    setMessagingLoading(true);
    setMessagingError(null);

    try {
      const response = await apiFetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: currentUser.id,
          sellerId: seller.id,
          gigId: gig?.id,
          gigTitle: gig?.title,
        }),
      });
      const data = await response.json();
      const conversationPayload = data.conversation;
      const conversationId = conversationPayload?.id || conversationPayload?._id || data.conversationId;
      if (!response.ok || !conversationPayload || !conversationId) {
        throw new Error(data.error || 'Unable to start conversation');
      }

      const conversation = normalizeConversation(
        { ...conversationPayload, id: conversationId } as Conversation,
        seller
      );
      setConversations((prev) => [
        conversation,
        ...prev.filter((item) => item.id !== conversation.id),
      ]);

      const socket = socketService.getSocket();
      socket?.emit('join-conversation', { conversationId });
      return conversation.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start conversation';
      setMessagingError(message);
      throw err;
    } finally {
      setMessagingLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        sendMessage,
        loadMessages,
        markConversationAsRead,
        loadConversations,
        currentUser,
        setCurrentUser,
        isAuthLoading,
        profileLoading,
        gigsLoading,
        gigLoading,
        messagesLoading,
        conversationsLoading,
        ordersLoading,
        reviewsLoading,
        dashboardLoading,
        favoritesLoading,
        refreshCurrentUser,
        updateCurrentUser,
        updateProfile,
        addProfileItem,
        updateProfileItem,
        deleteProfileItem,
        uploadAvatar,
        logout,
        currentRole,
        toggleRole,
        gigs,
        orders,
        favorites,
        toggleFavorite,
        isFavorite,
        addGig,
        updateGig,
        deleteGig,
        placeOrder,
        updateOrderStatus,
        conversations,
        messages,
        notifications,
        unreadMessagesCount,
        messagingLoading,
        messagingError,
        startConversationWithSeller,
        searchQuery,
        setSearchQuery,
        typingUsers,
        notifyTyping,
        refreshNotifications,
        markNotificationAsRead,
        clearNotifications,
        unreadNotificationsCount,
        userPresence,
        updateOrderFromRealtime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
