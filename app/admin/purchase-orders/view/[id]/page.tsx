"use client";

import { useEffect, useState } from "react";

import AdminLayout from "../../../../../components/AdminLayout";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import { AdminPageSkeleton } from "../../../../../components/Skeleton";
import { getErrorMessage, purchaseOrderApi, type PurchaseOrder } from "../../../../../lib/api";

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setOrder(await purchaseOrderApi.getPurchaseOrder(Number(params.id)));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    void load();
  }, [params.id]);

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="purchase-orders">
        {!order && !error ? (
          <AdminPageSkeleton title="Loading purchase order..." />
        ) : error ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-red-200">{error}</div>
        ) : order ? (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white">{order.po_number}</h1>
              <p className="mt-2 text-white/60">{order.supplier?.name} · {order.status}</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card label="Request Date" value={order.request_date} />
              <Card label="Expected Delivery" value={order.expected_delivery_date || "-"} />
              <Card label="Total" value={`₺${order.total.toLocaleString()}`} />
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Line Items</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-gray-700 bg-black/20 p-4">
                    <div>
                      <p className="text-white">{item.description}</p>
                      <p className="text-sm text-white/50">{item.quantity} × ₺{item.unit_price.toLocaleString()}</p>
                    </div>
                    <p className="font-medium text-white">₺{item.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </AdminLayout>
    </ProtectedRoute>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
