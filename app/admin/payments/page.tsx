"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { Invoice, Payment, getErrorMessage, invoiceApi, paymentApi } from "../../../lib/api";

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoicesById, setInvoicesById] = useState<Record<number, Invoice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const [paymentsData, invoices] = await Promise.all([
        paymentApi.getPayments(0, 200),
        invoiceApi.getInvoices(0, 500),
      ]);

      setPayments(paymentsData);
      setInvoicesById(
        invoices.reduce<Record<number, Invoice>>((acc, invoice) => {
          acc[invoice.id] = invoice;
          return acc;
        }, {})
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const totalCollected = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="payments">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Payments</h1>
              <p className="text-white/60 mt-2">A global view of payment activity across invoices.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadPayments()}
              className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md text-white hover:border-gray-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-5">
              <p className="text-sm text-gray-400">Payments recorded</p>
              <p className="mt-2 text-3xl font-semibold text-white">{payments.length}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-5">
              <p className="text-sm text-gray-400">Total collected</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(totalCollected)}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-5">
              <p className="text-sm text-gray-400">Linked invoices</p>
              <p className="mt-2 text-3xl font-semibold text-white">{Object.keys(invoicesById).length}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[280px] text-white/70">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading payments...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-red-200">{error}</div>
          ) : payments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-700 p-10 text-center text-white/60">
              No payments have been created yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Payment Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                  {payments.map((payment) => {
                    const invoice = invoicesById[payment.invoice_id];
                    return (
                      <tr
                        key={payment.id}
                        className="cursor-pointer hover:bg-white/5"
                        onClick={() => router.push(`/admin/invoices/view/${payment.invoice_id}`)}
                      >
                        <td className="px-4 py-3 text-sm text-white">{new Date(payment.payment_date).toLocaleDateString("tr-TR")}</td>
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="inline-flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                            {invoice?.invoice_number || `Invoice #${payment.invoice_id}`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/80">{invoice?.customer?.name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-white">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-sm text-white/80">{payment.payment_method || "-"}</td>
                        <td className="px-4 py-3 text-sm text-white/80">{payment.reference || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
