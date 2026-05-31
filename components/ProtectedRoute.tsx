"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "../lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyUser = async () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        router.push("/admin/login");
        return;
      }

      const refreshedUser = await authService.refreshCurrentUser();
      if (!refreshedUser) {
        router.push("/admin/login");
        return;
      }

      const allowedRoles = ["admin", "finance_manager", "accountant", "auditor"];
      if (requireAdmin && !allowedRoles.includes(refreshedUser.role)) {
        await authService.logout();
        router.push("/admin/login");
        return;
      }

      setUser(refreshedUser);
      setLoading(false);
    };

    verifyUser();
  }, [router, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
