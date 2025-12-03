"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function AdminLayout({ children, currentPage = "dashboard" }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/admin/invoices", icon: FileText },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black leading-relaxed text-gray-300 antialiased selection:bg-white selection:text-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-black">
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h1 className="text-xl font-bold text-white">Invoice Forecast</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = currentPage === item.href.split('/').pop();
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-white/20 text-white border-l-4 border-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                    <span className="text-sm font-medium text-white">A</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-white/60">admin@invoiceforecast.com</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-2 py-2 text-sm font-medium text-white/70 rounded-md hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto min-h-screen max-w-screen-xl px-6 py-12 font-sans md:px-12 md:py-20 lg:px-24 lg:py-0">
        <div className="lg:flex lg:justify-between lg:gap-8">
          {/* Main Content */}
          <main className="pt-24 lg:w-3/5 lg:py-24">
            <div className="mb-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            {children}
          </main>

          {/* Right Sidebar */}
          <header className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-2/5 lg:flex-col lg:justify-between lg:py-16">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                <Link href="/admin/dashboard">Admin Dashboard</Link>
              </h1>
              <h2 className="mt-8 text-lg font-medium tracking-tight text-gray-100 sm:text-xl">
                Invoice Forecasting System
              </h2>
              <p className="mt-8 max-w-xs leading-normal text-gray-400">
                Manage invoices, customers, and analytics for your business.
              </p>

              {/* Navigation */}
              <nav className="nav hidden lg:block" aria-label="Admin navigation">
                <ul className="mt-6 w-max">
                  {navigation.map((item) => {
                    const isActive = currentPage === item.href.split('/').pop();
                    return (
                      <li key={item.name}>
                        <Link
                          className={`group flex items-center py-4 ${isActive ? "nav-active" : ""}`}
                          href={item.href}
                        >
                          <span className="nav-indicator mr-4 h-px w-8 bg-white/40 transition-all group-hover:w-16 group-hover:bg-white group-focus-visible:w-16 motion-reduce:transition-none"></span>
                          <span className="nav-text text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white group-focus-visible:text-white">
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* User Info */}
            <div className="mt-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                    <span className="text-lg font-medium text-white">A</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-gray-400">admin@invoiceforecast.com</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-auto text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>
    </div>
  );
}
