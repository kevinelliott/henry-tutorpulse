"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@/lib/supabase";

type SubjectData = {
  subject: string;
  sessions: number;
  revenue: number;
  avgTrueRate: number;
  noShowRate: number;
  marginGrade: string;
};

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function DemandPanel({ tutorId }: { tutorId: string }) {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [seasonal, setSeasonal] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tutorId) return;
    supabase.from("sessions").select("*").eq("tutor_id", tutorId).then(({ data: sessions }) => {
      const completed = (sessions || []).filter((x: Session) => x.status === "completed");
      const all = sessions || [];

      // Group by subject
      const subMap: Record<string, Session[]> = {};
      all.forEach((s: Session) => {
        const subj = s.subject || "Other";
        if (!subMap[subj]) subMap[subj] = [];
        subMap[subj].push(s);
      });

      const subjectData: SubjectData[] = Object.entries(subMap).map(([subject, ss]) => {
        const comp = ss.filter((x) => x.status === "completed");
        const noShows = ss.filter((x) => x.status === "no_show").length;
        const total = ss.filter((x) => x.status !== "scheduled").length;
        const revenue = comp.reduce((sum, x) => sum + (x.rate * x.duration_min) / 60 - x.materials_cost, 0);
        const rates = comp.map((x) => {
          const t = (x.duration_min + x.prep_time_min + x.travel_time_min) / 60;
          return t > 0 ? ((x.rate * x.duration_min) / 60 - x.materials_cost) / t : 0;
        });
        const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
        const noShowRate = total > 0 ? noShows / total : 0;
        const grade = avgRate >= 80 ? "A" : avgRate >= 60 ? "B" : avgRate >= 40 ? "C" : avgRate >= 20 ? "D" : comp.length === 0 ? "N/A" : "F";
        return { subject, sessions: ss.length, revenue, avgTrueRate: avgRate, noShowRate, marginGrade: grade };
      });
      subjectData.sort((a, b) => b.revenue - a.revenue);
      setSubjects(subjectData);

      // Seasonal: sessions per month
      const monthCounts: Record<string, number> = {};
      completed.forEach((s: Session) => {
        const month = months[new Date(s.date).getMonth()];
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
      setSeasonal(monthCounts);
      setLoading(false);
    });
  }, [tutorId]);

  if (loading) return <div className="animate-pulse text-slate-400">Analyzing demand...</div>;
  const maxMonth = Math.max(...Object.values(seasonal), 1);

  return (
    <div className="space-y-6">
      {/* Subject margins */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Subject Margins</h3>
          <p className="text-xs text-slate-400 mt-1">Which subjects are most profitable?</p>
        </div>
        {subjects.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No session data yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-500 uppercase">Subject</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Sessions</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Avg Rate</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">No-Show %</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.subject} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 font-medium text-sm">{s.subject}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{s.sessions}</td>
                  <td className="px-4 py-3 text-sm font-semibold">${s.revenue.toFixed(0)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">${s.avgTrueRate.toFixed(0)}/hr</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{(s.noShowRate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      s.marginGrade === "A" ? "bg-emerald-100 text-emerald-700" :
                      s.marginGrade === "B" ? "bg-green-100 text-green-700" :
                      s.marginGrade === "C" ? "bg-yellow-100 text-yellow-700" :
                      s.marginGrade === "D" ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>{s.marginGrade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Seasonal chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-1">Seasonal Demand</h3>
        <p className="text-xs text-slate-400 mb-4">Sessions per month across all time</p>
        {Object.keys(seasonal).length === 0 ? (
          <p className="text-slate-400 text-sm">Log sessions across multiple months to see patterns.</p>
        ) : (
          <div className="flex items-end gap-1 h-24">
            {months.map((m) => {
              const count = seasonal[m] || 0;
              const height = maxMonth > 0 ? (count / maxMonth) * 100 : 0;
              return (
                <div key={m} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-end" style={{ height: 80 }}>
                    <div className="w-full bg-indigo-500 rounded-t-sm transition-all" style={{ height: `${height}%` }} title={`${m}: ${count} sessions`} />
                  </div>
                  <span className="text-xs text-slate-400 mt-1">{m.slice(0,1)}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 text-xs text-slate-400">
          💡 Typical peaks: March–May (SAT prep), August–September (back to school), November (finals prep)
        </div>
      </div>
    </div>
  );
}
