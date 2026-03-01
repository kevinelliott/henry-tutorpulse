"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, Student } from "@/lib/supabase";

type StudentAttendance = {
  id: string;
  name: string;
  total: number;
  completed: number;
  noShows: number;
  reliability: number;
  riskLevel: "high" | "medium" | "low";
  recommendation: string;
};

export default function AttendancePanel({ tutorId }: { tutorId: string }) {
  const [data, setData] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tutorId) return;
    Promise.all([
      supabase.from("students").select("*").eq("tutor_id", tutorId).eq("status", "active"),
      supabase.from("sessions").select("*").eq("tutor_id", tutorId),
    ]).then(([{ data: studs }, { data: sessions }]) => {
      const result: StudentAttendance[] = (studs || []).map((s: Student) => {
        const ss = (sessions || []).filter((x: Session) => x.student_id === s.id && x.status !== "scheduled");
        const completed = ss.filter((x: Session) => x.status === "completed").length;
        const noShows = ss.filter((x: Session) => x.status === "no_show").length;
        const total = ss.length;
        const reliability = total > 0 ? Math.round((completed / total) * 100) : 100;
        const noShowRate = total > 0 ? noShows / total : 0;
        const riskLevel: StudentAttendance["riskLevel"] = noShowRate >= 0.3 ? "high" : noShowRate >= 0.15 ? "medium" : "low";
        const recommendation = riskLevel === "high"
          ? "Require deposit or prepayment before scheduling"
          : riskLevel === "medium"
          ? "Consider sending reminders 24h before sessions"
          : "Reliable student — no action needed";
        return { id: s.id, name: s.name, total, completed, noShows, reliability, riskLevel, recommendation };
      });
      result.sort((a, b) => a.reliability - b.reliability);
      setData(result);
      setLoading(false);
    });
  }, [tutorId]);

  if (loading) return <div className="animate-pulse text-slate-400">Analyzing attendance...</div>;

  const highRisk = data.filter((d) => d.riskLevel === "high");

  return (
    <div>
      {highRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-red-700 mb-2">🚨 High Risk Students ({highRisk.length})</h3>
          <p className="text-sm text-red-600 mb-3">These students have a no-show rate ≥30%. Require prepayment.</p>
          {highRisk.map((s) => (
            <div key={s.id} className="bg-red-100 rounded-lg px-4 py-2 mb-2 flex justify-between items-center">
              <span className="font-semibold text-red-800">{s.name}</span>
              <span className="text-sm text-red-700">{s.noShows} no-shows / {s.total} sessions ({s.reliability}% reliable)</span>
            </div>
          ))}
        </div>
      )}

      {data.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <div className="text-4xl mb-4">📅</div>
          <p>No attendance data yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Reliability</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">No-Shows</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-sm">{s.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.reliability >= 85 ? "bg-emerald-500" : s.reliability >= 70 ? "bg-yellow-400" : "bg-red-500"}`} style={{ width: `${s.reliability}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{s.reliability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{s.noShows} / {s.total}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.riskLevel === "high" ? "bg-red-100 text-red-700" : s.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {s.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{s.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
