"use client";

import { ArrowRight, PlayCircle } from "lucide-react";

const CTA = () => {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-black via-gray-800 to-gray-600 py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to see Vic.ai in action?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Schedule a meeting with our team to learn more and get started on your path toward more enlightened Accounts Payable.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="#demo"
              className="group rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-lg hover:bg-gray-50 transition-all hover:scale-105 flex items-center gap-2"
            >
              Request demo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#tour"
              className="flex items-center gap-2 text-sm font-semibold leading-6 text-white hover:text-gray-300 transition-colors"
            >
              <PlayCircle className="h-5 w-5" />
              Product tour
            </a>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6">
        <div
          className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-white to-gray-300 opacity-20"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </section>
  );
};

export default CTA;







