import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplySafe",
  description: "Check a Canadian job message for scam phrases before you reply.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <header>
            <a href="/">ApplySafe</a>
            <a href="/privacy">Privacy</a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
