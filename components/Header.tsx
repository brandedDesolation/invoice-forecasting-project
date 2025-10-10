"use client";

import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navigation = {
    why: {
      title: "Why Vic.ai?",
      items: [
        { name: "Why Vic.ai?", href: "#why" },
        { name: "Customers", href: "#customers" },
      ],
    },
    products: {
      title: "Products",
      items: [
        { name: "Accounts Payable", href: "#ap" },
        { name: "AP Inbox", href: "#inbox" },
        { name: "Bill Pay and Vendor Portal", href: "#billpay" },
        { name: "Expense Management", href: "#expense" },
        { name: "Analytics and Insights", href: "#analytics" },
        { name: "VicAgents™", href: "#agents" },
      ],
    },
    solutions: {
      title: "Solutions",
      items: [
        { name: "By Use Case", href: "#usecase" },
        { name: "By Role", href: "#role" },
        { name: "By Industry", href: "#industry" },
      ],
    },
    resources: {
      title: "Resources",
      items: [
        { name: "Resource Center", href: "#resources" },
        { name: "Blog", href: "#blog" },
        { name: "Case Studies", href: "#cases" },
        { name: "Webinars", href: "#webinars" },
      ],
    },
    company: {
      title: "Company",
      items: [
        { name: "About Vic.ai", href: "#about" },
        { name: "Careers", href: "#careers" },
        { name: "Contact Us", href: "#contact" },
        { name: "Partners", href: "#partners" },
      ],
    },
  };

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-2 px-4 text-center text-sm">
        <span className="font-semibold">New!</span> Access exclusive insights in the 2025 AI Momentum Report
      </div>

      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Vic.ai
              </span>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {Object.entries(navigation).map(([key, section]) => (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => setActiveDropdown(key)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors">
                  {section.title}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Dropdown */}
                {activeDropdown === key && (
                  <div className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-xs overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-900/5">
                    <div className="p-4">
                      {section.items.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="group relative flex items-center gap-x-6 rounded-lg p-3 text-sm leading-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-auto">
                            <span className="block font-semibold text-gray-900 group-hover:text-primary-600">
                              {item.name}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            <a
              href="#login"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors"
            >
              Login
            </a>
            <a
              href="#demo"
              className="rounded-full bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-lg transition-all hover:scale-105"
            >
              Request demo
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="space-y-2 px-6 pb-6 pt-2">
            {Object.entries(navigation).map(([key, section]) => (
              <div key={key} className="space-y-2">
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                {section.items.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block rounded-lg py-2 pl-6 pr-3 text-sm leading-7 text-gray-700 hover:bg-gray-50"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            ))}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <a
                href="#login"
                className="block rounded-lg py-2.5 px-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Login
              </a>
              <a
                href="#demo"
                className="block rounded-full bg-gradient-to-r from-primary-600 to-accent-600 py-2.5 px-3 text-center text-sm font-semibold text-white shadow-sm"
              >
                Request demo
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;


