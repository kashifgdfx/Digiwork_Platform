"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useConfirm } from "@/context/ConfirmContext";
import { NotificationBell } from "@/components/NotificationBell";
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
  Settings,
} from "lucide-react";

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
    unreadMessagesCount,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { confirm } = useConfirm();
  const activeUser = currentUser;

  const isLoggedIn = !!currentUser;

  const unreadMessages =
    unreadMessagesCount ||
    conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const displayUnreadCount = unreadMessages > 99 ? "99+" : unreadMessages;
  const activeOrdersCount = orders.filter(
    (o) => o.status === "in_progress",
  ).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/gigs?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/gigs");
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
              className="flex items-center text-gray-600 hover:text-[#1dbf73] transition-colors"
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
                  {currentRole === "buyer"
                    ? "Switch to Selling"
                    : "Switch to Buying"}
                </button>

                {/* Messages */}
                <Link
                  href="/messages"
                  className="relative p-2 text-gray-600 hover:text-[#1dbf73] transition-colors rounded-full hover:bg-gray-100 flex items-center justify-center"
                  title="Messages"
                >
                  <MessageSquare size={20} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#1dbf73] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm">
                      {displayUnreadCount}
                    </span>
                  )}
                </Link>

                {/* Notifications Bell */}
                <NotificationBell />

                {/* Favorites */}
                <Link
                  href="/gigs?favorites=true"
                  className="relative p-2 text-gray-600 hover:text-[#1dbf73] transition-colors rounded-full hover:bg-gray-100 flex items-center justify-center"
                  title="Saved Gigs"
                >
                  <Heart
                    size={20}
                    className={
                      favorites.length > 0 ? "fill-rose-500 text-rose-500" : ""
                    }
                  />
                  {favorites.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </Link>

                {/* Orders / Dashboard Link based on role */}
                <Link
                  href={
                    currentRole === "buyer"
                      ? "/dashboard/buyer"
                      : "/dashboard/seller"
                  }
                  className="flex items-center gap-2 text-gray-600 hover:text-[#1dbf73] transition-colors relative"
                >
                  {currentRole === "buyer" ? (
                    <>
                      <ShoppingBag size={18} className="shrink-0" />
                      <span className="leading-none">Orders</span>
                      {activeOrdersCount > 0 && (
                        <span className="relative -ml-1 -top-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[#1dbf73] text-white rounded-full leading-none shadow-sm">
                          {activeOrdersCount}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <LayoutDashboard size={18} className="shrink-0" />
                      <span className="leading-none">Seller Dashboard</span>
                    </>
                  )}
                </Link>

                {/* Desktop Admin Panel Link */}
                {currentUser?.role === "admin" && (
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1DBF73] hover:bg-[#19a463] rounded-md border border-[#1DBF73] transition-colors whitespace-nowrap shrink-0"
                  >
                    <UserShield size={16} className="shrink-0" />
                    <span className="whitespace-nowrap">Admin Panel</span>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative flex items-center">
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
                      className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 top-full"
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
                        <UserShield size={16} />
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

                      {currentUser?.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1dbf73] shrink-0"
                        >
                          <UserShield size={18} className="shrink-0" />
                          <span className="whitespace-nowrap">Admin Panel</span>
                        </Link>
                      )}

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
                        <Settings size={16} />
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
                          const confirmed = await confirm({
                            title: "Log out?",
                            message:
                              "Are you sure you want to log out of your account?",
                            confirmLabel: "Log Out",
                            cancelLabel: "Cancel",
                            variant: "danger",
                          });
                          if (!confirmed) return;
                          await logout();
                          setUserMenuOpen(false);
                          router.replace("/");
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
                  className="flex items-center text-gray-600 hover:text-[#1dbf73] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  Join
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn && <NotificationBell />}
            <Link
              href="/messages"
              className="p-2 text-gray-600 hover:text-[#1dbf73] relative flex items-center justify-center"
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
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none flex items-center justify-center"
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
      {mobileMenuOpen &&
        (isLoggedIn ? (
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
              className="flex items-center justify-between py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              <span>Buyer Dashboard & Orders</span>
              {activeOrdersCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[11px] font-bold bg-[#1dbf73] text-white rounded-full">
                  {activeOrdersCount}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/seller"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              Seller Dashboard
            </Link>

            {/* Mobile Admin Panel Link */}
            {currentUser?.role === "admin" && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
              >
                <span>Admin Panel</span>
                <UserShield size={16} />
              </Link>
            )}

            <Link
              href="/messages"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              Messages
            </Link>

            <Link
              href={`/profile/${activeUser?.username}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              My Profile
            </Link>
            <Link
              href="/settings/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
            >
              Settings
            </Link>

            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: "Log out?",
                  message: "Are you sure you want to log out of your account?",
                  confirmLabel: "Log Out",
                  cancelLabel: "Cancel",
                  variant: "danger",
                });
                if (!confirmed) return;
                await logout();
                setMobileMenuOpen(false);
                router.replace("/");
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
        ))}
    </header>
  );
};