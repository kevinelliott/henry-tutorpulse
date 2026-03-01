"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, Student } from "@/lib/supabase";

type StudentProgress = {
  id: string;
  name: string;
  skills: Record<string, { scores: number[]; dates: string[]; trend: "improving" | "plateau" | "regression" | "insufficient" }>;
  alert: string | null;
};

function detectTrend(scores: number[]): "improving" | "plateau" | "regression" | "insufficient" {
  if (scores.length < 3) return "insufficient";
  const recent = scores.slice(-3);
  const delta = recent[2] - recent[0];
  if (delta >= 1) return "improving";
  if (delta <= -1) return "regression";
  return "plateau";
}

export default function ProgressPanel({ tutorId }: { tutorId: string }) {
  const [data, setData] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tutorId) return;
    Promise.all([
      supabase.from("students").select("*").eq("tutor_id", tutorId).eq("status", "active"),
      supabase.from("sessions").select("*").eq("tutor_id", tutorId).eq("status", "completed").order("date", { ascending: true }),
    ]).then(([{ data: studs }, { data: sessions }]) => {
      const result: StudentProgress[] = (studs || []).map((s: Student) => {
        const ss = (sessions || []).filter((x: Session) => x.student_id === s.id);
        const skillMap: Record<string, { scores: number[]; dates: string[] }> = {};

        ss.forEach((sess: Session) => {
          Object.entries(sess.skill_scores || {}).forEach(([skill, score]) => {
            if (!skillMap[skill]) skillMap[skill] = { scores: [], dates: [] };
            skillMap[skill].scores.push(score as number);
            skillMap[skill].dates.push(sess.date);
          });
        });

        const skills: StudentProgress["skills"] = {};
        const alerts: string[] = [];

        Object.entries(skillMap).forEach(([skill, { scores, dates }]) => {
          const trend = detectTrend(scores);
          skills[skill] = { scores, dates, trend };
          if (trend === "plateau" && scores.length >= 4) alerts.push(`Plateau in ${skill} (${scores.length} sessions, stuck at ~${scores[scores.length-1]})`);
          if (trend === "regression") alerts.push(`Regression in ${skill}!`);
        });

        return { id: s.id, name: s.name, skills, alert: alerts.length > 0 ? alerts.join("; ") : null };
      });
      setData(result.filter((s) => Object.keys(s.skills).length > 0 || s.alert));
      setLoading(false);
    });
  }, [tutorId]);

  if (loading) return <div className="animate-pulse text-slate-400">Analyzing progress...</div>;

  const alerts = data.filter((d) => d.alert);

  return (
    <div>
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-amber-700 mb-3">⚠️ Progress Alerts ({alerts.length})</h3>
          {alerts.map((s) => (
            <div key={s.id} className="mb-2">
              <span className="font-semibold text-sm text-amber-800">{s.name}:</span>
              <span className="text-sm text-amber-700 ml-2">{s.alert}</span>
            </div>
          ))}
        </div>
      )}

      {data.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <div className="text-4xl mb-4">📈</div>
          <p>No skill scores logged yet.</p>
          <p className="text-sm mt-2">When logging sessions, add skill scores (1-10) to track progress over time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-3">{s.name}</h3>
              {Object.entries(s.skills).map(([skill, { scores, trend }]) => (
                <div key={skill} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">{skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      trend === "improving" ? "bg-emerald-100 text-emerald-700" :
                      trend === "regression" ? "bg-red-100 text-red-700" :
                      trend === "plateau" ? "bg-yellow-100 text-yellow-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {trend === "improving" ? "↑ Improving" : trend === "regression" ? "↓ Regression" : trend === "plateau" ? "→ Plateau" : "Insufficient data"}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">Latest: {scores[scores.length-1]}/10</span>
                  </div>
                  <div className="flex gap-1">
                    {scores.map((score, i) => (
                      <div key={i} className="flex-1 max-w-8 flex flex-col items-center">
                        <div className="w-full bg-slate-100 rounded-sm overflow-hidden" style={{ height: 32 }}>
                          <div className={`w-full rounded-sm ${score >= 8 ? "bg-emerald-400" : score >= 6 ? "bg-blue-400" : score >= 4 ? "bg-yellow-400" : "bg-red-400"}`} style={{ height: `${score * 10}%`, marginTop: `${100 - score * 10}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 mt-0.5">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
