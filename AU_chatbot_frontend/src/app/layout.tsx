import type { Metadata } from "next";
import "./globals.css";
import "@/store/rateLimitStore"; // Initialize the store

export const metadata: Metadata = {
  title: "Rate Limit Management",
  description: "Organization rate limit management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
