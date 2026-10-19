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
            <a className="brand" href="/">
              <img src="/logo-mark.svg" width={32} height={32} alt="" />
              ApplySafe
            </a>
            <a href="/privacy">Privacy</a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
