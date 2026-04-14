import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import "../styles/fonts.css";
import "../styles/theme.css";
import "./globals.css";
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased text-foreground bg-background">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
