import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import LayoutContent from "@/components/LayoutContent";

export const metadata: Metadata = {
  title: "Fiverr - Freelance Services Marketplace for Businesses & Creators",
  description:
    "Find top freelancers for graphic design, web development, SEO, copywriting, video editing, and AI services.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        <AppProvider>
          <LayoutContent>{children}</LayoutContent>
        </AppProvider>
      </body>
    </html>
  );
}