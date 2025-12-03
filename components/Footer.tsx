"use client";

// Footer component - no additional imports needed

const Footer = () => {
  const footerLinks = {
    resources: {
      title: "Resources",
      links: [
        { name: "API Documentation", href: "http://localhost:8000/docs", external: true },
        { name: "Backend API", href: "http://localhost:8000", external: true },
      ],
    },
    development: {
      title: "Development",
      links: [
        { name: "GitHub Repository", href: "https://github.com/brandedDesolation/invoice-forecasting-project", external: true },
        { name: "Project README", href: "https://github.com/brandedDesolation/invoice-forecasting-project#readme", external: true },
      ],
    },
  };

  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        {/* Header */}
        <div className="mb-16">
          <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Invoice Forecasting Project
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            AI-powered invoice forecasting and financial solutions for modern businesses.
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 border-t border-gray-800 pt-16">
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
                      target={link.external ? "_blank" : "_self"}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm leading-6 text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                      {link.external && (
                        <svg className="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
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
            <a 
              href="https://github.com/brandedDesolation/invoice-forecasting-project" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a 
              href="http://localhost:8000/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              API Docs
            </a>
          </div>
          <p className="mt-8 text-xs leading-5 text-gray-500 sm:mt-0">
            &copy; 2025 Invoice Forecasting Project
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;




