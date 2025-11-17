import type { Metadata } from "next";
import "./globals.css";
import "@/store/rateLimitStore"; // Initialize the store

export const metadata: Metadata = {
  title: "Chatbot",
  description: "Organization rate limit management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
