"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminLayout from "../../../../components/AdminLayout";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { getErrorMessage, purchaseOrderApi, supplierApi, type Supplier } from "../../../../lib/api";

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void supplierApi.getSuppliers().then(setSuppliers).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const quantity = Number(data.get("quantity") || 1);
    const unitPrice = Number(data.get("unit_price") || 0);
    const subtotal = quantity * unitPrice;
    const tax = subtotal * 0.2;

    try {
      const order = await purchaseOrderApi.createPurchaseOrder({
        po_number: String(data.get("po_number")),
        supplier_id: Number(data.get("supplier_id")),
        request_date: String(data.get("request_date")),
        expected_delivery_date: String(data.get("expected_delivery_date")) || null,
        status: String(data.get("status")),
        subtotal,
        tax,
        total: subtotal + tax,
        notes: String(data.get("notes") || ""),
        items: [{
          description: String(data.get("description")),
          quantity,
          unit_price: unitPrice,
          total: subtotal,
        }],
      });
      router.push(`/admin/purchase-orders/view/${order.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="purchase-orders">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white">Create Purchase Order</h1>
          {error && <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-200">{error}</div>}
          <form onSubmit={submit} className="mt-8 space-y-5 rounded-lg border border-gray-700 bg-gray-900/30 p-6">
            <Input name="po_number" label="PO Number" placeholder="PO-2026-001" required />
            <label className="block">
              <span className="text-sm text-white/70">Supplier</span>
              <select name="supplier_id" required className="mt-1 w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white">
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input name="request_date" label="Request Date" type="date" required />
              <Input name="expected_delivery_date" label="Expected Delivery" type="date" />
              <label className="block">
                <span className="text-sm text-white/70">Status</span>
                <select name="status" className="mt-1 w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white">
                  <option value="draft">draft</option>
                  <option value="approved">approved</option>
                  <option value="received">received</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input name="description" label="Item Description" required />
              <Input name="quantity" label="Quantity" type="number" defaultValue="1" required />
              <Input name="unit_price" label="Unit Price" type="number" defaultValue="0" required />
            </div>
            <label className="block">
              <span className="text-sm text-white/70">Notes</span>
              <textarea name="notes" className="mt-1 w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white" rows={3} />
            </label>
            <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200">Create PO</button>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="block">
      <span className="text-sm text-white/70">{label}</span>
      <input {...inputProps} className="mt-1 w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white" />
    </label>
  );
}
