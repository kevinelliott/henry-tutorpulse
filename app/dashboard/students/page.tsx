"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Student, Session } from "@/lib/supabase";

type StudentWithStats = Student & {
  profitGrade: string;
  reliabilityScore: number;
  totalSessions: number;
  totalRevenue: number;
};

function gradeColor(grade: string) {
  const colors: Record<string, string> = { A: "bg-emerald-100 text-emerald-700", B: "bg-green-100 text-green-700", C: "bg-yellow-100 text-yellow-700", D: "bg-orange-100 text-orange-700", F: "bg-red-100 text-red-700", "N/A": "bg-slate-100 text-slate-500" };
  return colors[grade] || colors["N/A"];
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [tutorId, setTutorId] = useState("");
  const [hourlyDefault, setHourlyDefault] = useState(60);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", parent_name: "", parent_email: "", grade_level: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function loadStudents(tid: string, hd: number) {
    const { data: studs } = await supabase.from("students").select("*").eq("tutor_id", tid).order("name");
    const { data: sessions } = await supabase.from("sessions").select("*").eq("tutor_id", tid);

    const withStats: StudentWithStats[] = (studs || []).map((s: Student) => {
      const ss = (sessions || []).filter((x: Session) => x.student_id === s.id);
      const completed = ss.filter((x: Session) => x.status === "completed");
      const noShows = ss.filter((x: Session) => x.status === "no_show").length;
      const total = ss.filter((x: Session) => x.status !== "scheduled").length;
      const reliability = total > 0 ? Math.round(((total - noShows) / total) * 100) : 100;
      const totalRevenue = completed.reduce((sum: number, x: Session) => sum + (x.rate * x.duration_min) / 60, 0);

      // Profit grade
      const grades = completed.map((x: Session) => {
        const totalTime = (x.duration_min + x.prep_time_min + x.travel_time_min) / 60;
        const rev = (x.rate * x.duration_min) / 60 - x.materials_cost;
        return totalTime > 0 ? rev / totalTime : 0;
      });
      const avgRate = grades.length > 0 ? grades.reduce((a: number, b: number) => a + b, 0) / grades.length : -1;
      let grade = "N/A";
      if (avgRate >= 0) {
        const pct = avgRate / hd;
        grade = pct >= 0.9 ? "A" : pct >= 0.7 ? "B" : pct >= 0.5 ? "C" : pct >= 0.3 ? "D" : "F";
      }

      return { ...s, profitGrade: grade, reliabilityScore: reliability, totalSessions: completed.length, totalRevenue };
    });
    setStudents(withStats);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: tutor } = await supabase.from("tutors").select("id, hourly_default").eq("auth_id", data.session.user.id).single();
      if (tutor) { setTutorId(tutor.id); setHourlyDefault(tutor.hourly_default); await loadStudents(tutor.id, tutor.hourly_default); }
      else setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("students").insert({ ...form, tutor_id: tutorId, subjects: [] });
    setForm({ name: "", parent_name: "", parent_email: "", grade_level: "", notes: "" });
    setShowAdd(false);
    setSaving(false);
    await loadStudents(tutorId, hourlyDefault);
  }

  if (loading) return <div className="p-8 text-slate-400 animate-pulse">Loading students...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Students</h1>
          <p className="text-slate-500 text-sm">{students.length} students · Profitability graded A–F</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-500 transition-colors">
          + Add Student
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-indigo-200 rounded-xl p-6 mb-6">
          <h2 className="font-bold mb-4">New Student</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Student Name *", required: true },
              { key: "grade_level", label: "Grade Level" },
              { key: "parent_name", label: "Parent Name" },
              { key: "parent_email", label: "Parent Email", type: "email" },
            ].map(({ key, label, required, type }) => (
              <div key={key}>
                <label className="block text-sm text-slate-600 mb-1">{label}</label>
                <input
                  type={type || "text"}
                  required={required}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Add Student"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-500 px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Student list */}
      {students.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-4">👥</div>
          <p>No students yet. Add your first student to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Grade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Profitability</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Reliability</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sessions</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-slate-400">{s.parent_name || "No parent info"}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{s.grade_level || "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${gradeColor(s.profitGrade)}`}>{s.profitGrade}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.reliabilityScore >= 80 ? "bg-emerald-500" : s.reliabilityScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${s.reliabilityScore}%` }} />
                      </div>
                      <span className="text-xs text-slate-600">{s.reliabilityScore}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{s.totalSessions}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">${s.totalRevenue.toFixed(0)}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
