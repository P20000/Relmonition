import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Relmonition",
  description: "Relationship Wellness Platform prioritizing connection and intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${outfit.className} ${outfit.variable} antialiased text-foreground bg-background`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
