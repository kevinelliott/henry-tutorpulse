import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TutorPulse — Business Intelligence for Tutors",
  description: "Know which students make you money. Track progress parents can see. $15/mo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
