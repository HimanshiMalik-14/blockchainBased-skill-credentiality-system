import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./Layout";
import { AuthProvider, useAuth } from "./AuthContext";
import { LoginPage } from "../modules/auth/LoginPage";
import { RegisterPage } from "../modules/auth/RegisterPage";
import { ProfilePage } from "../modules/auth/ProfilePage";
import { VerificationPage } from "../modules/verification/VerificationPage";
import { InstitutionDashboard } from "../modules/institution/InstitutionDashboard";
import { AdminPanel } from "../modules/admin/AdminPanel";
import { HomePage } from "../modules/home/HomePage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  if (state.status === "loading") return null;
  if (state.status !== "authenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { state } = useAuth();
  if (state.status === "loading") return null;
  if (state.status !== "authenticated") return <Navigate to="/login" replace />;
  if (!roles.includes(state.user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify" element={<VerificationPage />} />
          <Route
            path="profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="institution"
            element={
              <RequireRole roles={["INSTITUTION", "ADMIN"]}>
                <InstitutionDashboard />
              </RequireRole>
            }
          />
          <Route
            path="admin"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AdminPanel />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
