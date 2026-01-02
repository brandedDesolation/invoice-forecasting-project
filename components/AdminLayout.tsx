"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authService } from "../lib/auth";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/admin/invoices", icon: FileText },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/admin/login';
  };

  const currentNavItem = navigation.find(item => pathname === item.href || pathname?.startsWith(item.href + '/'));

  return (
    <div className="min-h-screen bg-black text-gray-300">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-xl font-bold text-white">
                Invoice Forecast
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'text-white border-b-2 border-white'
                        : 'text-gray-400 hover:text-white'
                    } px-4 py-2 text-sm font-medium transition-colors`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Right side - User & Dropdown */}
            <div className="flex items-center space-x-4">
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

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-gray-400 hover:text-white"
                >
                  {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
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

          {/* Mobile Dropdown Menu */}
          {menuOpen && (
            <div className="md:hidden border-t border-gray-800">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => {
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
                      } group flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
                <div className="pt-4 border-t border-gray-800">
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
