import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { api } from "../../shared/api";
import { useAuth } from "../../app/AuthContext";

export function ProfilePage() {
  const { state, refreshMe } = useAuth();
  const [name, setName] = useState(state.status === "authenticated" ? state.user.name : "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (state.status === "authenticated") {
      setName(state.user.name);
      (async () => {
        try {
          const res = await api.get("/api/auth/me");
          setEmail(res.data.user.email ?? "");
          setPhone(res.data.user.phone ?? "");
          setWalletAddress(res.data.user.walletAddress ?? "");
        } catch {}
      })();
    }
  }, [state.status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setBusy(true);
    try {
      await api.patch("/api/auth/me", {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        walletAddress: walletAddress.trim() || undefined
      });
      await refreshMe();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (state.status !== "authenticated") return null;

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Profile Management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Update your profile details and wallet address.
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                User ID:
              </Typography>
              <Chip label={state.user.userId} size="small" />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Role:
              </Typography>
              <Chip label={state.user.role} color="primary" size="small" />
            </Stack>
          </Stack>

          <form onSubmit={onSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">Profile updated.</Alert>}
              <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
              <TextField
                label="Wallet Address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={busy} fullWidth>
                {busy ? "Saving..." : "Save changes"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
