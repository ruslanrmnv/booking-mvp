import { createBrowserClient } from "@supabase/ssr";

// createBrowserClient хранит сессию в куках (не localStorage),
// что позволяет middleware на сервере читать её и проверять авторизацию.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);