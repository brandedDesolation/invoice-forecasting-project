"use client";

import { ArrowRight, FileText, CreditCard, BarChart3, Mail, DollarSign } from "lucide-react";

const Products = () => {
  const products = [
    {
      icon: FileText,
      title: "Accounts payable",
      description:
        "Autonomous invoice processing that minimizes errors and speeds up the month-end close — so your team can focus on staying one step ahead.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: CreditCard,
      title: "Expense management",
      description:
        "Vic.ai offers unparalleled AI-driven autonomy in managing corporate expenses. With VicCard™ and Expense Management, you can get a unified view of non-payroll corporate expenses in one place.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: BarChart3,
      title: "Analytics and insights",
      description:
        "Unlock always-on performance insights across invoice workflows, team productivity, and business entities — empowering intelligent action and better operational outcomes.",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            The leading AI platform for accounts payable
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            With Vic.ai, put your AP on autopilot, gain real-time insights, manage spend, and achieve unmatched accuracy and efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {products.map((product, index) => {
            const Icon = product.icon;
            return (
              <div
                key={product.title}
                className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${product.gradient} mb-6`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {product.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 group-hover:gap-3 transition-all"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Products;


