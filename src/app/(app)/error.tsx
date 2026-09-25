"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sap-bg px-6">
      <div className="w-full max-w-md rounded-2xl border border-sap-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sap-negative-bg">
          <AlertTriangle size={22} className="text-sap-negative" />
        </div>
        <h1 className="text-lg font-semibold text-sap-text">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-sap-label">
          Maaf, ada masalah saat memuat halaman ini. Coba lagi — kalau terus berulang,
          hubungi administrator.
        </p>
        {error.digest && (
          <p className="mt-3 rounded-lg bg-sap-neutral-bg px-3 py-2 font-mono text-xs text-sap-label">
            {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-sap-blue px-4 text-[13px] font-medium text-white transition hover:bg-sap-blue-dark"
          >
            <RotateCcw size={15} />
            Coba lagi
          </button>
          <a
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-sap-border bg-white px-4 text-[13px] font-medium text-sap-text transition hover:bg-sap-hover"
          >
            <Home size={15} />
            Ke Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
