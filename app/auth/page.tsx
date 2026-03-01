"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    (params.get("mode") as "login" | "signup") || "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/dashboard");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          // Create tutor profile
          await supabase.from("tutors").insert({
            auth_id: data.user.id,
            email,
            name: name || email.split("@")[0],
            business_name: businessName,
            hourly_default: 60,
          });
        }
        setMessage("Check your email to confirm your account, then log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-indigo-300">TutorPulse</Link>
          <p className="text-indigo-300 mt-2">
            {mode === "login" ? "Welcome back" : "Start your 30-day free trial"}
          </p>
        </div>

        <div className="bg-white/5 border border-indigo-700 rounded-2xl p-8 backdrop-blur">
          <div className="flex gap-2 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  mode === m ? "bg-indigo-500 text-white" : "text-indigo-300 hover:text-white"
                }`}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-sm text-indigo-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Johnson"
                    className="w-full bg-white/10 border border-indigo-600 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-indigo-300 mb-1">Business Name (optional)</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Johnson Tutoring"
                    className="w-full bg-white/10 border border-indigo-600 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-indigo-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/10 border border-indigo-600 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm text-indigo-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-indigo-600 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-emerald-400 text-sm">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? "..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-indigo-400 text-sm mt-4">
          <Link href="/" className="hover:text-indigo-200">← Back to TutorPulse</Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
