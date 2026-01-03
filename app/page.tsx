"use client";

import Link from "next/link";
import { Github, ExternalLink, FileText, Database, Code, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("about");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["about", "features", "tech", "api", "admin"];
      const scrollPosition = window.scrollY + 100;

      // Find which section is currently in view
      let currentSection = "about"; // default

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop } = element;
          if (scrollPosition >= offsetTop - 50) {
            currentSection = section;
            break;
          }
        }
      }

      setActiveSection(currentSection);
    };

    // Call once on mount to set initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div className="min-h-screen bg-black leading-relaxed text-gray-300 antialiased selection:bg-white selection:text-black">
      <div className="mx-auto min-h-screen max-w-screen-xl px-6 py-12 font-sans md:px-12 md:py-20 lg:px-24 lg:py-0">
        <div className="lg:flex lg:justify-between lg:gap-4">
          {/* Main Content */}
          <main id="content" className="pt-24 lg:w-1/2 lg:py-24">
            {/* About Section */}
            <section id="about" className="mb-40 scroll-mt-16 md:mb-48 lg:mb-64 lg:scroll-mt-24" aria-label="About">
              <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">About</h2>
              </div>
              <div className="mt-8">
                <p className="mb-12 text-gray-400 mt-8">
                  This project leverages cutting-edge AI and machine learning technologies to revolutionize invoice forecasting and financial automation. Our platform provides intelligent predictions, automated processing, and real-time analytics for modern finance teams.
                </p>
                <p className="mb-12 text-gray-400">
                  Built with a modern tech stack, the system offers seamless CSV/Excel data import, automated invoice processing, and predictive analytics powered by advanced ML models. The platform is designed to help finance professionals make data-driven decisions with confidence.
                </p>
                <p className="text-gray-400">
                  Currently, the backend infrastructure is built with <span className="font-medium text-white">FastAPI</span> and <span className="font-medium text-white">Python</span>, providing a robust foundation for AI model integration. The frontend utilizes <span className="font-medium text-white">Next.js</span> and <span className="font-medium text-white">TypeScript</span> for a performant, type-safe user experience.
                </p>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="mb-40 scroll-mt-16 md:mb-48 lg:mb-64 lg:scroll-mt-24" aria-label="Features">
              <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">Features</h2>
              </div>
              <div className="mt-8">
                <ul className="group/list">
                  <li className="mb-32">
                    <div className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
                      <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-gray-800/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(59,130,246,0.1)] lg:group-hover:drop-shadow-lg"></div>
                      <div className="z-10 sm:col-span-6">
                        <h3 className="font-medium leading-snug text-gray-100">
                          <div className="inline-flex items-baseline font-medium leading-tight text-gray-100 hover:text-white focus-visible:text-white group/link text-base">
                            <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"></span>
                            <Database className="mr-2 h-4 w-4 inline" />
                            <span>Invoice Data Processing</span>
                          </div>
                        </h3>
                        <p className="mt-2 text-sm leading-normal text-gray-400">
                          Upload and process invoice data from CSV/Excel files with automated validation and error handling. The system intelligently parses invoice information and prepares it for forecasting analysis.
                        </p>
                        <ul className="mt-2 flex flex-wrap" aria-label="Technologies used">
                          <li className="mr-1.5 mt-2">
                            <div className="flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium leading-5 text-white">
                              Pandas
                            </div>
                          </li>
                          <li className="mr-1.5 mt-2">
                            <div className="flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium leading-5 text-white">
                              SQLAlchemy
                            </div>
                          </li>
                          <li className="mr-1.5 mt-2">
                            <div className="flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium leading-5 text-white">
                              FastAPI
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>

                  <li className="mb-32 ml-1">
                    <div className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
                      {/* Layered shadow system for depth */}
                      <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition-all duration-500 motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-gradient-to-br lg:group-hover:from-gray-800/30 lg:group-hover:to-gray-900/40 lg:group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] lg:group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:group-hover:drop-shadow-2xl"></div>
                      <div className="absolute -inset-x-3 -inset-y-3 z-0 hidden rounded-md transition-all duration-300 motion-reduce:transition-none lg:-inset-x-5 lg:block lg:group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] lg:group-hover:drop-shadow-lg"></div>
                      
                      <div className="z-10 sm:col-span-6">
                        <h3 className="font-medium leading-snug text-gray-100">
                          <div className="inline-flex items-baseline font-medium leading-tight text-gray-100 hover:text-white focus-visible:text-white group/link text-base transition-all duration-300">
                            <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"></span>
                            <Zap className="mr-2 h-4 w-4 inline transition-all duration-300 group-hover:scale-110 ml-0.5" />
                            <span className="font-semibold tracking-tight">AI-Powered Forecasting</span>
                          </div>
                        </h3>
                        <p className="mt-3 text-sm leading-normal text-gray-400 transition-all duration-300">
                          Advanced machine learning models analyze historical invoice data to predict future payment patterns, cash flow trends, and potential late payments with high accuracy.
                        </p>
                        <ul className="mt-3 flex flex-wrap" aria-label="Technologies used">
                          <li className="mr-1.5 mt-2 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center rounded-full bg-gradient-to-br from-gray-800/40 to-gray-900/60 px-3 py-1.5 text-xs font-medium leading-5 text-white border border-gray-600/30 shadow-lg hover:shadow-xl hover:border-gray-500/40 transition-all duration-300 backdrop-blur-sm">
                              Machine Learning
                            </div>
                          </li>
                          <li className="mr-1.5 mt-2 transition-all duration-300 hover:scale-105 ml-0.5">
                            <div className="flex items-center rounded-full bg-gradient-to-br from-gray-800/40 to-gray-900/60 px-3 py-1.5 text-xs font-medium leading-5 text-white border border-gray-600/30 shadow-lg hover:shadow-xl hover:border-gray-500/40 transition-all duration-300 backdrop-blur-sm">
                              Python
                            </div>
                          </li>
                          <li className="mr-1.5 mt-2 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center rounded-full bg-gradient-to-br from-gray-800/40 to-gray-900/60 px-3 py-1.5 text-xs font-medium leading-5 text-white border border-gray-600/30 shadow-lg hover:shadow-xl hover:border-gray-500/40 transition-all duration-300 backdrop-blur-sm">
                              Time Series Analysis
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>

                  <li className="mb-32 -ml-0.5">
                    <div className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
                      {/* Layered shadow system for depth */}
                      <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition-all duration-500 motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-gradient-to-br lg:group-hover:from-gray-800/30 lg:group-hover:to-gray-900/40 lg:group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] lg:group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:group-hover:drop-shadow-2xl"></div>
                      <div className="absolute -inset-x-3 -inset-y-3 z-0 hidden rounded-md transition-all duration-300 motion-reduce:transition-none lg:-inset-x-5 lg:block lg:group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] lg:group-hover:drop-shadow-lg"></div>
                      
                      <div className="z-10 sm:col-span-6">
                        <h3 className="font-medium leading-snug text-gray-100">
                          <div className="inline-flex items-baseline font-medium leading-tight text-gray-100 hover:text-white focus-visible:text-white group/link text-base transition-all duration-300">
                            <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"></span>
                            <Code className="mr-2 h-4 w-4 inline transition-all duration-300 group-hover:scale-110 -ml-0.5" />
                            <span className="font-semibold tracking-tight">RESTful API Architecture</span>
                          </div>
                        </h3>
                        <p className="mt-4 text-sm leading-normal text-gray-400 transition-all duration-300">
                          Comprehensive REST API with automatic documentation, authentication, and real-time data processing. Built with modern async Python for maximum performance and scalability.
                        </p>
                        <ul className="mt-4 flex flex-wrap" aria-label="Technologies used">
                          <li className="mr-1.5 mt-2 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center rounded-full bg-gradient-to-br from-gray-800/40 to-gray-900/60 px-3 py-1.5 text-xs font-medium leading-5 text-white border border-gray-600/30 shadow-lg hover:shadow-xl hover:border-gray-500/40 transition-all duration-300 backdrop-blur-sm">
                              FastAPI
                            </div>
                          </li>
                          <li className="mr-1.5 mt-2 transition-all duration-300 hover:scale-105 ml-1">
                            <div className="flex items-center rounded-full bg-gradient-to-br from-gray-800/40 to-gray-900/60 px-3 py-1.5 text-xs font-medium leading-5 text-white border border-gray-600/30 shadow-lg hover:shadow-xl hover:border-gray-500/40 transition-all duration-300 backdrop-blur-sm">
                              Pydantic
                            </div>
                          </li>
                          <li className="mr-1.5 mt-2 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center rounded-full bg-gradient-to-br from-gray-800/40 to-gray-900/60 px-3 py-1.5 text-xs font-medium leading-5 text-white border border-gray-600/30 shadow-lg hover:shadow-xl hover:border-gray-500/40 transition-all duration-300 backdrop-blur-sm">
                              OpenAPI
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>

                    <div className="mt-20">
                  <a
                    className="inline-flex items-center font-medium leading-tight text-gray-100 group"
                    aria-label="View Backend API"
                    href="http://localhost:8000/docs"
                    target="_blank"
                  >
                    <span className="border-b border-transparent pb-px transition group-hover:border-white motion-reduce:transition-none">
                      View API Documentation
                    </span>
                    <ExternalLink className="ml-1 inline-block h-4 w-4 shrink-0 -translate-y-px transition-transform group-hover:translate-x-2 group-focus-visible:translate-x-2 motion-reduce:transition-none" />
                  </a>
                </div>
              </div>
            </section>

            {/* Tech Stack Section */}
            <section id="tech" className="mb-40 scroll-mt-16 md:mb-48 lg:mb-64 lg:scroll-mt-24" aria-label="Tech Stack">
              <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">Tech Stack</h2>
              </div>
              <div className="mt-8">
                <div className="mb-20">
                  <h3 className="mb-4 text-sm font-semibold text-gray-100">Backend</h3>
                  <ul className="flex flex-wrap gap-2">
                    {['Python', 'FastAPI', 'SQLAlchemy', 'Pydantic', 'Pandas', 'NumPy', 'Alembic'].map((tech) => (
                      <li key={tech}>
                        <div className="flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium leading-5 text-white">
                          {tech}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-20">
                  <h3 className="mb-4 text-sm font-semibold text-gray-100">Frontend</h3>
                  <ul className="flex flex-wrap gap-2">
                    {['Next.js', 'React', 'TypeScript', 'Tailwind CSS'].map((tech) => (
                      <li key={tech}>
                        <div className="flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium leading-5 text-white">
                          {tech}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-gray-100">Database & Tools</h3>
                  <ul className="flex flex-wrap gap-2">
                    {['SQLite', 'PostgreSQL', 'Git', 'GitHub', 'Pytest'].map((tech) => (
                      <li key={tech}>
                        <div className="flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium leading-5 text-white">
                          {tech}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* API Section */}
            <section id="api" className="mb-40 scroll-mt-16 md:mb-48 lg:mb-64 lg:scroll-mt-24" aria-label="API">
              <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">API</h2>
              </div>
              <div className="mt-8">
                <p className="mb-12 text-gray-400">
                  The Invoice Forecasting API provides comprehensive endpoints for invoice management, data processing, and AI-powered predictions. Built with FastAPI, it offers automatic interactive documentation and OpenAPI schema generation.
                </p>
                <div className="mb-16">
                  <h3 className="mb-2 text-sm font-semibold text-gray-100">Key Endpoints:</h3>
                  <ul className="ml-4 list-disc space-y-1 text-gray-400">
                    <li><code className="rounded bg-gray-800 px-2 py-0.5 text-sm text-white">/api/v1/invoices</code> - CRUD operations for invoices</li>
                    <li><code className="rounded bg-gray-800 px-2 py-0.5 text-sm text-white">/api/v1/forecast</code> - AI-powered forecasting service</li>
                    <li><code className="rounded bg-gray-800 px-2 py-0.5 text-sm text-white">/api/v1/upload</code> - File upload and data import</li>
                    <li><code className="rounded bg-gray-800 px-2 py-0.5 text-sm text-white">/api/v1/analytics</code> - Financial insights and trends</li>
                  </ul>
                </div>
                    <div className="mt-12 flex gap-4">
                  <a
                    href="http://localhost:8000/docs"
                    target="_blank"
                    className="inline-flex items-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    API Documentation
                  </a>
                  <a
                    href="https://github.com/brandedDesolation/invoice-forecasting-project"
                    target="_blank"
                    className="inline-flex items-center rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700 transition-colors"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </a>
                </div>
              </div>
            </section>

                {/* Admin Section */}
                <section id="admin" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-32 lg:scroll-mt-24" aria-label="Admin">
                  <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">Admin</h2>
                  </div>
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-white mb-4">
                      Admin Dashboard
                    </h2>
                    <p className="text-gray-400 mb-6">
                      Access our comprehensive admin panel to manage invoices, customers, and view detailed analytics. The dashboard provides powerful tools for financial automation and invoice forecasting.
                    </p>
                    <p className="text-gray-400 mb-8">
                      Features include real-time invoice management, customer relationship tracking, payment analytics, and AI-powered forecasting insights. Built with security and usability in mind for finance professionals.
                    </p>
                    <div className="mt-8">
                      <a
                        className="inline-flex items-center font-medium leading-tight text-gray-100 group"
                        aria-label="Access Admin Dashboard"
                        href="/admin/login"
                      >
                        <span className="border-b border-transparent pb-px transition group-hover:border-white motion-reduce:transition-none">
                          Access Admin Dashboard
                        </span>
                      </a>
                    </div>
                  </div>
                </section>

                <footer className="max-w-md pb-16 text-sm text-gray-500 sm:pb-0">
                  <p>
                    Built with{" "}
                    <a href="https://nextjs.org/" className="font-medium text-gray-400 hover:text-white focus-visible:text-white" target="_blank" rel="noreferrer">
                      Next.js
                    </a>{" "}
                    and{" "}
                    <a href="https://tailwindcss.com/" className="font-medium text-gray-400 hover:text-white focus-visible:text-white" target="_blank" rel="noreferrer">
                      Tailwind CSS
                    </a>
                    . Inspired by{" "}
                    <a href="https://brittanychiang.com/" className="font-medium text-gray-400 hover:text-white focus-visible:text-white" target="_blank" rel="noreferrer">
                      Brittany Chiang
                    </a>
                    .
                  </p>
                </footer>
    </main>

          {/* Right Sidebar */}
          <header className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-1/2 lg:flex-col lg:justify-between lg:py-24">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                <a href="/">Invoice Forecasting</a>
              </h1>
              <h2 className="mt-16 text-lg font-medium tracking-tight text-gray-100 sm:text-xl">
                AI-Powered Financial Solutions
              </h2>
              <p className="mt-16 max-w-xs leading-normal text-gray-400">
                Building intelligent systems for invoice prediction and financial automation.
              </p>
              
              {/* Navigation */}
              <nav className="nav hidden lg:block" aria-label="In-page jump links">
                <ul className="mt-24 w-max">
                  <li>
                    <a className={`group flex items-center py-2 ${activeSection === "about" ? "nav-active" : ""}`} href="#about">
                      <span className="nav-indicator mr-4 h-px w-8 bg-gray-600 transition-all group-hover:w-16 group-hover:bg-white group-focus-visible:w-16 motion-reduce:transition-none"></span>
                      <span className="nav-text text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-100 group-focus-visible:text-gray-100">
                        About
                      </span>
                    </a>
                  </li>
                  <li>
                    <a className={`group flex items-center py-2 ${activeSection === "features" ? "nav-active" : ""}`} href="#features">
                      <span className="nav-indicator mr-4 h-px w-8 bg-gray-600 transition-all group-hover:w-16 group-hover:bg-white group-focus-visible:w-16 motion-reduce:transition-none"></span>
                      <span className="nav-text text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-100 group-focus-visible:text-gray-100">
                        Features
                      </span>
                    </a>
                  </li>
                  <li>
                    <a className={`group flex items-center py-2 ${activeSection === "tech" ? "nav-active" : ""}`} href="#tech">
                      <span className="nav-indicator mr-4 h-px w-8 bg-gray-600 transition-all group-hover:w-16 group-hover:bg-white group-focus-visible:w-16 motion-reduce:transition-none"></span>
                      <span className="nav-text text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-100 group-focus-visible:text-gray-100">
                        Tech Stack
                      </span>
                    </a>
                  </li>
                  <li>
                    <a className={`group flex items-center py-2 ${activeSection === "api" ? "nav-active" : ""}`} href="#api">
                      <span className="nav-indicator mr-4 h-px w-8 bg-gray-600 transition-all group-hover:w-16 group-hover:bg-white group-focus-visible:w-16 motion-reduce:transition-none"></span>
                      <span className="nav-text text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-100 group-focus-visible:text-gray-100">
                        API
                      </span>
                    </a>
                  </li>
                  <li>
                    <a className={`group flex items-center py-2 ${activeSection === "admin" ? "nav-active" : ""}`} href="#admin">
                      <span className="nav-indicator mr-4 h-px w-8 bg-gray-600 transition-all group-hover:w-16 group-hover:bg-white group-focus-visible:w-16 motion-reduce:transition-none"></span>
                      <span className="nav-text text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-100 group-focus-visible:text-gray-100">
                        Admin
                      </span>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Social Links */}
            <ul className="ml-1 mt-24 flex items-center" aria-label="Social media">
              <li className="mr-5 text-xs">
                <a
                  className="block text-gray-400 hover:text-white transition-colors"
                  href="https://github.com/brandedDesolation/invoice-forecasting-project"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="sr-only">GitHub</span>
                  <Github className="h-6 w-6" />
                </a>
              </li>
              <li className="mr-5 text-xs">
                <a
                  className="block text-gray-400 hover:text-white transition-colors"
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="sr-only">API Documentation</span>
                  <FileText className="h-6 w-6" />
                </a>
              </li>
            </ul>
          </header>
        </div>
      </div>
    </div>
  );
}
