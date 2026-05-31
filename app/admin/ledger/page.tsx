"use client";

import { useEffect, useState } from "react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { AdminPageSkeleton } from "../../../components/Skeleton";
import { getErrorMessage, ledgerApi, type LedgerEntry, type LedgerSummary } from "../../../lib/api";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [entryData, summaryData] = await Promise.all([ledgerApi.getEntries(), ledgerApi.getSummary()]);
        setEntries(entryData);
        setSummary(summaryData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="ledger">
        {loading ? (
          <AdminPageSkeleton title="Loading general ledger..." />
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white">General Ledger</h1>
              <p className="mt-2 text-white/60">Lightweight accounting trace generated from invoices, payments, POs, and expenses.</p>
            </div>
            {error && <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-200">{error}</div>}
            {summary && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                <Stat label="Receivables" value={`₺${summary.receivables.toLocaleString()}`} />
                <Stat label="Payables" value={`₺${summary.payables.toLocaleString()}`} />
                <Stat label="Cash Collected" value={`₺${summary.cash_collected.toLocaleString()}`} />
                <Stat label="Expenses" value={`₺${summary.expenses.toLocaleString()}`} />
                <Stat label="Balance" value={`₺${summary.balance.toLocaleString()}`} />
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Source</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-sm text-white/70">{entry.entry_date}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{entry.account}</p>
                        <p className="text-xs text-white/50">{entry.description}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{entry.source_type} · {entry.reference || "-"}</td>
                      <td className="px-4 py-3 text-right text-sm text-white">₺{entry.debit.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm text-white">₺{entry.credit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
