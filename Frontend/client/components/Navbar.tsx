'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  ShoppingBag,
  Sparkles,
  X,
  UserShield,
  Settings
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const {
    currentUser,
    logout,
    currentRole,
    toggleRole,
    orders,
    conversations,
    favorites,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const activeUser = currentUser;

  const isLoggedIn = !!currentUser;

  // Calculate unread count
  const unreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const activeOrdersCount = orders.filter((o) => o.status === 'in_progress').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/gigs?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/gigs');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-black tracking-tight text-gray-900 group-hover:text-gray-800 transition-colors">
                Digiwork
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#1dbf73] ml-0.5 inline-block animate-pulse"></span>
            </Link>

            {/* Global Search Bar (Desktop) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:flex items-center relative w-80 xl:w-96"
            >
              <input
                type="text"
                placeholder="What service are you looking for today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] placeholder-gray-400"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded transition-colors flex items-center justify-center"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link
              href="/gigs"
              className="text-gray-600 hover:text-[#1dbf73] transition-colors"
            >
              Explore Gigs
            </Link>

            {isLoggedIn ? (
              <>

                {/* Switch Role Button */}
                <button
                  onClick={toggleRole}
                  className="px-3 py-1.5 border border-[#1dbf73] text-[#1dbf73] hover:bg-emerald-50 rounded-md transition-colors text-xs font-semibold flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  {currentRole === 'buyer' ? 'Switch to Selling' : 'Switch to Buying'}
                </button>

                {/* Messages */}
                <Link
                  href="/messages"
                  className="relative p-2 text-gray-600 hover:text-[#1dbf73] transition-colors rounded-full hover:bg-gray-100"
                  title="Messages"
                >
                  <MessageSquare size={20} />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#1dbf73] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Favorites */}
                <Link
                  href="/gigs?favorites=true"
                  className="relative p-2 text-gray-600 hover:text-[#1dbf73] transition-colors rounded-full hover:bg-gray-100"
                  title="Saved Gigs"
                >
                  <Heart size={20} className={favorites.length > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                  {favorites.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </Link>

                {/* Orders / Dashboard Link based on role */}
                <Link
                  href={currentRole === 'buyer' ? '/dashboard/buyer' : '/dashboard/seller'}
                  className="flex items-center gap-1 text-gray-600 hover:text-[#1dbf73] transition-colors relative"
                >
                  {currentRole === 'buyer' ? (
                    <>
                      <ShoppingBag size={18} />
                      <span>Orders</span>
                      {activeOrdersCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[11px] font-bold bg-[#1dbf73] text-white rounded-full">
                          {activeOrdersCount}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <LayoutDashboard size={18} />
                      <span>Seller Dashboard</span>
                    </>
                  )}
                </Link>

                {/* User Dropdown */}
              {/* User Dropdown */}
<div className="relative">
  <button
    onClick={() => setUserMenuOpen(!userMenuOpen)}
    className="flex items-center gap-2 focus:outline-none"
  >
    <img
      src={activeUser?.avatar || "/images/default-avatar.png"}
      alt={activeUser?.name || "User"}
      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
    />
  </button>

  {userMenuOpen && (
    <div
      className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
      onMouseLeave={() => setUserMenuOpen(false)}
    >
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">
          {activeUser?.name}
        </p>

        <p className="text-xs text-gray-500">
          @{activeUser?.username}
        </p>

        <span className="mt-1 inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
          Role:{" "}
          {currentRole === "buyer"
            ? "Client / Buyer"
            : "Freelancer / Seller"}
        </span>
      </div>

      <Link
        href={`/profile/${activeUser?.username}`}
        onClick={() => setUserMenuOpen(false)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1dbf73]"
      >
         <UserShield  size={16} />
        <span>My Profile</span>
      </Link>

      <Link
        href="/dashboard/buyer"
        onClick={() => setUserMenuOpen(false)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1dbf73]"
      >
        <ShoppingBag size={16} />
        <span>Buyer Dashboard</span>
      </Link>

    

      <Link
        href="/dashboard/seller"
        onClick={() => setUserMenuOpen(false)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1dbf73]"
      >
        <LayoutDashboard size={16} />
        <span>Seller Dashboard</span>
      </Link>

      <Link
        href="/messages"
        onClick={() => setUserMenuOpen(false)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1dbf73]"
      >
        <MessageSquare size={16} />
        <span>Inbox Messages</span>
      </Link>

        <Link
        href="/settings/profile"
        onClick={() => setUserMenuOpen(false)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1dbf73]"
      >
        <Settings  size={16} />
        <span>Settings</span>
      </Link>

      <div className="border-t border-gray-100 mt-2 pt-2 px-4">
        <button
          onClick={() => {
            toggleRole();
            setUserMenuOpen(false);
          }}
          className="w-full text-left text-xs text-[#1dbf73] font-semibold hover:underline"
        >
          {currentRole === "buyer"
            ? "Switch to Seller Mode →"
            : "Switch to Buyer Mode →"}
        </button>
      </div>

      <button
        onClick={async () => {
          await logout();
          setUserMenuOpen(false);
          router.replace('/');
        }}
        className="w-full text-left px-4 pt-2 text-sm text-gray-600 hover:text-red-600"
      >
        Log out
      </button>
    </div>
  )}
</div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-[#1dbf73] transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-md font-medium transition-colors"
                >
                  Join
                </Link>
              </>
            )}
          </div>


          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/messages"
              className="p-2 text-gray-600 hover:text-[#1dbf73] relative"
            >
              <MessageSquare size={20} />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#1dbf73] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="pb-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search gigs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1dbf73]"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#1dbf73] text-white rounded text-xs flex items-center justify-center"
            >
              <Search size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        isLoggedIn ? (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <img
                src={activeUser?.avatar || "/images/default-avatar.png"}
                alt={activeUser?.name || "User"}
                className="w-10 h-10 rounded-full object-cover"
              />

              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {activeUser?.name}
                </p>

                <span className="text-xs text-[#1dbf73] font-medium">
                  Active Role: {currentRole === "buyer" ? "Buyer" : "Seller"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                toggleRole();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-[#1dbf73] bg-emerald-50 rounded-md"
            >
              {currentRole === "buyer"
                ? "Switch to Selling"
                : "Switch to Buying"}
            </button>

            <Link
              href="/gigs"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              Explore Gigs
            </Link>

            <Link
              href="/dashboard/buyer"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              Buyer Dashboard & Orders ({orders.length})
            </Link>

            <Link
              href="/dashboard/seller"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              Seller Dashboard
            </Link>

            <Link
              href="/messages"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              Messages
            </Link>

            <Link href={`/profile/${activeUser?.username}`} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]">My Profile</Link>
            <Link href="/settings/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]">Settings</Link>

            <button
              onClick={async () => {
                await logout();
                setMobileMenuOpen(false);
                router.replace('/');
              }}
              className="block w-full text-left py-2 text-sm font-medium text-red-600"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
            <Link
              href="/gigs"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700"
            >
              Explore Gigs
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2 border border-gray-300 rounded-md font-medium"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2 bg-[#1dbf73] text-white rounded-md font-medium"
            >
              Join
            </Link>
          </div>
        )
      )}
    </header>
  );
};