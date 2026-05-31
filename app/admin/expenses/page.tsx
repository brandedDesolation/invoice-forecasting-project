"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { AdminPageSkeleton } from "../../../components/Skeleton";
import { downloadCsv } from "../../../lib/csv";
import { expenseApi, getErrorMessage, type Expense } from "../../../lib/api";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setExpenses(await expenseApi.getExpenses(category || undefined));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [category]);

  const categories = useMemo(() => Array.from(new Set(expenses.map((expense) => expense.category))).sort(), [expenses]);
  const total = expenses.reduce((sum, expense) => sum + expense.total, 0);

  const exportCsv = () => {
    downloadCsv(
      "vicai-expenses.csv",
      ["Number", "Vendor", "Category", "Date", "Status", "Reimbursable", "Total"],
      expenses.map((expense) => [
        expense.expense_number,
        expense.vendor,
        expense.category,
        expense.expense_date,
        expense.approval_status,
        expense.reimbursable ? "Yes" : "No",
        expense.total,
      ]),
    );
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="expenses">
        {loading ? (
          <AdminPageSkeleton title="Loading expenses..." />
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Expenses</h1>
                <p className="mt-2 text-white/60">Track company spend across travel, software, office, utilities, and logistics.</p>
              </div>
              <button onClick={exportCsv} className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </button>
            </div>
            {error && <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-200">{error}</div>}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Stat label="Expense Total" value={`₺${total.toLocaleString()}`} />
              <Stat label="Pending Approval" value={expenses.filter((expense) => expense.approval_status === "pending").length.toString()} />
              <Stat label="Reimbursable" value={expenses.filter((expense) => expense.reimbursable).length.toString()} />
              <Stat label="Categories" value={categories.length.toString()} />
            </div>
            <div className="flex items-center gap-3">
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white">
                <option value="">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Expense</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{expense.expense_number}</p>
                        <p className="text-xs text-white/50">{expense.vendor} · {expense.expense_date}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{expense.category}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{expense.approval_status}</td>
                      <td className="px-4 py-3 text-right text-sm text-white">₺{expense.total.toLocaleString()}</td>
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
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
