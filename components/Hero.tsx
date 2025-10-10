"use client";

import { ArrowRight, Play } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative isolate pt-32 pb-16 sm:pt-40 lg:pt-48 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-400 to-accent-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl animate-slide-up">
            AP automation, <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">reimagined</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Cut costs, improve accuracy, and scale smarter with AI-first accounting.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <a
              href="#demo"
              className="group rounded-full bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
            >
              Request demo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#platform"
              className="flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 hover:bg-primary-200 transition-colors">
                <Play className="h-4 w-4 text-primary-600 fill-primary-600" />
              </div>
              Our platform
            </a>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center animate-scale-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                5x
              </div>
              <div className="mt-2 text-sm text-gray-600">Faster invoice processing</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: "0.4s" }}>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                85%
              </div>
              <div className="mt-2 text-sm text-gray-600">No-touch rate by month 6</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: "0.5s" }}>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                99%
              </div>
              <div className="mt-2 text-sm text-gray-600">Invoice accuracy rate</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: "0.6s" }}>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                7mo
              </div>
              <div className="mt-2 text-sm text-gray-600">Payback period</div>
            </div>
          </div>
        </div>

        {/* Video/Visual placeholder */}
        <div className="mx-auto mt-16 max-w-5xl animate-scale-in" style={{ animationDelay: "0.7s" }}>
          <div className="relative rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 p-1 shadow-2xl">
            <div className="relative aspect-video rounded-xl bg-gray-900 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                  <p className="text-white text-lg font-semibold">Eliminate AP bottlenecks and gain full cash control</p>
                </div>
              </div>
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent-600/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-accent-400 to-primary-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </section>
  );
};

export default Hero;


