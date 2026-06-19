import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase";
import type { Service } from "@/types";

export type Business = {
  id: string;
  slug: string;
  name: string;
  open_time: string;   // "HH:MM"
  close_time: string;  // "HH:MM"
};

// cache() дедуплицирует вызов в пределах одного запроса: layout (404-гард) и
// page (рендер) обращаются к одному и тому же business → один запрос к БД.
export const getBusinessBySlug = cache(
  async (slug: string): Promise<Business | null> => {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("businesses")
      .select("id, slug, name, open_time, close_time")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    // Postgres time → "HH:MM:SS"; нормализуем к "HH:MM".
    return {
      ...data,
      open_time: data.open_time.substring(0, 5),
      close_time: data.close_time.substring(0, 5),
    };
  }
);

export const getServices = cache(
  async (businessId: string): Promise<Service[]> => {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("services")
      .select("id, name, duration, price")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true });
    return data ?? [];
  }
);
