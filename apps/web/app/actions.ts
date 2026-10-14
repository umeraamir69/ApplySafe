"use server";

import { runScan, type WebScan } from "@/lib/run-scan";

const MAX_CHARS = 20_000;

export async function scanPaste(text: string): Promise<{ result?: WebScan; error?: string }> {
  const clipped = text.slice(0, MAX_CHARS);
  if (!clipped.trim()) return { error: "Paste a message first." };
  try {
    return { result: runScan(clipped) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The rules scanner failed.";
    return { error: message };
  }
}
