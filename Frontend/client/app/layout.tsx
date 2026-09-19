import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/context/ToastContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import LayoutContent from "@/components/LayoutContent";

export const metadata: Metadata = {
  title: "Digiwork - Hire Expert Freelancers & Grow Your Business",
  description:
    "Digiwork connects businesses with trusted freelancers for web development, design, marketing, AI services, content creation, and professional digital solutions.",
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
          <ToastProvider>
            <ConfirmProvider>
              <LayoutContent>{children}</LayoutContent>
            </ConfirmProvider>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}