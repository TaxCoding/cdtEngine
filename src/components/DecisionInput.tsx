"use client";

import { useState, FormEvent } from "react";
import { Language, LANGUAGE_LABELS } from "@/lib/types";

const EXAMPLES = [
  "Makan nasi goreng untuk sarapan",
  "Menekan tombol snooze sekali lagi",
  "Membalas email kerja jam 11 malam",
  "Parkir sedikit melewati garis",
];

const LANGUAGE_OPTIONS: Language[] = ["id", "en", "jv-ngoko"];

interface DecisionInputProps {
  onSubmit: (decision: string, language: Language) => void;
  error: string | null;
}

export default function DecisionInput({ onSubmit, error }: DecisionInputProps) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<Language>("id");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, language);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-ink-900">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 leading-snug mb-2">
          Apa keputusan kecil yang kamu buat hari ini?
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-md">
          Sistem akan memetakan setiap kemungkinan jalur eskalasinya — dari gangguan
          kecil sampai bencana lintas benua — lengkap dengan probabilitas tiap langkahnya.
        </p>

        <div className="mb-5">
          <p className="text-ink-500 text-[11px] mb-2">Bahasa hasil</p>
          <div className="flex gap-1.5">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                  language === lang
                    ? "border-signal-500 bg-signal-500/15 text-signal-400"
                    : "border-ink-700 text-slate-500 hover:border-ink-500 hover:text-slate-300"
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-5">
          <div className="flex items-center gap-3 rounded-md border border-ink-600 bg-ink-850 focus-within:border-signal-500 transition-colors px-4 py-3">
            <span className="text-signal-500 font-mono text-sm select-none">&gt;</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              placeholder="menekan tombol snooze sekali lagi"
              autoFocus
              className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-ink-500 text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim()}
            className="mt-3 w-full rounded-md bg-signal-500 hover:bg-signal-400 disabled:bg-ink-700 disabled:text-ink-500 disabled:cursor-not-allowed text-ink-950 font-semibold py-3 transition-colors text-sm"
          >
            Petakan eskalasinya
          </button>
        </form>

        {error && (
          <p className="mb-5 text-sm text-severity-critical font-mono bg-ink-850 border border-severity-critical/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="text-xs text-slate-500 hover:text-slate-300 border border-ink-700 hover:border-ink-500 rounded px-2.5 py-1.5 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
