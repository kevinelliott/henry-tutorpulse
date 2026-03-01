"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/students", label: "Students", icon: "👥" },
  { href: "/dashboard/sessions", label: "Sessions", icon: "📅" },
  { href: "/dashboard/intelligence", label: "Intelligence", icon: "🧠" },
  { href: "/dashboard/reports", label: "Reports", icon: "📋" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tutorName, setTutorName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push("/auth?mode=login");
        return;
      }
      const { data: tutor } = await supabase
        .from("tutors")
        .select("name")
        .eq("auth_id", data.session.user.id)
        .single();
      if (tutor) setTutorName(tutor.name);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-indigo-950 text-white flex flex-col min-h-screen">
        <div className="p-5 border-b border-indigo-800">
          <div className="font-black text-xl text-indigo-300">TutorPulse</div>
          <div className="text-xs text-indigo-400 mt-1">{tutorName || "Loading..."}</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-700 text-white"
                    : "text-indigo-300 hover:bg-indigo-800 hover:text-white"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-indigo-400 hover:text-white transition-colors px-3 py-2"
          >
            → Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
