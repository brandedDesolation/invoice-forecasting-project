"use client";

import { Database, Plug } from "lucide-react";

const Integrations = () => {
  const erpSystems = [
    "NetSuite",
    "QuickBooks",
    "Sage Intacct",
    "Microsoft Dynamics",
    "SAP",
    "Oracle",
    "Workday",
    "Xero",
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Seamlessly connect with any ERP system
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Vic.ai integrates seamlessly with all major ERP and accounting systems, offering AI-first capabilities through its flexible and scalable open API.
          </p>
        </div>

        <div className="relative">
          {/* Central icon */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl blur-lg opacity-30" />
              <div className="relative bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-6">
                <Plug className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* ERP logos grid */}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {erpSystems.map((erp, index) => (
              <div
                key={erp}
                className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center border border-gray-100"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {erp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="#"
              className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all integrations →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;


