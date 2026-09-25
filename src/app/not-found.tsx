import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sap-bg px-6">
      <div className="w-full max-w-md rounded-2xl border border-sap-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sap-neutral-bg">
          <FileQuestion size={22} className="text-sap-label" />
        </div>
        <h1 className="text-lg font-semibold text-sap-text">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-sap-label">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-sap-blue px-4 text-[13px] font-medium text-white transition hover:bg-sap-blue-dark"
        >
          <Home size={15} />
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}
