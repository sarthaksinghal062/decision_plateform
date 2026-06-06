import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import ThemeProvider from "@/components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: "Decision Helper",
  description: "Structured decision making with AHP",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)] bg-[var(--bg)] text-[var(--text-1)]">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
