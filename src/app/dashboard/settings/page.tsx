"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BUSINESS_NAME } from "@/lib/site";
import { supabase } from "@/lib/supabase";

type ServiceRow = {
  id: string;
  name: string;
  duration: number;
  price: number;
  sort_order: number;
};

// Черновик редактируемой строки (строки в полях, парсим при сохранении).
type Draft = { name: string; duration: string; price: string };

function toDraft(s: ServiceRow): Draft {
  return { name: s.name, duration: String(s.duration), price: String(s.price) };
}

// Корректный положительный (для цены — неотрицательный) integer?
function isPosInt(v: string, allowZero = false): boolean {
  const n = Number(v);
  return Number.isInteger(n) && (allowZero ? n >= 0 : n > 0);
}

function draftValid(d: Draft): boolean {
  return d.name.trim() !== "" && isPosInt(d.duration) && isPosInt(d.price, true);
}

function draftDirty(d: Draft, s: ServiceRow): boolean {
  return (
    d.name.trim() !== s.name ||
    Number(d.duration) !== s.duration ||
    Number(d.price) !== s.price
  );
}

// Настройки бизнеса: название + рабочие часы. open/close — "HH:MM".
type BizDraft = { name: string; open: string; close: string };
const EMPTY_BIZ: BizDraft = { name: "", open: "", close: "" };

function bizValid(d: BizDraft): boolean {
  // Лексическое сравнение "HH:MM" совпадает с хронологическим порядком.
  return d.name.trim() !== "" && d.open !== "" && d.close !== "" && d.open < d.close;
}

function bizDirty(d: BizDraft, s: BizDraft): boolean {
  return d.name.trim() !== s.name || d.open !== s.open || d.close !== s.close;
}

