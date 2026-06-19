import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase";
import type { Service } from "@/types";

export type Business = {
  id: string;
  slug: string;
  name: string;
};

// cache() дедуплицирует вызов в пределах одного запроса: layout (404-гард) и
// page (рендер) обращаются к одному и тому же business → один запрос к БД.
export const getBusinessBySlug = cache(
  async (slug: string): Promise<Business | null> => {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("businesses")
      .select("id, slug, name")
      .eq("slug", slug)
      .maybeSingle();
    return data ?? null;
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
