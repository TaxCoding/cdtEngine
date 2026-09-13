"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the real error in the console for debugging, even though the
    // user sees a friendly message.
    console.error("[CDT] Unhandled render error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-900 px-6 text-center gap-4">
      <p className="text-severity-critical text-sm font-medium">Terjadi kesalahan tak terduga.</p>
      <p className="text-ink-500 text-xs max-w-sm leading-relaxed">
        Ada bagian dari graf yang gagal dirender. Ini biasanya sementara - coba mulai simulasi
        baru. Kalau terus terjadi, coba dengan keputusan atau bahasa yang berbeda.
      </p>
      <p className="text-ink-600 text-[10px] font-mono max-w-sm break-words">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold px-4 py-2 text-sm transition-colors"
      >
        Mulai ulang
      </button>
    </div>
  );
}
