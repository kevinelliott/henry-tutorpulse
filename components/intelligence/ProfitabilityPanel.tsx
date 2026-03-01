"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, Student } from "@/lib/supabase";

type StudentProfit = {
  id: string;
  name: string;
  trueRate: number;
  revenue: number;
  grade: string;
  sessions: number;
  wastedHours: number;
};

function gradeColor(g: string) {
  return { A: "text-emerald-600 bg-emerald-50", B: "text-green-600 bg-green-50", C: "text-yellow-600 bg-yellow-50", D: "text-orange-600 bg-orange-50", F: "text-red-600 bg-red-50", "N/A": "text-slate-400 bg-slate-50" }[g] || "text-slate-400 bg-slate-50";
}

export default function ProfitabilityPanel({ tutorId, hourlyDefault }: { tutorId: string; hourlyDefault: number }) {
  const [data, setData] = useState<StudentProfit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tutorId) return;
    Promise.all([
      supabase.from("students").select("*").eq("tutor_id", tutorId).eq("status", "active"),
      supabase.from("sessions").select("*").eq("tutor_id", tutorId).eq("status", "completed"),
    ]).then(([{ data: studs }, { data: sessions }]) => {
      const result: StudentProfit[] = (studs || []).map((s: Student) => {
        const ss = (sessions || []).filter((x: Session) => x.student_id === s.id);
        const totalRevenue = ss.reduce((sum: number, x: Session) => sum + (x.rate * x.duration_min) / 60 - x.materials_cost, 0);
        const totalTime = ss.reduce((sum: number, x: Session) => sum + (x.duration_min + x.prep_time_min + x.travel_time_min) / 60, 0);
        const paidTime = ss.reduce((sum: number, x: Session) => sum + x.duration_min / 60, 0);
        const trueRate = totalTime > 0 ? totalRevenue / totalTime : 0;
        const wastedHours = totalTime - paidTime;
        const pct = hourlyDefault > 0 ? trueRate / hourlyDefault : 0;
        const grade = ss.length === 0 ? "N/A" : pct >= 0.9 ? "A" : pct >= 0.7 ? "B" : pct >= 0.5 ? "C" : pct >= 0.3 ? "D" : "F";
        return { id: s.id, name: s.name, trueRate, revenue: totalRevenue, grade, sessions: ss.length, wastedHours };
      });
      result.sort((a, b) => b.trueRate - a.trueRate);
      setData(result);
      setLoading(false);
    });
  }, [tutorId, hourlyDefault]);

  if (loading) return <div className="animate-pulse text-slate-400">Calculating profitability...</div>;

  const losers = data.filter((d) => d.grade === "D" || d.grade === "F");

  return (
    <div>
      {losers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-red-700 mb-2">⚠️ Money Losers ({losers.length})</h3>
          <p className="text-sm text-red-600">These students cost more than they earn when prep & travel time is factored in. Consider raising rates or reducing prep time.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {losers.map((s) => (
              <span key={s.id} className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-medium">{s.name} (${s.trueRate.toFixed(0)}/hr)</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Grade</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">True Rate</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Revenue</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Wasted Hours</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">No session data yet. Log sessions to see profitability.</td></tr>
            ) : data.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-sm">{s.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${gradeColor(s.grade)}`}>{s.grade}</span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-700">${s.trueRate.toFixed(0)}/hr</td>
                <td className="px-4 py-3 text-sm text-slate-600">${s.revenue.toFixed(0)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{s.wastedHours.toFixed(1)}h</td>
                <td className="px-4 py-3 text-sm text-slate-500">{s.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">True rate = revenue ÷ (session + prep + travel time). Your target: ${hourlyDefault}/hr.</p>
    </div>
  );
}
