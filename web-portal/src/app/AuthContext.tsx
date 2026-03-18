import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../shared/api";
import { authStorage } from "../shared/authStorage";
import type { MeResponse, Role } from "./types";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | {
      status: "authenticated";
      user: { userId: string; role: Role; name: string; institutionId?: string | null };
    };

type AuthContextValue = {
  state: AuthState;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const refreshMe = useCallback(async () => {
    const token = authStorage.getAccessToken();
    if (!token) {
      setState({ status: "anonymous" });
      return;
    }
    try {
      const res = await api.get<MeResponse>("/api/auth/me");
      setState({
        status: "authenticated",
        user: {
          userId: res.data.user.userId,
          role: res.data.user.role,
          name: res.data.user.name,
          institutionId: res.data.user.institutionId ?? null
        }
      });
    } catch {
      authStorage.clear();
      setState({ status: "anonymous" });
    }
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setState({ status: "anonymous" });
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const value = useMemo(() => ({ state, refreshMe, logout }), [state, refreshMe, logout]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

