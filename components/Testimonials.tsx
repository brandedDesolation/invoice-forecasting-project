"use client";

import { Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      quote:
        "The standout difference with Vic.ai is its advanced AI technology. Unlike other vendors that rely heavily on templates, their platform eliminates the need for templating altogether.",
      author: "Paul Dachsteiner",
      role: "VP of IT and IS, Stonewall Kitchen",
      company: "Stonewall Kitchen",
      stat: { value: "100%", label: "Template-free processing" },
    },
    {
      quote:
        "Vic.ai eliminated all the manual components of our payments process, providing each AP analyst with an additional 3 to 6 hours of capacity each week.",
      author: "Andrew Turkish",
      role: "VP and Corporate Controller, Diesel Direct",
      company: "Diesel Direct",
      stat: { value: "97%", label: "Accuracy rate on invoices" },
    },
  ];

  return (
    <section className="py-24 bg-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Vic.ai customers future-proof AP with AI precision
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            The Vic.ai autonomous platform transforms AP today, giving finance teams the accuracy, speed, and scalability to drive meaningful long-term growth.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="h-10 w-10 text-white mb-6" />
              
              <blockquote className="text-lg text-black leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>

              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <div>
                  <div className="font-semibold text-black">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-gray-700">
                    {testimonial.role}
                  </div>
                </div>

                {testimonial.stat && (
                  <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                      {testimonial.stat.value}
                    </div>
                    <div className="text-xs text-gray-700">
                      {testimonial.stat.label}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;







