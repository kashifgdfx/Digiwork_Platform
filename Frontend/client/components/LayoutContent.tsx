"use client";

import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { CategoryBar } from "@/components/CategoryBar";
import { Footer } from "@/components/Footer";
import React, { Suspense } from "react";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthLoading } = useApp();

  const protectedRoute =
    pathname === "/orders" ||
    pathname === "/messages" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/settings/");

  useEffect(() => {
    if (!isAuthLoading && protectedRoute && !currentUser) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [currentUser, isAuthLoading, pathname, protectedRoute, router]);

  if (protectedRoute && (isAuthLoading || !currentUser)) {
    return <main className="flex-1" />;
  }

  const hideLayout =
    pathname === "/login" ||
    pathname === "/signup";

  return (
    <>
      {!hideLayout && <Navbar />}

      {!hideLayout && (
        <Suspense
          fallback={
            <div className="h-10 border-b border-gray-100 hidden md:block" />
          }
        >
          <CategoryBar />
        </Suspense>
      )}

      <main className="flex-1">{children}</main>

      {!hideLayout && <Footer />}
    </>
  );
}