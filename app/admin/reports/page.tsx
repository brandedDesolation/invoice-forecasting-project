"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Download, FileBarChart, FileText, TrendingUp } from "lucide-react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { AdminPageSkeleton } from "../../../components/Skeleton";
import { ToastContainer, useToast } from "../../../components/Toast";
import { AnalyticsOverview, Invoice, SupplierAnalyticsSummary, analyticsApi, getErrorMessage, invoiceApi } from "../../../lib/api";
import { downloadCsv } from "../../../lib/csv";

export default function ReportsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [supplierSummary, setSupplierSummary] = useState<SupplierAnalyticsSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setApiError("");
        const [overviewData, supplierData, invoiceData] = await Promise.all([
          analyticsApi.getOverview(90),
          analyticsApi.getSupplierInsights(90, 6),
          invoiceApi.getInvoices(0, 1000),
        ]);
        setOverview(overviewData);
        setSupplierSummary(supplierData);
        setInvoices(invoiceData);
      } catch (err) {
        setApiError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, []);

  const overdueInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "overdue" || (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== "paid")),
    [invoices]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(amount);

  const createReportPdf = async (
    title: string,
    subtitle: string,
    rows: Array<Array<string | number>>,
    filename: string,
    kpis: Array<[string, string | number]> = []
  ) => {
    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default;
    const doc = new jsPDF();
    const generatedAt = new Date().toLocaleString("tr-TR");

    doc.setFillColor(12, 12, 12);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("VICAI", 14, 16);
    doc.setFontSize(10);
    doc.text("AI-assisted invoice operations", 14, 24);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16);
    doc.text(title, 14, 48);
    doc.setFontSize(10);
    doc.text(subtitle, 14, 56);
    doc.text(`Generated: ${generatedAt}`, 14, 63);

    let y = 74;
    if (kpis.length > 0) {
      kpis.forEach(([label, value], index) => {
        const x = 14 + (index % 3) * 62;
        const rowY = y + Math.floor(index / 3) * 20;
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(x, rowY, 55, 15, 2, 2);
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(label, x + 3, rowY + 5);
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text(String(value), x + 3, rowY + 11);
      });
      y += Math.ceil(kpis.length / 3) * 20 + 8;
    }

    autoTable(doc, {
      startY: y,
      head: [rows[0] || ["Metric", "Value"]],
      body: rows.slice(1),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(filename);
  };

  const exportInvoiceRisk = () => {
    downloadCsv(
      `vicai-risk-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Invoice", "Customer", "Supplier", "Due Date", "Total", "Status", "Approval"],
      overdueInvoices.map((invoice) => [
        invoice.invoice_number,
        invoice.customer?.name || "",
        invoice.supplier?.name || "",
        invoice.due_date || "",
        invoice.total,
        invoice.status || "pending",
        invoice.approval_status || "pending",
      ])
    );
    success("Risk Report Exported", `${overdueInvoices.length} overdue or at-risk invoices exported.`);
  };

  const exportInvoiceRiskPdf = async () => {
    await createReportPdf(
      "Overdue and Risk Report",
      "Invoices that need reminders, escalation, or collection follow-up.",
      [
        ["Invoice", "Customer", "Supplier", "Due Date", "Total", "Status", "Approval"],
        ...overdueInvoices.map((invoice) => [
          invoice.invoice_number,
          invoice.customer?.name || "",
          invoice.supplier?.name || "",
          invoice.due_date || "",
          formatCurrency(invoice.total),
          invoice.status || "pending",
          invoice.approval_status || "pending",
        ]),
      ],
      `vicai-risk-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      [
        ["At-risk invoices", overdueInvoices.length],
        ["Overdue exposure", formatCurrency(overdueInvoices.reduce((sum, invoice) => sum + invoice.total, 0))],
        ["Generated from", "Live VICAI data"],
      ]
    );
    success("PDF Ready", "Overdue risk report downloaded.");
  };

  const exportSupplierSpend = () => {
    const rows = supplierSummary?.supplier_breakdown || [];
    downloadCsv(
      `vicai-supplier-spend-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Supplier", "Invoices", "Total Spend", "Average Invoice", "Recent 30 Day Spend", "Last Invoice"],
      rows.map((supplier) => [
        supplier.supplier_name,
        supplier.invoice_count,
        supplier.total_spend,
        supplier.average_invoice,
        supplier.recent_30_day_spend,
        supplier.last_invoice_date || "",
      ])
    );
    success("Supplier Report Exported", `${rows.length} supplier rows exported.`);
  };

  const exportSupplierSpendPdf = async () => {
    const rows = supplierSummary?.supplier_breakdown || [];
    await createReportPdf(
      "Supplier Spend Report",
      "Supplier ranking, recent activity, and average invoice amounts.",
      [
        ["Supplier", "Invoices", "Total Spend", "Average Invoice", "Recent 30 Days", "Last Invoice"],
        ...rows.map((supplier) => [
          supplier.supplier_name,
          supplier.invoice_count,
          formatCurrency(supplier.total_spend),
          formatCurrency(supplier.average_invoice),
          formatCurrency(supplier.recent_30_day_spend),
          supplier.last_invoice_date || "",
        ]),
      ],
      `vicai-supplier-spend-${new Date().toISOString().slice(0, 10)}.pdf`,
      [
        ["Suppliers", supplierSummary?.total_suppliers || 0],
        ["Active suppliers", supplierSummary?.active_suppliers || 0],
        ["Total spend", formatCurrency(supplierSummary?.total_spend || 0)],
      ]
    );
    success("PDF Ready", "Supplier spend report downloaded.");
  };

  const exportExecutiveSummary = () => {
    if (!overview) {
      error("Export Failed", "Analytics summary is still loading.");
      return;
    }

    downloadCsv(
      `vicai-executive-summary-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Metric", "Value"],
      [
        ["Total Revenue", overview.revenue.total_revenue],
        ["Paid Revenue", overview.revenue.paid_revenue],
        ["Pending Revenue", overview.revenue.pending_revenue],
        ["Overdue Revenue", overview.revenue.overdue_revenue],
        ["Total Invoices", overview.invoices.total_invoices],
        ["Paid Invoices", overview.invoices.paid_invoices],
        ["Pending Invoices", overview.invoices.pending_invoices],
        ["Overdue Invoices", overview.invoices.overdue_invoices],
        ["AI Extractions", overview.ai_automation.total_extractions],
        ["Forecasts", overview.ai_automation.forecast_count],
      ]
    );
    success("Executive Summary Exported", "CSV summary is ready.");
  };

  const exportExecutiveSummaryPdf = async () => {
    if (!overview) {
      error("Export Failed", "Analytics summary is still loading.");
      return;
    }

    await createReportPdf(
      "Executive Summary",
      "Revenue, invoice status, AI extraction, and forecast KPIs.",
      [
        ["Metric", "Value"],
        ["Total Revenue", formatCurrency(overview.revenue.total_revenue)],
        ["Paid Revenue", formatCurrency(overview.revenue.paid_revenue)],
        ["Pending Revenue", formatCurrency(overview.revenue.pending_revenue)],
        ["Overdue Revenue", formatCurrency(overview.revenue.overdue_revenue)],
        ["Total Invoices", overview.invoices.total_invoices],
        ["Paid Invoices", overview.invoices.paid_invoices],
        ["Pending Invoices", overview.invoices.pending_invoices],
        ["Overdue Invoices", overview.invoices.overdue_invoices],
        ["AI Extractions", overview.ai_automation.total_extractions],
        ["Forecasts", overview.ai_automation.forecast_count],
      ],
      `vicai-executive-summary-${new Date().toISOString().slice(0, 10)}.pdf`,
      [
        ["Revenue", formatCurrency(overview.revenue.total_revenue)],
        ["Invoices", overview.invoices.total_invoices],
        ["Forecasts", overview.ai_automation.forecast_count],
      ]
    );
    success("PDF Ready", "Executive summary report downloaded.");
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="reports">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Reports</h1>
            <p className="mt-2 text-white/60">Download evaluator-friendly business reports from the live dataset.</p>
          </div>

          {loading ? (
            <AdminPageSkeleton title="Building report data..." />
          ) : apiError ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-red-200">{apiError}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <p className="text-sm text-white/60">90-day revenue</p>
                  <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(overview?.revenue.total_revenue || 0)}</p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <p className="text-sm text-white/60">Overdue exposure</p>
                  <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(overview?.revenue.overdue_revenue || 0)}</p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <p className="text-sm text-white/60">Supplier spend</p>
                  <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(supplierSummary?.total_spend || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <ReportCard
                  icon={<FileBarChart className="h-5 w-5" />}
                  title="Executive Summary"
                  description="Revenue, invoice status, AI extraction, and forecast KPIs for your presentation."
                  primaryAction="Download PDF"
                  onPrimaryClick={() => void exportExecutiveSummaryPdf()}
                  secondaryAction="Download CSV"
                  onSecondaryClick={exportExecutiveSummary}
                />
                <ReportCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="Supplier Spend"
                  description="Supplier ranking, total spend, average invoice amount, and recent activity."
                  primaryAction="Download PDF"
                  onPrimaryClick={() => void exportSupplierSpendPdf()}
                  secondaryAction="Export CSV"
                  onSecondaryClick={exportSupplierSpend}
                />
                <ReportCard
                  icon={<FileText className="h-5 w-5" />}
                  title="Overdue Risk"
                  description="Invoices that need reminders, escalation, or payment follow-up."
                  primaryAction="Download PDF"
                  onPrimaryClick={() => void exportInvoiceRiskPdf()}
                  secondaryAction="Export CSV"
                  onSecondaryClick={exportInvoiceRisk}
                />
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function ReportCard({
  icon,
  title,
  description,
  primaryAction,
  onPrimaryClick,
  secondaryAction,
  onSecondaryClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction: string;
  onPrimaryClick: () => void;
  secondaryAction: string;
  onSecondaryClick: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-6">
      <div className="mb-4 flex items-center gap-2 text-white">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mb-6 text-sm leading-6 text-white/60">{description}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPrimaryClick}
          className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
        >
          <Download className="mr-2 h-4 w-4" />
          {primaryAction}
        </button>
        <button
          type="button"
          onClick={onSecondaryClick}
          className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/40"
        >
          <Download className="mr-2 h-4 w-4" />
          {secondaryAction}
        </button>
      </div>
    </div>
  );
}
