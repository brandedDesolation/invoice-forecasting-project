"use client";

import { useEffect, useState } from "react";
import { Building2, Save, Settings, SlidersHorizontal } from "lucide-react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { ToastContainer, useToast } from "../../../components/Toast";

const STORAGE_KEY = "vicai_demo_settings";

interface DemoSettings {
  companyName: string;
  currency: string;
  defaultPaymentTerms: string;
  reminderDays: string;
  demoMode: boolean;
  autoForecast: boolean;
}

const defaultSettings: DemoSettings = {
  companyName: "VICAI Finance Operations",
  currency: "TRY",
  defaultPaymentTerms: "30",
  reminderDays: "7",
  demoMode: true,
  autoForecast: true,
};

export default function SettingsPage() {
  const { toasts, removeToast, success } = useToast();
  const [settings, setSettings] = useState<DemoSettings>(defaultSettings);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSettings({ ...defaultSettings, ...JSON.parse(saved) });
    }
  }, []);

  const updateSetting = <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    success("Settings Saved", "Demo preferences were saved in this browser.");
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="settings">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="mt-2 text-white/60">Configure presentation-friendly company defaults and workflow behavior.</p>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-6">
            <div className="mb-6 flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Company Profile</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Company Name</label>
                <input
                  value={settings.companyName}
                  onChange={(event) => updateSetting("companyName", event.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-black/30 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(event) => updateSetting("currency", event.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-black/30 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                >
                  <option value="TRY">Turkish Lira (TRY)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-6">
            <div className="mb-6 flex items-center gap-2 text-white">
              <SlidersHorizontal className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Workflow Defaults</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Default Payment Terms (days)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.defaultPaymentTerms}
                  onChange={(event) => updateSetting("defaultPaymentTerms", event.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-black/30 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Reminder Before Due Date (days)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.reminderDays}
                  onChange={(event) => updateSetting("reminderDays", event.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-black/30 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-gray-700 pt-6">
              <label className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-medium text-white">Demo Mode</p>
                  <p className="mt-1 text-sm text-white/60">Show presentation-safe defaults and seeded-data messaging.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.demoMode}
                  onChange={(event) => updateSetting("demoMode", event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
              </label>
              <label className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-medium text-white">Auto Forecast After Approval</p>
                  <p className="mt-1 text-sm text-white/60">Use this as the visible product setting for the backend automation story.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoForecast}
                  onChange={(event) => updateSetting("autoForecast", event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveSettings}
              className="inline-flex items-center rounded-md bg-white px-4 py-2 font-medium text-black hover:bg-gray-200"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </button>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-6">
            <div className="mb-3 flex items-center gap-2 text-white">
              <Settings className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Implementation Note</h2>
            </div>
            <p className="text-sm leading-6 text-white/60">
              These settings are stored locally for the capstone demo. They give evaluators a complete product surface while backend environment settings remain in the API configuration.
            </p>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
