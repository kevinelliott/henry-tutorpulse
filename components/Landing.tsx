"use client";
import Link from "next/link";

const competitors = [
  { name: "Teachworks", price: "$16/mo", profitability: false, progress: false, noshow: false, reports: false },
  { name: "TutorBird", price: "$12/mo", profitability: false, progress: false, noshow: false, reports: false },
  { name: "TutorPulse", price: "$15/mo", profitability: true, progress: true, noshow: true, reports: true, highlight: true },
];

const Check = () => <span className="text-emerald-500 font-bold">✓</span>;
const X = () => <span className="text-red-400">✗</span>;

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-indigo-300">TutorPulse</span>
          <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">BETA</span>
        </div>
        <div className="flex gap-4">
          <Link href="/auth?mode=login" className="text-indigo-200 hover:text-white transition-colors px-4 py-2">
            Log in
          </Link>
          <Link href="/auth?mode=signup" className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-5 py-2 rounded-lg transition-colors">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-block bg-indigo-800/50 text-indigo-300 text-sm px-4 py-1.5 rounded-full mb-6 border border-indigo-700">
          Built for independent tutors & small centers
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Know which students<br />
          <span className="text-indigo-300">make you money.</span>
        </h1>
        <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
          TutorPulse gives you profitability intelligence, progress tracking parents can see, and no-show predictions — all in one place. $15/mo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth?mode=signup" className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
            Start Free — 5 Students
          </Link>
          <Link href="#features" className="border border-indigo-600 text-indigo-200 hover:text-white hover:border-indigo-400 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            See Features
          </Link>
        </div>
      </section>

      {/* Intelligence Features */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-black text-center mb-4">4 Intelligence Layers</h2>
        <p className="text-indigo-300 text-center mb-12">The insights no other tutor tool gives you.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: "💰",
              title: "Per-Student Profitability",
              desc: "Track prep time, travel time, and materials cost per session. Get a true hourly rate and an A–F grade for every student. See exactly who's worth your time.",
              badge: "Grade A–F",
            },
            {
              icon: "📈",
              title: "Progress Trend Detection",
              desc: "Log skill scores per session. Auto-detect improvement velocity, plateau alerts, and regression warnings. 'Emma hasn't improved in math fundamentals in 4 weeks.'",
              badge: "Automated Alerts",
            },
            {
              icon: "🚨",
              title: "No-Show Prediction",
              desc: "Calculate reliability scores per student. Flag high-risk students before the week starts. Recommend deposit or prepay for chronic flakers.",
              badge: "Risk Scoring",
            },
            {
              icon: "📊",
              title: "Subject Demand Analysis",
              desc: "Which subjects have the highest margins? What's trending seasonally? Decide what to market with data, not guesswork.",
              badge: "Market Intel",
            },
          ].map((f) => (
            <div key={f.title} className="bg-indigo-900/50 border border-indigo-700 rounded-2xl p-6 hover:border-indigo-500 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-lg">{f.title}</h3>
                  <span className="text-xs bg-indigo-700 text-indigo-200 px-2 py-0.5 rounded-full">{f.badge}</span>
                </div>
              </div>
              <p className="text-indigo-300 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Parent Reports callout */}
        <div className="mt-8 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-700 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-2xl font-bold mb-2">Parent Progress Reports</h3>
          <p className="text-emerald-300 mb-4">
            Generate a professional, branded PDF-style report showing your student's skill progression over time. Give parents something tangible that justifies your rate.
          </p>
          <span className="bg-emerald-600 text-white text-sm px-3 py-1 rounded-full">Included in Pro & Studio</span>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="max-w-4xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-black text-center mb-4">How We Compare</h2>
        <p className="text-indigo-300 text-center mb-10">Same price as the others. 10x the intelligence.</p>
        <div className="bg-indigo-900/40 border border-indigo-700 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-indigo-700">
                <th className="text-left px-6 py-4 font-semibold text-indigo-300">Tool</th>
                <th className="px-4 py-4 font-semibold text-indigo-300 text-center">Price</th>
                <th className="px-4 py-4 font-semibold text-indigo-300 text-center">Profitability</th>
                <th className="px-4 py-4 font-semibold text-indigo-300 text-center">Progress Trends</th>
                <th className="px-4 py-4 font-semibold text-indigo-300 text-center">No-Show Predict</th>
                <th className="px-4 py-4 font-semibold text-indigo-300 text-center">Parent Reports</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c.name} className={`border-b border-indigo-800 last:border-0 ${c.highlight ? 'bg-indigo-700/30' : ''}`}>
                  <td className="px-6 py-4 font-bold">
                    {c.name}
                    {c.highlight && <span className="ml-2 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">YOU</span>}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold">{c.price}</td>
                  <td className="px-4 py-4 text-center">{c.profitability ? <Check /> : <X />}</td>
                  <td className="px-4 py-4 text-center">{c.progress ? <Check /> : <X />}</td>
                  <td className="px-4 py-4 text-center">{c.noshow ? <Check /> : <X />}</td>
                  <td className="px-4 py-4 text-center">{c.reports ? <Check /> : <X />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-black text-center mb-12">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Free",
              price: "$0",
              period: "forever",
              features: ["Up to 5 students", "Session logging", "Basic progress tracking", "Dashboard overview"],
              cta: "Get Started",
              href: "/auth?mode=signup",
            },
            {
              name: "Pro",
              price: "$15",
              period: "/mo",
              features: ["Unlimited students", "All 4 intelligence layers", "Parent progress reports", "No-show predictions", "Subject demand analysis"],
              cta: "Start Pro",
              href: "/auth?mode=signup&plan=pro",
              highlight: true,
            },
            {
              name: "Studio",
              price: "$35",
              period: "/mo",
              features: ["Multi-tutor support", "White-label reports", "API access", "Priority support", "Custom branding"],
              cta: "Contact Us",
              href: "mailto:hello@tutorpulse.io",
            },
          ].map((p) => (
            <div key={p.name} className={`rounded-2xl p-6 ${p.highlight ? 'bg-indigo-500 border-2 border-indigo-400' : 'bg-indigo-900/40 border border-indigo-700'}`}>
              {p.highlight && <div className="text-center text-xs font-bold text-indigo-200 mb-3 uppercase tracking-wider">Most Popular</div>}
              <h3 className="text-xl font-black mb-1">{p.name}</h3>
              <div className="text-4xl font-black mb-1">{p.price}<span className="text-lg font-normal text-indigo-300">{p.period}</span></div>
              <ul className="mt-4 space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-indigo-200">
                    <span className="text-emerald-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={p.href} className={`block text-center font-bold py-3 rounded-xl transition-colors ${p.highlight ? 'bg-white text-indigo-700 hover:bg-indigo-100' : 'bg-indigo-700 text-white hover:bg-indigo-600'}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 text-indigo-400 text-sm border-t border-indigo-800">
        <p>TutorPulse © 2025 — Business intelligence for independent tutors</p>
        <p className="mt-2">
          <Link href="/auth?mode=login" className="hover:text-indigo-200">Log in</Link>
          {" · "}
          <Link href="/auth?mode=signup" className="hover:text-indigo-200">Sign up</Link>
        </p>
      </footer>
    </div>
  );
}
