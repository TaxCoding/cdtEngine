"use client";

import { useEffect, useState } from "react";
import { StoredGraphSummary, LANGUAGE_LABELS, Language } from "@/lib/types";

interface HistorySidebarProps {
  onLoad: (id: string) => void;
  refreshKey: number;
}

export default function HistorySidebar({ onLoad, refreshKey }: HistorySidebarProps) {
  const [items, setItems] = useState<StoredGraphSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setUnavailable(false);
    fetch("/api/graphs")
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) {
          setUnavailable(true);
          setItems([]);
          return;
        }
        setItems(d.history ?? []);
      })
      .catch(() => {
        setUnavailable(true);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [open, refreshKey]);

  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs bg-ink-850/90 border border-ink-700 hover:border-ink-500 text-slate-400 hover:text-slate-200 rounded px-3 py-1.5 backdrop-blur"
      >
        {open ? "Tutup" : "Riwayat"}
      </button>

      {open && (
        <div className="mt-2 w-72 max-h-96 overflow-y-auto rounded-md bg-ink-850/95 border border-ink-700 backdrop-blur p-1.5">
          {loading && <p className="text-xs text-ink-500 p-2.5">Memuat riwayat...</p>}
          {!loading && unavailable && (
            <p className="text-xs text-ink-500 p-2.5 leading-relaxed">
              Riwayat belum tersedia. Pastikan MONGODB_URI sudah diatur di server.
            </p>
          )}
          {!loading && !unavailable && items.length === 0 && (
            <p className="text-xs text-ink-500 p-2.5">Belum ada riwayat tersimpan.</p>
          )}
          {!loading &&
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onLoad(item.id);
                  setOpen(false);
                }}
                className="w-full text-left rounded px-2.5 py-2 hover:bg-ink-800 transition-colors"
              >
                <p className="text-xs text-slate-300 truncate">{item.rootDecision}</p>
                <p className="text-ink-600 text-[10px] mt-0.5 font-mono flex items-center gap-1.5">
                  {new Date(item.createdAt).toLocaleString("id-ID")}
                  {item.language && (
                    <span className="text-signal-500">
                      · {LANGUAGE_LABELS[item.language as Language] ?? item.language}
                    </span>
                  )}
                </p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
