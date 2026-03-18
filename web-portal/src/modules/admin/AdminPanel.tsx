import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import {
  AdminPanelSettings,
  Business,
  Description,
  People,
  Assessment,
  History
} from "@mui/icons-material";
import { api } from "../../shared/api";

type Institution = {
  institutionId: string;
  name: string;
  location?: string;
  accreditationStatus: string;
};
type Template = { templateId: string; name: string; version: string; status: string };
type User = { userId: string; name: string; role: string; email?: string; status: string };
type VerificationLog = { verificationId: string; certificateId: string; result: string; timestamp: string };

export function AdminPanel() {
  const [tab, setTab] = useState(0);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [instName, setInstName] = useState("");
  const [instLocation, setInstLocation] = useState("");
  const [tplName, setTplName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setBusy(true);
    try {
      const [iRes, tRes, uRes, lRes, aRes] = await Promise.all([
        api.get<{ institutions: Institution[] }>("/api/institutions"),
        api.get<{ templates: Template[] }>("/api/templates"),
        api.get<{ users: User[] }>("/api/admin/users"),
        api.get<{ logs: VerificationLog[] }>("/api/admin/verification-logs"),
        api.get("/api/admin/analytics")
      ]);
      setInstitutions(iRes.data.institutions);
      setTemplates(tRes.data.templates);
      setUsers(uRes.data.users);
      setLogs(lRes.data.logs);
      setAnalytics(aRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to load");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  async function createInstitution() {
    setError(null);
    setBusy(true);
    try {
      await api.post("/api/institutions", {
        name: instName.trim(),
        location: instLocation.trim() || undefined
      });
      setInstName("");
      setInstLocation("");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(institutionId: string, status: string) {
    setError(null);
    setBusy(true);
    try {
      await api.post(`/api/institutions/${institutionId}/status`, { accreditationStatus: status });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createTemplate() {
    setError(null);
    setBusy(true);
    try {
      await api.post("/api/templates", { name: tplName.trim() });
      setTplName("");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function approveTemplate(templateId: string) {
    setError(null);
    setBusy(true);
    try {
      await api.post(`/api/templates/${templateId}/approve`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  const stats = institutions.reduce(
    (a, i) => {
      a[i.accreditationStatus] = (a[i.accreditationStatus] || 0) + 1;
      return a;
    },
    {} as Record<string, number>
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <AdminPanelSettings color="primary" />
        <Typography variant="h4" fontWeight={800}>
          Admin Panel
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Institution registration approval, certificate template management, credential monitoring, user management, and
        system activity logs.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<Business />} iconPosition="start" label="Institutions" />
        <Tab icon={<Description />} iconPosition="start" label="Templates" />
        <Tab icon={<People />} iconPosition="start" label="Users" />
        <Tab icon={<Assessment />} iconPosition="start" label="Analytics" />
        <Tab icon={<History />} iconPosition="start" label="Activity Logs" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Create Institution
                </Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField label="Name" value={instName} onChange={(e) => setInstName(e.target.value)} fullWidth />
                  <TextField
                    label="Location"
                    value={instLocation}
                    onChange={(e) => setInstLocation(e.target.value)}
                    fullWidth
                  />
                  <Button variant="contained" onClick={createInstitution} disabled={busy || !instName.trim()}>
                    Create
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip label={`Pending: ${stats.PENDING || 0}`} />
                  <Chip color="success" label={`Approved: ${stats.APPROVED || 0}`} />
                  <Chip color="warning" label={`Suspended: ${stats.SUSPENDED || 0}`} />
                  <Chip label={`Rejected: ${stats.REJECTED || 0}`} />
                </Stack>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Institutions
                </Typography>
                <Stack spacing={1}>
                  {institutions.map((i) => (
                    <Box
                      key={i.institutionId}
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1
                      }}
                    >
                      <Stack>
                        <Typography fontWeight={600}>{i.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {i.institutionId} {i.location ? `• ${i.location}` : ""}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={i.accreditationStatus}
                          size="small"
                          color={
                            i.accreditationStatus === "APPROVED"
                              ? "success"
                              : i.accreditationStatus === "SUSPENDED"
                                ? "warning"
                                : "default"
                          }
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={i.accreditationStatus}
                            onChange={(e) => setStatus(i.institutionId, e.target.value)}
                            label="Status"
                            disabled={busy}
                          >
                            {["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map((s) => (
                              <MenuItem key={s} value={s}>
                                {s}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Create Template
                </Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField label="Name" value={tplName} onChange={(e) => setTplName(e.target.value)} fullWidth />
                  <Button variant="contained" onClick={createTemplate} disabled={busy || !tplName.trim()}>
                    Create
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Certificate Templates
                </Typography>
                <Stack spacing={1}>
                  {templates.map((t) => (
                    <Box
                      key={t.templateId}
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <Typography fontWeight={600}>
                        {t.name} (v{t.version})
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label={t.status} size="small" color={t.status === "APPROVED" ? "success" : "default"} />
                        {t.status !== "APPROVED" && (
                          <Button size="small" variant="outlined" onClick={() => approveTemplate(t.templateId)} disabled={busy}>
                            Approve
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              User Management
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell>{u.userId}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>
                      <Chip label={u.role} size="small" />
                    </TableCell>
                    <TableCell>{u.email ?? "—"}</TableCell>
                    <TableCell>{u.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 3 && analytics && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Certificates Issued</Typography>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  {analytics.certificatesIssued}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Verification Requests</Typography>
                <Typography variant="h4" fontWeight={800} color="secondary.main">
                  {analytics.verificationRequests}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Approved Institutions</Typography>
                <Typography variant="h4" fontWeight={800} color="success.main">
                  {analytics.approvedInstitutions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              System Activity Logs (Verification)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Verification ID</TableCell>
                  <TableCell>Certificate ID</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.verificationId}>
                    <TableCell>{l.verificationId}</TableCell>
                    <TableCell>{l.certificateId}</TableCell>
                    <TableCell>
                      <Chip
                        label={l.result}
                        size="small"
                        color={
                          l.result === "VALID"
                            ? "success"
                            : l.result === "REVOKED"
                              ? "warning"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>{new Date(l.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
