import React, { useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../shared/api";
import { authStorage } from "../../shared/authStorage";
import { useAuth } from "../../app/AuthContext";

type LoginResponse = {
  user: { userId: string; role: string; name: string };
  tokens: { accessToken: string; refreshToken: string };
};

export function LoginPage() {
  const nav = useNavigate();
  const { refreshMe } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mode = useMemo(() => {
    const v = emailOrPhone.trim();
    return v.includes("@") ? "email" : "phone";
  }, [emailOrPhone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload =
        mode === "email"
          ? { email: emailOrPhone.trim(), password }
          : { phone: emailOrPhone.trim(), password };
      const res = await api.post<LoginResponse>("/api/auth/login", payload);
      authStorage.setTokens(res.data.tokens);
      await refreshMe();
      nav("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 440, mx: "auto" }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Sign In
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        OTP or password login. Use your institution/admin credentials for dashboards.
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={onSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email or phone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                autoComplete="username"
                required
                fullWidth
              />
              <TextField
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
                fullWidth
              />
              <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
