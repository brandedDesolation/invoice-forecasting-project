"use client";

import { Mail, Linkedin, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    why: {
      title: "Why Vic.ai?",
      links: [
        { name: "Why Vic.ai?", href: "#" },
        { name: "Customers", href: "#" },
      ],
    },
    products: {
      title: "Products",
      links: [
        { name: "Accounts Payable", href: "#" },
        { name: "AP Inbox", href: "#" },
        { name: "Bill Pay and Vendor Portal", href: "#" },
        { name: "Expense Management", href: "#" },
        { name: "Analytics and Insights", href: "#" },
        { name: "VicAgents", href: "#" },
      ],
    },
    solutions: {
      title: "Solutions",
      links: [
        { name: "By Use Case", href: "#" },
        { name: "By Role", href: "#" },
        { name: "By Industry", href: "#" },
      ],
    },
    resources: {
      title: "Resources",
      links: [
        { name: "Blog", href: "#" },
        { name: "Case Studies", href: "#" },
        { name: "Guides", href: "#" },
        { name: "Videos", href: "#" },
        { name: "Webinars", href: "#" },
        { name: "Glossary", href: "#" },
      ],
    },
    company: {
      title: "Company",
      links: [
        { name: "About Vic.ai", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Newsroom", href: "#" },
        { name: "Contact Us", href: "#" },
        { name: "Partners", href: "#" },
      ],
    },
  };

  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        {/* Newsletter */}
        <div className="xl:grid xl:grid-cols-3 xl:gap-8 mb-16">
          <div className="space-y-8 xl:col-span-1">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Vic.ai
            </div>
            <p className="text-sm leading-6 text-gray-400">
              Vic.ai is on a mission to transform how finance teams operate by building the world's first autonomous finance platform.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div className="mt-16 xl:col-span-2 xl:mt-0">
            <div className="rounded-2xl bg-gray-800/50 p-8 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">
                Subscribe to our newsletter
              </h3>
              <form className="sm:flex sm:max-w-md">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  type="email"
                  name="email-address"
                  id="email-address"
                  autoComplete="email"
                  required
                  className="w-full min-w-0 rounded-lg border-0 bg-gray-700 px-4 py-2.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                  placeholder="Enter your email"
                />
                <div className="mt-4 sm:ml-4 sm:mt-0 sm:flex-shrink-0">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-lg transition-all hover:scale-105"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 border-t border-gray-800 pt-16">
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold leading-6 text-white">
                {section.title}
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm leading-6 text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 border-t border-gray-800 pt-8 sm:flex sm:items-center sm:justify-between">
          <div className="flex space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-primary-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary-400 transition-colors">
              Login
            </a>
            <a href="#" className="hover:text-primary-400 transition-colors">
              Request Demo
            </a>
          </div>
          <p className="mt-8 text-xs leading-5 text-gray-500 sm:mt-0">
            &copy; 2025 Vic.ai. Copyright © 2025 Vic.ai
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


