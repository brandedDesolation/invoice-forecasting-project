"use client";

import { Check } from "lucide-react";

const AchieveSection = () => {
  const stats = [
    { value: "5X", label: "Faster invoice processing" },
    { value: "85%", label: "No-touch rate by month 6" },
    { value: "99%", label: "Invoice accuracy rate without coding or setup required" },
    { value: "1st", label: "Autonomous platform for accounting" },
    { value: "7mo", label: "Payback period on Vic.ai" },
  ];

  const benefits = [
    "Eliminate manual data entry and reduce errors",
    "Accelerate invoice approvals and month-end close",
    "Scale AP operations without adding headcount",
    "Gain real-time visibility into cash flow",
    "Prevent fraud and duplicate payments",
  ];

  return (
    <section className="py-24 bg-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div>
            <h2 className="text-base font-semibold leading-7 text-white">
              Achieve autonomous accounting
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Cut AP costs and scale without headcount
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Vic.ai delivers high-fidelity AP data, reducing errors, accelerating approvals, and optimizing financial operations at scale.
            </p>

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex gap-x-3">
                  <Check className="h-6 w-6 flex-none text-white" />
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <a
                href="#"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-block"
              >
                See if you're a good fit for Vic.ai
              </a>
            </div>
          </div>

          {/* Right side - Stats */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-700 leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative element */}
            <div className="absolute -top-4 -right-4 -z-10 h-72 w-72 rounded-full bg-gradient-to-br from-white to-gray-300 opacity-20 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AchieveSection;







