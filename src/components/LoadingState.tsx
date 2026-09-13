"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Mengirimkan keputusan ke mesin eskalasi...",
  "Menyusun simpul konsekuensi tahap demi tahap...",
  "Menghitung probabilitas tiap cabang...",
  "Merangkai graf ke dalam satu struktur DAG...",
  "Menyelesaikan pemetaan...",
];

export default function LoadingState() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-900 gap-4">
      <div className="w-10 h-10 border-2 border-ink-700 border-t-signal-500 rounded-full animate-spin" />
      <p className="font-mono text-xs text-slate-500">{STAGES[stage]}</p>
    </div>
  );
}