export default function SettingsPage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState(BUSINESS_NAME);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);

  // Настройки бизнеса (название + часы): черновик + сохранённый снимок.
  const [bizSaved, setBizSaved] = useState<BizDraft>(EMPTY_BIZ);
  const [bizDraft, setBizDraft] = useState<BizDraft>(EMPTY_BIZ);
  const [bizSaving, setBizSaving] = useState(false);
  const [bizSavedFlag, setBizSavedFlag] = useState(false);

  // Per-row action state
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [armedDeleteId, setArmedDeleteId] = useState<string | null>(null);
  const [deleteCooling, setDeleteCooling] = useState(false);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add-new form
  const [newSvc, setNewSvc] = useState<Draft>({ name: "", duration: "", price: "" });
  const [adding, setAdding] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function applyServices(rows: ServiceRow[]) {
    setServices(rows);
    const d: Record<string, Draft> = {};
    rows.forEach((s) => { d[s.id] = toDraft(s); });
    setDrafts(d);
  }

  async function fetchServices(bizId: string) {
    const { data } = await supabase
      .from("services")
      .select("id, name, duration, price, sort_order")
      .eq("business_id", bizId)
      .order("sort_order", { ascending: true });
    applyServices(data ?? []);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: business } = await supabase
        .from("businesses")
        .select("id, name, open_time, close_time")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!business) { setLoading(false); return; }
      setBusinessId(business.id);
      setBusinessName(business.name);
      // Postgres time → "HH:MM:SS"; нормализуем к "HH:MM" для <input type="time">.
      const snapshot: BizDraft = {
        name: business.name,
        open: business.open_time.substring(0, 5),
        close: business.close_time.substring(0, 5),
      };
      setBizSaved(snapshot);
      setBizDraft(snapshot);
      await fetchServices(business.id);
      setLoading(false);
    }
    init();
  }, []);

  // Авто-сброс подтверждения удаления через несколько секунд.
  useEffect(() => {
    if (disarmTimer.current) clearTimeout(disarmTimer.current);
    if (armedDeleteId) {
      disarmTimer.current = setTimeout(() => setArmedDeleteId(null), 4000);
    }
    return () => { if (disarmTimer.current) clearTimeout(disarmTimer.current); };
  }, [armedDeleteId]);

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setSavedId(null);
  }

  async function handleSave(id: string) {
    const d = drafts[id];
    if (!d || !draftValid(d)) return;
    setErrorMsg("");
    setSavingId(id);
    const { error } = await supabase
      .from("services")
      .update({
        name: d.name.trim(),
        duration: Number(d.duration),
        price: Number(d.price),
      })
      .eq("id", id);
    setSavingId(null);
    if (error) {
      setErrorMsg("Не удалось сохранить услугу — попробуйте ещё раз.");
      return;
    }
    // Обновляем снимок, чтобы строка перестала считаться изменённой.
    setServices((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, name: d.name.trim(), duration: Number(d.duration), price: Number(d.price) }
          : s
      )
    );
    setSavedId(id);
  }

  function handleDeleteClick(id: string) {
    if (armedDeleteId !== id) {
      // Первый клик — взводим подтверждение и кратко блокируем,
      // чтобы случайный двойной клик не удалил услугу.
      setArmedDeleteId(id);
      setDeleteCooling(true);
      setTimeout(() => setDeleteCooling(false), 400);
      return;
    }
    if (deleteCooling) return;
    handleDelete(id);
  }

  async function handleDelete(id: string) {
    if (!businessId) return;
    setErrorMsg("");
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      setErrorMsg("Не удалось удалить услугу — попробуйте ещё раз.");
      return;
    }
    setArmedDeleteId(null);
    await fetchServices(businessId);
  }

  async function handleAdd() {
    if (!businessId || adding || !draftValid(newSvc)) return;
    setErrorMsg("");
    setAdding(true);
    const nextOrder =
      services.reduce((max, s) => Math.max(max, s.sort_order), 0) + 1;
    const { error } = await supabase.from("services").insert([{
      business_id: businessId,
      name: newSvc.name.trim(),
      duration: Number(newSvc.duration),
      price: Number(newSvc.price),
      sort_order: nextOrder,
    }]);
    setAdding(false);
    if (error) {
      setErrorMsg("Не удалось добавить услугу — попробуйте ещё раз.");
      return;
    }
    setNewSvc({ name: "", duration: "", price: "" });
    await fetchServices(businessId);
  }

  function updateBizDraft(patch: Partial<BizDraft>) {
    setBizDraft((prev) => ({ ...prev, ...patch }));
    setBizSavedFlag(false);
  }

  async function handleSaveBusiness() {
    if (!businessId || bizSaving || !bizValid(bizDraft) || !bizDirty(bizDraft, bizSaved)) return;
    setErrorMsg("");
    setBizSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: bizDraft.name.trim(),
        open_time: bizDraft.open,
        close_time: bizDraft.close,
      })
      .eq("id", businessId);
    setBizSaving(false);
    if (error) {
      setErrorMsg("Не удалось сохранить настройки бизнеса — попробуйте ещё раз.");
      return;
    }
    const snapshot: BizDraft = { name: bizDraft.name.trim(), open: bizDraft.open, close: bizDraft.close };
    setBizSaved(snapshot);
    setBizDraft(snapshot);
    setBusinessName(snapshot.name); // обновляем шапку
    setBizSavedFlag(true);
  }

  const inputClass =
    "w-full bg-ivory text-espresso placeholder:text-espresso/50 text-base " +
    "px-4 py-3 rounded-xl border border-walnut/20 focus:outline-none " +
    "focus:border-amber focus:ring-2 focus:ring-amber/50 transition-colors duration-150";

  return (
    <div className="min-h-screen bg-ivory text-espresso">
      {/* Sticky header — same as dashboard */}
      <header className="sticky top-0 z-50 flex items-center justify-between
                         px-6 sm:px-10 h-16 border-b border-walnut/15
                         bg-ivory/95 backdrop-blur-sm">
        <span className="text-espresso text-lg font-semibold tracking-tight">
          {businessName}
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-espresso/70 hover:text-espresso
                       transition-colors duration-150 rounded-sm
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-amber focus-visible:ring-offset-2
                       focus-visible:ring-offset-ivory"
          >
            ← К дашборду
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-espresso/70 hover:text-espresso
                       transition-colors duration-150 rounded-sm
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-amber focus-visible:ring-offset-2
                       focus-visible:ring-offset-ivory"
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-10 sm:py-12 px-6 sm:px-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-espresso mb-8">
          Настройки
        </h1>

        {errorMsg && (
          <p className="text-oxblood text-sm mb-6" role="status">{errorMsg}</p>
        )}

        {/* ── Business: name + working hours ─────────────────────────────── */}
        <h2 className="text-2xl font-semibold tracking-tight text-espresso mb-6">
          Бизнес
        </h2>
        {loading ? (
          <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-6 mb-12">
            <p className="text-espresso/60 text-sm">Загрузка…</p>
          </div>
        ) : (
          <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-5 flex flex-col gap-4 mb-12">
            <label className="block">
              <span className="text-espresso/70 text-xs font-medium block mb-1">Название</span>
              <input
                type="text"
                value={bizDraft.name}
                onChange={(e) => updateBizDraft({ name: e.target.value })}
                className={inputClass}
              />
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="sm:w-40">
                <span className="text-espresso/70 text-xs font-medium block mb-1">Открытие</span>
                <input
                  type="time"
                  value={bizDraft.open}
                  onChange={(e) => updateBizDraft({ open: e.target.value })}
                  className={`${inputClass} tabular-nums`}
                />
              </label>
              <label className="sm:w-40">
                <span className="text-espresso/70 text-xs font-medium block mb-1">Закрытие</span>
                <input
                  type="time"
                  value={bizDraft.close}
                  onChange={(e) => updateBizDraft({ close: e.target.value })}
                  className={`${inputClass} tabular-nums`}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              {bizDraft.open !== "" && bizDraft.close !== "" && bizDraft.open >= bizDraft.close && (
                <span className="text-oxblood text-xs mr-auto">
                  Время закрытия должно быть позже открытия.
                </span>
              )}
              {bizSavedFlag && !bizDirty(bizDraft, bizSaved) && (
                <span className="text-espresso/60 text-xs" role="status">Сохранено</span>
              )}
              <button
                onClick={handleSaveBusiness}
                disabled={!bizDirty(bizDraft, bizSaved) || !bizValid(bizDraft) || bizSaving}
                className="shrink-0 bg-amber text-ivory text-sm font-semibold
                           px-5 py-2.5 rounded-xl
                           hover:bg-amber/90 transition-colors duration-150
                           disabled:bg-walnut/20 disabled:text-espresso/45 disabled:cursor-not-allowed
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-amber focus-visible:ring-offset-2
                           focus-visible:ring-offset-sand"
              >
                {bizSaving ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
          </div>
        )}

        {/* ── Current services ───────────────────────────────────────────── */}
        <h2 className="text-2xl font-semibold tracking-tight text-espresso mb-6">
          Услуги
        </h2>
        {loading ? (
          <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-6">
            <p className="text-espresso/60 text-sm">Загрузка…</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-6">
            <p className="text-espresso/60 text-sm">Услуг пока нет. Добавьте первую ниже.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {services.map((s) => {
              const d = drafts[s.id] ?? toDraft(s);
              const dirty = draftDirty(d, s);
              const valid = draftValid(d);
              const armed = armedDeleteId === s.id;
              return (
                <li
                  key={s.id}
                  className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-5
                             flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 min-w-0">
                      <span className="text-espresso/70 text-xs font-medium block mb-1">Название</span>
                      <input
                        type="text"
                        value={d.name}
                        onChange={(e) => updateDraft(s.id, { name: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="sm:w-28">
                      <span className="text-espresso/70 text-xs font-medium block mb-1">Минут</span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={d.duration}
                        onChange={(e) => updateDraft(s.id, { duration: e.target.value })}
                        className={`${inputClass} tabular-nums`}
                      />
                    </label>
                    <label className="sm:w-28">
                      <span className="text-espresso/70 text-xs font-medium block mb-1">Цена, ₼</span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={d.price}
                        onChange={(e) => updateDraft(s.id, { price: e.target.value })}
                        className={`${inputClass} tabular-nums`}
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Delete — oxblood, two-click confirm, no modal */}
                    <button
                      onClick={() => handleDeleteClick(s.id)}
                      className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium
                                  transition-colors duration-150
                                  focus-visible:outline-none focus-visible:ring-2
                                  focus-visible:ring-oxblood focus-visible:ring-offset-2
                                  focus-visible:ring-offset-sand
                        ${armed
                          ? "bg-oxblood text-ivory hover:bg-oxblood/90 disabled:opacity-60"
                          : "text-oxblood border border-oxblood/40 hover:bg-oxblood/10"
                        }`}
                      disabled={armed && deleteCooling}
                    >
                      {armed ? "Подтвердите удаление" : "Удалить"}
                    </button>

                    <div className="flex items-center gap-3">
                      {savedId === s.id && !dirty && (
                        <span className="text-espresso/60 text-xs" role="status">Сохранено</span>
                      )}
                      {/* Save — amber primary, active only when there are valid edits */}
                      <button
                        onClick={() => handleSave(s.id)}
                        disabled={!dirty || !valid || savingId === s.id}
                        className="shrink-0 bg-amber text-ivory text-sm font-semibold
                                   px-5 py-2.5 rounded-xl
                                   hover:bg-amber/90 transition-colors duration-150
                                   disabled:bg-walnut/20 disabled:text-espresso/45 disabled:cursor-not-allowed
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-amber focus-visible:ring-offset-2
                                   focus-visible:ring-offset-sand"
                      >
                        {savingId === s.id ? "Сохранение…" : "Сохранить"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* ── Add new service ────────────────────────────────────────────── */}
        <h2 className="text-2xl font-semibold tracking-tight text-espresso mt-12 mb-6">
          Новая услуга
        </h2>
        <div className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 min-w-0">
              <span className="text-espresso/70 text-xs font-medium block mb-1">Название</span>
              <input
                type="text"
                placeholder="Напр. Стрижка"
                value={newSvc.name}
                onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="sm:w-28">
              <span className="text-espresso/70 text-xs font-medium block mb-1">Минут</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="30"
                value={newSvc.duration}
                onChange={(e) => setNewSvc({ ...newSvc, duration: e.target.value })}
                className={`${inputClass} tabular-nums`}
              />
            </label>
            <label className="sm:w-28">
              <span className="text-espresso/70 text-xs font-medium block mb-1">Цена, ₼</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="30"
                value={newSvc.price}
                onChange={(e) => setNewSvc({ ...newSvc, price: e.target.value })}
                className={`${inputClass} tabular-nums`}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!draftValid(newSvc) || adding}
              className="shrink-0 bg-amber text-ivory text-sm font-semibold
                         px-5 py-2.5 rounded-xl
                         hover:bg-amber/90 transition-colors duration-150
                         disabled:bg-walnut/20 disabled:text-espresso/45 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-amber focus-visible:ring-offset-2
                         focus-visible:ring-offset-sand"
            >
              {adding ? "Добавление…" : "Добавить услугу"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
