"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { AdminPageSkeleton } from "../../../components/Skeleton";
import { getErrorMessage, purchaseOrderApi, type PurchaseOrder } from "../../../lib/api";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setOrders(await purchaseOrderApi.getPurchaseOrders());
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
      <AdminLayout currentPage="purchase-orders">
        {loading ? (
          <AdminPageSkeleton title="Loading purchase orders..." />
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Purchase Orders</h1>
                <p className="mt-2 text-white/60">Track supplier procurement before invoices arrive.</p>
              </div>
              <Link href="/admin/purchase-orders/create" className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200">
                <Plus className="mr-2 h-4 w-4" /> New PO
              </Link>
            </div>
            {error && <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-200">{error}</div>}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Stat label="Total POs" value={orders.length.toString()} />
              <Stat label="Approved" value={orders.filter((order) => order.status === "approved").length.toString()} />
              <Stat label="Received" value={orders.filter((order) => order.status === "received").length.toString()} />
              <Stat label="Open Value" value={`₺${orders.filter((order) => order.status !== "received").reduce((sum, order) => sum + order.total, 0).toLocaleString()}`} />
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-700">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-white/60">
                  <FileText className="mx-auto mb-3 h-8 w-8" />
                  No purchase orders yet.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/70">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">PO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3">
                          <Link href={`/admin/purchase-orders/view/${order.id}`} className="font-medium text-white hover:underline">{order.po_number}</Link>
                          <p className="text-xs text-white/50">{order.request_date}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/70">{order.supplier?.name || `Supplier #${order.supplier_id}`}</td>
                        <td className="px-4 py-3 text-sm text-white/70">{order.status}</td>
                        <td className="px-4 py-3 text-right text-sm text-white">₺{order.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
