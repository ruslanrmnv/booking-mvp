"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BUSINESS_NAME } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-ivory text-espresso flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-espresso text-lg font-semibold tracking-tight text-center mb-8">
          {BUSINESS_NAME}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-espresso mb-8 text-center">
          Sign in
        </h1>

        <form onSubmit={handleLogin} className="bg-sand rounded-2xl border border-walnut/40 shadow-md p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-espresso/80 block mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ivory text-espresso text-base px-5 py-4 rounded-xl
                         border border-walnut/20 focus:outline-none focus:border-amber
                         focus:ring-2 focus:ring-amber/50 transition-colors duration-150"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-espresso/80 block mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ivory text-espresso text-base px-5 py-4 rounded-xl
                         border border-walnut/20 focus:outline-none focus:border-amber
                         focus:ring-2 focus:ring-amber/50 transition-colors duration-150"
            />
          </div>

          {error && (
            <p className="text-oxblood text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-ivory text-base font-semibold py-4 rounded-xl
                       hover:bg-amber/90 transition-colors duration-150
                       disabled:bg-walnut/20 disabled:text-espresso/45 disabled:cursor-not-allowed
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber
                       focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
