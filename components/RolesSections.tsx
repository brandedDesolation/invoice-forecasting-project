"use client";

import { TrendingUp, Shield, Zap, Users, DollarSign, BarChart2 } from "lucide-react";

const RolesSection = () => {
  const roles = [
    {
      title: "For CFOs",
      description:
        "Extend financial visibility and scale efficiently — without more costs or headcount. Gain real-time control over non-payroll expenses, prevent fraud, and streamline AP across all entities.",
      benefits: [
        { icon: DollarSign, text: "Reduce AP costs" },
        { icon: TrendingUp, text: "Optimize cashflow" },
        { icon: BarChart2, text: "Real-time financial insights" },
        { icon: Shield, text: "Prevent fraud" },
      ],
      gradient: "from-blue-600 to-cyan-600",
    },
    {
      title: "For Controllers",
      description:
        "Centralize and streamline AP processes for better balance sheet oversight. Optimize FTE allocation across your team to improve productivity and prepare for growth.",
      benefits: [
        { icon: Zap, text: "Streamline operations" },
        { icon: DollarSign, text: "Control cashflow" },
        { icon: TrendingUp, text: "Improve AP efficiency" },
        { icon: Shield, text: "Reduce errors" },
      ],
      gradient: "from-purple-600 to-pink-600",
    },
    {
      title: "For AP Managers",
      description:
        "Achieve cost efficiencies while maintaining quality with proven AI for invoice processing and bill pay. Strengthen vendor relationships and ease employee workload with transparent, accurate processing in 80% less time.",
      benefits: [
        { icon: Zap, text: "Shorten DPO" },
        { icon: TrendingUp, text: "Streamline approvals" },
        { icon: Shield, text: "Prevent overpayments" },
        { icon: Users, text: "Improve vendor relations" },
      ],
      gradient: "from-orange-600 to-red-600",
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-base font-semibold leading-7 text-primary-600">
            CFOs, Controllers, and AP Managers
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Purpose-built AI for finance leaders
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Control. Efficiency. ROI. Free your team from manual work and make better financial decisions, faster.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {roles.map((role, index) => (
            <div
              key={role.title}
              className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r ${role.gradient}`} />
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-4">
                {role.title}
              </h3>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                {role.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {role.benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.text} className="flex items-start gap-2">
                      <div className={`flex-shrink-0 rounded-lg bg-gradient-to-br ${role.gradient} p-1.5`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-700 leading-tight">
                        {benefit.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              <a
                href="#"
                className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Learn more →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolesSection;


