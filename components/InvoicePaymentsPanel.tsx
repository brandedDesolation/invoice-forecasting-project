"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  Payment,
  PaymentCheckoutResponse,
  PaymentCreate,
  PaymentUpdate,
  getErrorMessage,
  paymentApi,
} from "../lib/api";

interface InvoicePaymentsPanelProps {
  invoiceId: number;
  invoiceTotal: number;
  onChanged?: () => Promise<void> | void;
}

const emptyForm = (invoiceId: number) => ({
  invoice_id: invoiceId,
  amount: "",
  payment_date: new Date().toISOString().split("T")[0],
  payment_method: "",
  reference: "",
  notes: "",
});

export default function InvoicePaymentsPanel({
  invoiceId,
  invoiceTotal,
  onChanged,
}: InvoicePaymentsPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerLoading, setProviderLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<PaymentCheckoutResponse | null>(null);
  const [form, setForm] = useState(emptyForm(invoiceId));

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await paymentApi.getInvoicePayments(invoiceId);
      setPayments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(emptyForm(invoiceId));
    void loadPayments();
  }, [invoiceId]);

  const totalPaid = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );
  const remainingAmount = invoiceTotal - totalPaid;

  const resetForm = () => {
    setEditingPayment(null);
    setForm(emptyForm(invoiceId));
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setForm({
      invoice_id: payment.invoice_id,
      amount: String(payment.amount),
      payment_date: payment.payment_date,
      payment_method: payment.payment_method || "",
      reference: payment.reference || "",
      notes: payment.notes || "",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingPayment) {
        const payload: PaymentUpdate = {
          amount: Number(form.amount),
          payment_date: form.payment_date,
          payment_method: form.payment_method || undefined,
          reference: form.reference || undefined,
          notes: form.notes || undefined,
        };
        await paymentApi.updatePayment(editingPayment.id, payload);
      } else {
        const payload: PaymentCreate = {
          invoice_id: invoiceId,
          amount: Number(form.amount),
          payment_date: form.payment_date,
          payment_method: form.payment_method || undefined,
          reference: form.reference || undefined,
          notes: form.notes || undefined,
        };
        await paymentApi.createPayment(payload);
      }

      await loadPayments();
      await onChanged?.();
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (paymentId: number) => {
    if (!confirm("Delete this payment record?")) {
      return;
    }

    try {
      await paymentApi.deletePayment(paymentId);
      await loadPayments();
      await onChanged?.();
      if (editingPayment?.id === paymentId) {
        resetForm();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCreateCheckout = async () => {
    setProviderLoading(true);
    setError("");
    try {
      const amount = Math.max(remainingAmount, 0);
      const session = await paymentApi.createProviderCheckout(invoiceId, amount);
      setCheckoutSession(session);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProviderLoading(false);
    }
  };

  const handleCompleteCheckout = async () => {
    if (!checkoutSession) return;

    setProviderLoading(true);
    setError("");
    try {
      await paymentApi.completeProviderCheckout(checkoutSession.checkout_session_id);
      setCheckoutSession(null);
      await loadPayments();
      await onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProviderLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);

  return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4 border-b border-gray-600/30 pb-2">
        <div>
          <h3 className="text-lg font-semibold text-white">Payments</h3>
          <p className="text-sm text-white/60">Record received payments and keep invoice status in sync.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="flex items-center px-3 py-2 text-white border border-gray-700 rounded-md hover:border-gray-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Payment
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-gray-900/60 border border-gray-700 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-400">Invoice Total</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(invoiceTotal)}</p>
            </div>
            <div className="rounded-lg bg-gray-900/60 border border-gray-700 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-400">Paid</p>
              <p className="text-lg font-semibold text-green-300">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="rounded-lg bg-gray-900/60 border border-gray-700 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-400">Remaining</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(remainingAmount)}</p>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-blue-400/30 bg-blue-500/10 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">MockPay Sandbox Gateway</p>
                <p className="text-xs text-blue-100/70">
                  Create a provider checkout session, then complete it like a payment-service callback.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCreateCheckout}
                  disabled={providerLoading || remainingAmount <= 0}
                  className="rounded-md border border-blue-300/40 px-3 py-2 text-sm text-blue-50 hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create Checkout
                </button>
                {checkoutSession && (
                  <button
                    type="button"
                    onClick={handleCompleteCheckout}
                    disabled={providerLoading}
                    className="rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-950 hover:bg-white disabled:opacity-50"
                  >
                    Complete Sandbox Payment
                  </button>
                )}
              </div>
            </div>
            {checkoutSession && (
              <div className="mt-3 rounded-md border border-blue-300/20 bg-black/20 p-3 text-xs text-blue-50/80">
                <p><span className="text-blue-100">Provider:</span> {checkoutSession.provider}</p>
                <p><span className="text-blue-100">Session:</span> {checkoutSession.checkout_session_id.slice(0, 38)}...</p>
                <p><span className="text-blue-100">URL:</span> {checkoutSession.checkout_url}</p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-white/70">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-white/60">
              No payments recorded for this invoice yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Reference</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-sm text-white">{new Date(payment.payment_date).toLocaleDateString("tr-TR")}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-sm text-white/80">{payment.payment_method || "-"}</td>
                      <td className="px-4 py-3 text-sm text-white/80">{payment.reference || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(payment)}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-white border border-gray-700 rounded-md hover:border-gray-500"
                          >
                            <Pencil className="h-4 w-4 mr-1.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(payment.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-red-300 border border-red-900/50 rounded-md hover:border-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold">{editingPayment ? "Edit Payment" : "Add Payment"}</h4>
            {editingPayment && (
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-white"
                title="Cancel editing"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white focus:border-gray-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Payment Date</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(event) => setForm((prev) => ({ ...prev, payment_date: event.target.value }))}
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white focus:border-gray-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Method</label>
              <input
                type="text"
                value={form.payment_method}
                onChange={(event) => setForm((prev) => ({ ...prev, payment_method: event.target.value }))}
                placeholder="Bank transfer, cash, card..."
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Reference</label>
              <input
                type="text"
                value={form.reference}
                onChange={(event) => setForm((prev) => ({ ...prev, reference: event.target.value }))}
                placeholder="Transaction reference"
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white focus:border-gray-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingPayment ? "Update Payment" : "Save Payment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
