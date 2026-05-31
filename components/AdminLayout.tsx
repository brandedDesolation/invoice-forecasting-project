"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authService } from "../lib/auth";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2,
  BarChart3, 
  DollarSign,
  Bell,
  LogOut,
  Menu,
  X,
  ClipboardList,
  FileBarChart,
  Settings,
  ShieldCheck,
  ShoppingCart,
  ReceiptText,
  BookOpen
} from "lucide-react";
import { reviewApi, workflowApi } from "../lib/api";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function AdminLayout({ children, currentPage = "dashboard" }: AdminLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const pathname = usePathname();

  useEffect(() => {
    const syncUser = async () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const refreshedUser = await authService.refreshCurrentUser();
        if (refreshedUser) {
          setUser(refreshedUser);
        }
      }
    };
    syncUser();
  }, []);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const [workflow, review] = await Promise.all([
          workflowApi.getSummary(),
          reviewApi.getQueue(undefined, true),
        ]);
        setBadges({
          review: review.total,
          workflow: workflow.pending_approvals + workflow.unread_notifications,
          tasks: workflow.pending_approvals + workflow.due_soon + workflow.overdue_unpaid + review.total,
        });
      } catch (_err) {
        setBadges({});
      }
    };

    void loadBadges();
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/admin/invoices", icon: FileText },
    { name: "Review Queue", href: "/admin/review", icon: FileText, badgeKey: "review" },
    { name: "Payments", href: "/admin/payments", icon: DollarSign },
    { name: "Purchase Orders", href: "/admin/purchase-orders", icon: ShoppingCart },
    { name: "Expenses", href: "/admin/expenses", icon: ReceiptText },
    { name: "Ledger", href: "/admin/ledger", icon: BookOpen },
    { name: "Workflow", href: "/admin/workflow", icon: Bell, badgeKey: "workflow" },
    { name: "Tasks", href: "/admin/tasks", icon: ClipboardList, badgeKey: "tasks" },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Suppliers", href: "/admin/suppliers", icon: Building2 },
    { name: "Reports", href: "/admin/reports", icon: FileBarChart },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Users", href: "/admin/users", icon: ShieldCheck },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/admin/login';
  };

  const currentNavItem = navigation.find(item => pathname === item.href || pathname?.startsWith(item.href + '/'));
  const navigationGroups = [
    {
      label: "Operations",
      items: navigation.filter((item) => ["Dashboard", "Tasks", "Workflow", "Review Queue"].includes(item.name)),
    },
    {
      label: "Finance",
      items: navigation.filter((item) => ["Invoices", "Payments", "Purchase Orders", "Expenses", "Ledger"].includes(item.name)),
    },
    {
      label: "Business",
      items: navigation.filter((item) => ["Customers", "Suppliers", "Reports", "Analytics"].includes(item.name)),
    },
    {
      label: "Admin",
      items: navigation.filter((item) => ["Users", "Settings"].includes(item.name)),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-300">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left side - Menu and brand */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-800 text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                aria-expanded={menuOpen}
                aria-label="Open navigation menu"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link href="/admin/dashboard" className="truncate text-xl font-bold tracking-wide text-white">
                FATURASM
              </Link>
            </div>

            {/* Right side - User & Dropdown */}
            <div className="flex shrink-0 items-center space-x-4">
              {/* User Info */}
              <div className="hidden sm:flex sm:items-center sm:space-x-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-400">{user?.email || 'admin@example.com'}</p>
                </div>
              </div>

              {/* Logout Button (Desktop) */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="border-t border-gray-800 bg-black/98 shadow-2xl">
              <div className="max-w-5xl py-5 md:pr-6">
              <div className="grid gap-6 px-2 sm:px-0 md:grid-cols-2 lg:grid-cols-4">
                {navigationGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={`${
                              isActive
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            } group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors`}
                          >
                            <item.icon className="mr-3 h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">{item.name}</span>
                            {item.badgeKey && badges[item.badgeKey] > 0 && (
                              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-black">
                                {badges[item.badgeKey] > 99 ? "99+" : badges[item.badgeKey]}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              </div>
              <div className="border-t border-gray-800 py-3 sm:hidden">
                  <div className="flex items-center px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-gray-400">{user?.email || 'admin@example.com'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white rounded-md transition-colors"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign out
                  </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content - Full Width */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        {currentNavItem && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-gray-400 mb-2">
              <currentNavItem.icon className="h-5 w-5" />
              <span className="text-sm">{currentNavItem.name}</span>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
