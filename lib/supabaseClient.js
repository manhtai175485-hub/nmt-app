"use client";
import { createBrowserClient } from "@supabase/ssr";

// Dùng ở phía trình duyệt (Client Components).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
