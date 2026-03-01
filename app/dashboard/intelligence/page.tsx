"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProfitabilityPanel from "@/components/intelligence/ProfitabilityPanel";
import ProgressPanel from "@/components/intelligence/ProgressPanel";
import AttendancePanel from "@/components/intelligence/AttendancePanel";
import DemandPanel from "@/components/intelligence/DemandPanel";

const tabs = [
  { id: "profitability", label: "💰 Profitability", desc: "True hourly rates per student" },
  { id: "progress", label: "📈 Progress", desc: "Skill trends & plateau alerts" },
  { id: "attendance", label: "🚨 Attendance", desc: "No-show risk & reliability" },
  { id: "demand", label: "📊 Demand", desc: "Subject margins & seasonality" },
];

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState("profitability");
  const [tutorId, setTutorId] = useState("");
  const [hourlyDefault, setHourlyDefault] = useState(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: tutor } = await supabase.from("tutors").select("id, hourly_default").eq("auth_id", data.session.user.id).single();
      if (tutor) { setTutorId(tutor.id); setHourlyDefault(tutor.hourly_default); }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-slate-400 animate-pulse">Loading intelligence...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-900 mb-2">Intelligence</h1>
      <p className="text-slate-500 mb-6">Data-driven insights your competitors don't have.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="min-h-96">
        {activeTab === "profitability" && <ProfitabilityPanel tutorId={tutorId} hourlyDefault={hourlyDefault} />}
        {activeTab === "progress" && <ProgressPanel tutorId={tutorId} />}
        {activeTab === "attendance" && <AttendancePanel tutorId={tutorId} />}
        {activeTab === "demand" && <DemandPanel tutorId={tutorId} />}
      </div>
    </div>
  );
}
