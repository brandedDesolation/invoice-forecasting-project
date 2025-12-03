"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, children }: AdminHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64">
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-900">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1 flex flex-col items-center justify-start">
          <div className="w-full py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {title && (
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white">{title}</h1>
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
                  )}
                </div>
              )}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
