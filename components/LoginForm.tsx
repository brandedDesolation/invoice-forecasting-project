"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService, LoginCredentials } from "../lib/auth";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const demoAccounts = [
  {
    label: "Project Admin",
    description: "Full demo owner account",
    email: "admin@invoiceforecast.com",
    password: "admin123",
  },
  {
    label: "Finance Manager",
    description: "Approvals, workflow, reports",
    email: "manager@vicai.demo",
    password: "manager123",
  },
  {
    label: "AP Specialist",
    description: "Invoices, review queue, payments",
    email: "accountant@vicai.demo",
    password: "accountant123",
  },
  {
    label: "Internal Auditor",
    description: "Audit trail and analytics review",
    email: "auditor@vicai.demo",
    password: "auditor123",
  },
];

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | boolean>) => void;
        };
      };
    };
  }
}

export default function LoginForm() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const router = useRouter();

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setError("Google did not return a credential");
            return;
          }

          setLoading(true);
          setError("");
          const result = await authService.loginWithGoogle(response.credential);
          setLoading(false);
          if (result.success) {
            router.push("/admin/dashboard");
          } else {
            setError(result.error || "Google sign-in failed");
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "continue_with",
      });
    };

    if (window.google) {
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);
  }, [googleClientId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authService.login(credentials);
      
      if (result.success) {
        router.push("/admin/dashboard");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-['Montserrat',system-ui,-apple-system,sans-serif]">
      {/* Starry Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
        {/* Stars */}
        <div className="absolute inset-0 opacity-60">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        {/* Reflective surface at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Back to Home Link */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>

          {/* Neumorphic Login Container */}
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-lg p-8 shadow-2xl border border-gray-700/50 relative">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-lg"></div>
            
            {/* Header */}
            <div className="text-center mb-8 relative z-10">
              <p className="text-gray-400 text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {googleClientId && (
                <>
                  <div ref={googleButtonRef} className="min-h-[44px]" />
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-700" />
                    <span className="text-xs uppercase tracking-wide text-gray-500">or email login</span>
                    <div className="h-px flex-1 bg-gray-700" />
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all backdrop-blur-sm"
                  placeholder="Email"
                  value={credentials.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all backdrop-blur-sm pr-12"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3 backdrop-blur-sm">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Demo Login */}
            <div className="mt-8 pt-6 border-t border-gray-700/50 relative z-10">
              <button
                type="button"
                onClick={() => setShowDemoCredentials((value) => !value)}
                className="w-full text-center text-gray-400 hover:text-white text-sm transition-colors"
              >
                {showDemoCredentials ? "Hide demo accounts" : "Use demo account"}
              </button>
              {showDemoCredentials && (
                <div className="mt-4 space-y-3 text-sm rounded-md border border-gray-700/50 bg-black/20 p-4">
                  <p className="text-center text-gray-400">
                    Choose a realistic demo persona. All accounts use real backend JWT login.
                  </p>
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => setCredentials({ email: account.email, password: account.password })}
                      className="w-full rounded-md border border-white/10 px-3 py-3 text-left text-white hover:border-white/30 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{account.label}</p>
                          <p className="text-xs text-gray-400">{account.description}</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-gray-300">Fill</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        <span className="font-mono text-gray-200">{account.email}</span>
                        <span className="mx-2">/</span>
                        <span className="font-mono text-gray-200">{account.password}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Join over <span className="font-bold text-white">2M</span> global users
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
