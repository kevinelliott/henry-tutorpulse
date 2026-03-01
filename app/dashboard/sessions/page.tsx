"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, Student } from "@/lib/supabase";

const statusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-blue-100 text-blue-700",
  no_show: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<(Session & { students: { name: string } | null })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tutorId, setTutorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    duration_min: 60,
    prep_time_min: 15,
    travel_time_min: 0,
    rate: 60,
    materials_cost: 0,
    status: "completed",
    notes: "",
  });

  async function loadData(tid: string) {
    const [{ data: sess }, { data: studs }] = await Promise.all([
      supabase.from("sessions").select("*, students(name)").eq("tutor_id", tid).order("date", { ascending: false }).limit(50),
      supabase.from("students").select("*").eq("tutor_id", tid).eq("status", "active").order("name"),
    ]);
    setSessions(sess || []);
    setStudents(studs || []);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: tutor } = await supabase.from("tutors").select("id, hourly_default").eq("auth_id", data.session.user.id).single();
      if (tutor) {
        setTutorId(tutor.id);
        setForm((f) => ({ ...f, rate: tutor.hourly_default }));
        await loadData(tutor.id);
      } else setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("sessions").insert({ ...form, tutor_id: tutorId, skill_scores: {} });
    setSaving(false);
    setShowAdd(false);
    await loadData(tutorId);
  }

  if (loading) return <div className="p-8 text-slate-400 animate-pulse">Loading sessions...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Sessions</h1>
          <p className="text-slate-500 text-sm">{sessions.length} sessions logged</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-500">
          + Log Session
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-indigo-200 rounded-xl p-6 mb-6">
          <h2 className="font-bold mb-4">Log Session</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Student *</label>
              <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">Select student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Math, SAT Prep..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            {[
              { key: "duration_min", label: "Duration (min)", min: 1 },
              { key: "prep_time_min", label: "Prep Time (min)" },
              { key: "travel_time_min", label: "Travel Time (min)" },
              { key: "rate", label: "Hourly Rate ($)", step: "0.01" },
              { key: "materials_cost", label: "Materials Cost ($)", step: "0.01" },
            ].map(({ key, label, min, step }) => (
              <div key={key}>
                <label className="block text-sm text-slate-600 mb-1">{label}</label>
                <input type="number" min={min || 0} step={step || "1"} value={(form as Record<string, number | string>)[key] as number} onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            ))}
            <div>
              <label className="block text-sm text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="completed">Completed</option>
                <option value="scheduled">Scheduled</option>
                <option value="no_show">No Show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-slate-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">{saving ? "Saving..." : "Log Session"}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-500 px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-4">📅</div>
          <p>No sessions yet. Log your first session above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">True Rate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const totalTime = (s.duration_min + s.prep_time_min + s.travel_time_min) / 60;
                const revenue = (s.rate * s.duration_min) / 60 - s.materials_cost;
                const trueRate = totalTime > 0 ? revenue / totalTime : 0;
                const studentName = (s as unknown as { students: { name: string } | null }).students?.name || "Unknown";
                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-700">{s.date}</td>
                    <td className="px-4 py-3 text-sm font-medium">{studentName}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{s.subject || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.duration_min}min</td>
                    <td className="px-4 py-3 text-sm font-semibold">${revenue.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">${trueRate.toFixed(0)}/hr</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || statusColors.cancelled}`}>{s.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
