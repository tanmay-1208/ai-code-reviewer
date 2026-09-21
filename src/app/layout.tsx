import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Code Reviewer",
  description: "Get instant AI-powered code reviews from a snippet or GitHub URL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
