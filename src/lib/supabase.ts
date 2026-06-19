import { createBrowserClient, createServerClient } from "@supabase/ssr";

// createBrowserClient хранит сессию в куках (не localStorage),
// что позволяет middleware на сервере читать её и проверять авторизацию.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Anon-роль клиент для server components: читает публичные данные
// (businesses, services) под RLS-политиками public_select. Сессия не нужна —
// поэтому cookie-обработчики пустые. Не использовать для записей/приватных
// данных. NB: специально без импорта next/headers, чтобы этот файл оставался
// безопасным для импорта из клиентских компонентов (там используется `supabase`).
export function createServerSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op: публичное чтение, сессия не требуется */
        },
      },
    }
  );
}