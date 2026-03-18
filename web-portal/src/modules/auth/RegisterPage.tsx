import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../shared/api";
import { authStorage } from "../../shared/authStorage";
import { useAuth } from "../../app/AuthContext";

type RegisterResponse = {
  user: { userId: string; role: string; name: string };
  tokens: { accessToken: string; refreshToken: string };
};

export function RegisterPage() {
  const nav = useNavigate();
  const { refreshMe } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"LEARNER" | "INSTITUTION" | "EMPLOYER">("LEARNER");
  const [institutionId, setInstitutionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload: any = { name, password, role };
      if (email.trim()) payload.email = email.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (!payload.email && !payload.phone) {
        setError("Email or phone required");
        setBusy(false);
        return;
      }
      if (role === "INSTITUTION" && !institutionId.trim()) {
        setError("Institution ID required for Institution role");
        setBusy(false);
        return;
      }
      if (role === "INSTITUTION") payload.institutionId = institutionId.trim();

      const res = await api.post<RegisterResponse>("/api/auth/register", payload);
      authStorage.setTokens(res.data.tokens);
      await refreshMe();
      nav("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 520, mx: "auto" }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Create Account
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Mobile/email registration with role-based access.
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={onSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                fullWidth
              />
              <TextField
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
                fullWidth
              />
              <FormControl component="fieldset">
                <FormLabel>Role</FormLabel>
                <RadioGroup row value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <FormControlLabel value="LEARNER" control={<Radio />} label="Learner" />
                  <FormControlLabel value="INSTITUTION" control={<Radio />} label="Institution" />
                  <FormControlLabel value="EMPLOYER" control={<Radio />} label="Employer / Verifier" />
                </RadioGroup>
              </FormControl>
              {role === "INSTITUTION" && (
                <TextField
                  label="Institution ID"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  placeholder="inst_xxxxx (from Admin)"
                  required
                  fullWidth
                />
              )}
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                helperText="Min 8 characters"
              />
              <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
                {busy ? "Creating account..." : "Register"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
