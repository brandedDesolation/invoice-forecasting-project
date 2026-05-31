"use client";

import { useEffect, useState } from "react";
import { Shield, Users } from "lucide-react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { AdminPageSkeleton } from "../../../components/Skeleton";
import { ToastContainer, useToast } from "../../../components/Toast";
import { getErrorMessage, userApi } from "../../../lib/api";
import type { User } from "../../../lib/auth";

const roles = ["admin", "finance_manager", "accountant", "auditor"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toasts, removeToast, success, error: showError } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      setUsers(await userApi.getUsers());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const updateRole = async (user: User, role: string) => {
    try {
      await userApi.updateUser(user.id, { role });
      success("Role Updated", `${user.name} is now ${role.replace(/_/g, " ")}.`);
      await loadUsers();
    } catch (err) {
      showError("Update Failed", getErrorMessage(err));
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await userApi.updateUser(user.id, { is_active: !user.is_active });
      success("User Updated", `${user.name} is ${user.is_active ? "inactive" : "active"}.`);
      await loadUsers();
    } catch (err) {
      showError("Update Failed", getErrorMessage(err));
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="users">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        {loading ? (
          <AdminPageSkeleton title="Loading ERP users..." />
        ) : error ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-red-200">{error}</div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white">User Management</h1>
              <p className="mt-2 text-white/60">Manage ERP personas, roles, and account status.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                <Users className="mb-3 h-5 w-5 text-white/70" />
                <p className="text-sm text-white/60">Total Users</p>
                <p className="mt-2 text-3xl font-bold text-white">{users.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                <Shield className="mb-3 h-5 w-5 text-white/70" />
                <p className="text-sm text-white/60">Active Users</p>
                <p className="mt-2 text-3xl font-bold text-white">{users.filter((user) => user.is_active !== false).length}</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                <p className="text-sm text-white/60">Roles</p>
                <p className="mt-2 text-3xl font-bold text-white">{roles.length}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-white/50">{user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{user.company || "-"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(event) => void updateRole(user, event.target.value)}
                          className="rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm text-white"
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>{role.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{user.is_active === false ? "Inactive" : "Active"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => void toggleActive(user)}
                          className="rounded-md border border-white/20 px-3 py-2 text-sm text-white hover:border-white/40"
                        >
                          {user.is_active === false ? "Activate" : "Deactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
