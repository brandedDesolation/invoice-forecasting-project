"use client";

import { FileText, Video, BookOpen, Calendar } from "lucide-react";

const Resources = () => {
  const resources = [
    {
      type: "Case Study",
      icon: FileText,
      title: "Diesel Direct: Fueling growth with AI-powered accounting",
      description: "Learn how Diesel Direct achieved 97% accuracy rate on invoices",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      type: "Guide",
      icon: BookOpen,
      title: "Augmenting Your Finance Team with GenAI",
      description: "Discover how GenAI can transform your finance operations",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      type: "Webinar",
      icon: Video,
      title: "How AI Keeps Your Invoices Moving Faster Than Your Fleet",
      description: "Watch our on-demand webinar on AP automation",
      gradient: "from-orange-500 to-red-500",
    },
    {
      type: "Case Study",
      icon: FileText,
      title: "Accounting firm processes invoices faster than Bill.com",
      description: "See how accounting firms benefit from Vic.ai",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Featured resources
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Explore our library of case studies, guides, and webinars to learn how AI is transforming finance teams.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.title}
                className="group relative bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`h-2 bg-gradient-to-r ${resource.gradient}`} />
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`rounded-lg bg-gradient-to-br ${resource.gradient} p-2`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {resource.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight group-hover:text-primary-600 transition-colors">
                    {resource.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {resource.description}
                  </p>
                  
                  <a
                    href="#"
                    className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Read More →
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            Explore all resources
          </a>
        </div>
      </div>
    </section>
  );
};

export default Resources;


