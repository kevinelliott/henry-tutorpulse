"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, Student } from "@/lib/supabase";

type Stats = {
  weekRevenue: number;
  weekHours: number;
  activeStudents: number;
  avgProfitability: string;
  totalSessions: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSessions, setRecentSessions] = useState<(Session & { students: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: tutor } = await supabase
        .from("tutors")
        .select("id, hourly_default")
        .eq("auth_id", session.user.id)
        .single();
      if (!tutor) { setLoading(false); return; }

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];

      const [{ data: allSessions }, { data: students }, { data: weekSessions }] = await Promise.all([
        supabase.from("sessions").select("*").eq("tutor_id", tutor.id),
        supabase.from("students").select("id").eq("tutor_id", tutor.id).eq("status", "active"),
        supabase.from("sessions").select("*, students(name)").eq("tutor_id", tutor.id).gte("date", weekAgoStr).order("date", { ascending: false }).limit(5),
      ]);

      const completed = (allSessions || []).filter((s: Session) => s.status === "completed");
      const weekCompleted = (weekSessions || []).filter((s: Session) => s.status === "completed");

      // Calculate avg profitability grade
      const profitGrades = completed.map((s: Session) => {
        const totalTime = (s.duration_min + s.prep_time_min + s.travel_time_min) / 60;
        const revenue = (s.rate * s.duration_min) / 60 - s.materials_cost;
        const trueRate = totalTime > 0 ? revenue / totalTime : 0;
        if (trueRate >= tutor.hourly_default * 0.9) return 4;
        if (trueRate >= tutor.hourly_default * 0.7) return 3;
        if (trueRate >= tutor.hourly_default * 0.5) return 2;
        if (trueRate >= tutor.hourly_default * 0.3) return 1;
        return 0;
      });
      const avgGrade = profitGrades.length > 0 ? profitGrades.reduce((a: number, b: number) => a + b, 0) / profitGrades.length : -1;
      const gradeStr = avgGrade >= 3.5 ? "A" : avgGrade >= 2.5 ? "B" : avgGrade >= 1.5 ? "C" : avgGrade >= 0.5 ? "D" : avgGrade >= 0 ? "F" : "N/A";

      setStats({
        weekRevenue: weekCompleted.reduce((sum: number, s: Session) => sum + (s.rate * s.duration_min) / 60, 0),
        weekHours: weekCompleted.reduce((sum: number, s: Session) => sum + s.duration_min, 0) / 60,
        activeStudents: (students || []).length,
        avgProfitability: gradeStr,
        totalSessions: completed.length,
      });
      setRecentSessions(weekSessions || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8"><div className="animate-pulse text-slate-400">Loading dashboard...</div></div>;

  const statCards = [
    { label: "This Week Revenue", value: stats ? `$${stats.weekRevenue.toFixed(0)}` : "$0", icon: "💵", color: "emerald" },
    { label: "This Week Hours", value: stats ? `${stats.weekHours.toFixed(1)}h` : "0h", icon: "⏱️", color: "blue" },
    { label: "Active Students", value: stats?.activeStudents ?? 0, icon: "👥", color: "purple" },
    { label: "Avg Profitability", value: stats?.avgProfitability ?? "N/A", icon: "📈", color: "amber" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-900 mb-2">Dashboard</h1>
      <p className="text-slate-500 mb-8">Your tutoring business at a glance</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-black text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Recent Sessions</h2>
          <a href="/dashboard/sessions" className="text-sm text-indigo-600 hover:underline">View all →</a>
        </div>
        {recentSessions.length === 0 ? (
          <div className="text-slate-400 text-sm py-8 text-center">
            No sessions yet. <a href="/dashboard/sessions" className="text-indigo-600 hover:underline">Log your first session →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <div className="font-medium text-sm">{(s as unknown as { students: { name: string } | null }).students?.name || "Unknown"}</div>
                  <div className="text-xs text-slate-400">{s.date} · {s.subject} · {s.duration_min}min</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">${((s.rate * s.duration_min) / 60).toFixed(0)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    s.status === "no_show" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { href: "/dashboard/students", label: "Add Student", icon: "➕" },
          { href: "/dashboard/sessions", label: "Log Session", icon: "📝" },
          { href: "/dashboard/intelligence", label: "View Intelligence", icon: "🧠" },
          { href: "/dashboard/reports", label: "Generate Report", icon: "📋" },
        ].map((l) => (
          <a key={l.href} href={l.href} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all group">
            <span className="text-xl">{l.icon}</span>
            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{l.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
