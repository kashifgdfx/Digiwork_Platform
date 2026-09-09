'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Conversation,
  Gig,
  Message,
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
  refreshCurrentUser: () => Promise<User | null>;
  updateCurrentUser: (user: User) => void;
  loadMessages: (conversationId: string) => Promise<void>;
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
  deleteGig: (gigId: string) => void;
  placeOrder: (gig: Gig, packageTier: 'Basic' | 'Standard' | 'Premium') => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  startConversationWithSeller: (seller: User, gig?: Gig) => Promise<string>;
  messagingLoading: boolean;
  messagingError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  GIGS: 'fiverr_clone_gigs',
  FAVORITES: 'fiverr_clone_favorites',
  ROLE: 'fiverr_clone_role',
};

function normalizeUser(user: Partial<User> & { id: string; name: string; email?: string }): User {
  return {
    id: user.id,
    name: user.name,
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
  };
  const participant = payload.participant || payload.seller || payload.buyer || fallbackParticipant;
  const participantId = participant?.id || payload.participantId || 'unknown-participant';
  const participantName = participant?.name || payload.participantName || 'Unknown user';

  return {
    ...conversation,
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
  const [currentRole, setCurrentRole] = useState<UserRole>('buyer');
  const [gigs, setGigs] = useState<Gig[]>(mockGigs);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [messagingError, setMessagingError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const refreshCurrentUser = async (): Promise<User | null> => {
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
      setIsAuthLoading(false);
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
    setMessagingLoading(true);
    setMessagingError(null);

    try {
      const response = await apiFetch(`/api/conversations/${encodeURIComponent(userId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load conversations');
      setConversations(
        (data.conversations || []).map((conversation: Conversation) => normalizeConversation(conversation))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load conversations';
      setMessagingError(message);
      throw err;
    } finally {
      setMessagingLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setMessagingLoading(true);
    setMessagingError(null);

    try {
      const response = await apiFetch(`/api/messages/${encodeURIComponent(conversationId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load messages');

      setMessages((prev) => ({
        ...prev,
        [conversationId]: data.messages || [],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load messages';
      setMessagingError(message);
      throw err;
    } finally {
      setMessagingLoading(false);
    }
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

    const socket = socketService.connect();
    socket.emit('join-user');

    const handleReceiveMessage = (payload: any) => {
      const message: Message = {
        id: payload.id || `msg-${Date.now()}`,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        senderName: payload.senderName || 'User',
        senderAvatar: payload.senderAvatar || '',
        text: payload.text,
        timestamp: new Date(payload.timestamp || payload.sentAt || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: payload.senderId === currentUser.id,
      };

      upsertMessageIntoState(payload.conversationId, message);

      if (payload.senderId !== currentUser.id) {
        setConversations((prev) => prev.map((conversation) =>
          conversation.id === payload.conversationId
            ? { ...conversation, lastMessage: payload.text, lastMessageTimestamp: message.timestamp, unreadCount: conversation.unreadCount + 1 }
            : conversation
        ));
      }
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

    const handleSeen = ({ conversationId, senderId }: { conversationId: string; senderId: string }) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((item) =>
          item.senderId === senderId ? { ...item, isRead: true } : item
        ),
      }));
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:seen', handleSeen);

    conversations.forEach((conversation) => {
      socket.emit('join-conversation', { conversationId: conversation.id });
    });

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:seen', handleSeen);
    };
  }, [currentUser, conversations]);

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
    setFavorites((prev) =>
      prev.includes(gigId) ? prev.filter((id) => id !== gigId) : [...prev, gigId]
    );
  };

  const isFavorite = (gigId: string) => favorites.includes(gigId);

  const addGig = (gigData: Partial<Gig>): Gig => {
    if (!currentUser) throw new Error('You must be logged in to create a gig.');

    const newGig: Gig = {
      id: `gig-${Date.now()}`,
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

  const deleteGig = (gigId: string) => {
    // Optimistic UI update
    setGigs((prev) => prev.filter((g) => g.id !== gigId));

    // Async persistence to MongoDB API
    apiFetch(`/api/gigs/${gigId}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Failed to delete gig from MongoDB:', err));
  };
  const placeOrder = (gig: Gig, packageTier: 'Basic' | 'Standard' | 'Premium'): Order => {
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

    // Optimistic UI update
    setOrders((prev) => [newOrder, ...prev]);

    // Async persistence to MongoDB API
    apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch((err) => console.warn('Failed to persist order to MongoDB:', err));

    return newOrder;
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

    const optimisticMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };

    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMessage],
    }));

    setConversations((prev) => prev.map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            lastMessage: text.trim(),
            lastMessageTimestamp: optimisticMessage.timestamp,
            unreadCount: 0,
          }
        : conversation
    ));

    setMessagingLoading(true);
    setMessagingError(null);

    try {
      const payload = {
        conversationId,
        senderId: currentUser.id,
        receiverId: conversations.find((conversation) => conversation.id === conversationId)?.participant?.id,
        text: text.trim(),
      };

      const response = await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send message');

      const socket = socketService.getSocket();
      socket?.emit('send-message', {
        conversationId,
        receiverId: payload.receiverId,
        text: text.trim(),
        attachments: [],
      });

      await loadConversations(currentUser.id);
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

    const existing = conversations.find((c) => c.participant.id === seller.id || c.participant?.id === seller.id);
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
        loadConversations,
        currentUser,
        setCurrentUser,
        isAuthLoading,
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
        deleteGig,
        placeOrder,
        updateOrderStatus,
        conversations,
        messages,
        messagingLoading,
        messagingError,
      
        startConversationWithSeller,
        searchQuery,
        setSearchQuery,
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
