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
  TextField,
  Typography
} from "@mui/material";
import { Add, CloudUpload, List, School } from "@mui/icons-material";
import { api } from "../../shared/api";
import { useAuth } from "../../app/AuthContext";

type Template = { templateId: string; name: string; version: string; status: string };
type Certificate = {
  certificateId: string;
  learnerId: string;
  courseName: string;
  issueDate: string;
  status: string;
  blockchain?: { txHash?: string };
};

export function InstitutionDashboard() {
  const { state } = useAuth();
  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [learnerId, setLearnerId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [batchText, setBatchText] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          api.get<{ templates: Template[] }>("/api/templates"),
          api.get<{ certificates: Certificate[] }>("/api/certificates")
        ]);
        setTemplates(tRes.data.templates);
        setCertificates(cRes.data.certificates);
      } catch {}
    })();
  }, [tab, issued]);

  async function issueSingle() {
    setBusy(true);
    setError(null);
    setIssued(null);
    try {
      const payload: any = { learnerId: learnerId.trim(), courseName: courseName.trim() };
      if (templateId) payload.templateId = templateId;
      if (metadataUri.trim()) payload.metadataUri = metadataUri.trim();
      if (state.user.role === "ADMIN" && institutionId.trim()) payload.institutionId = institutionId.trim();

      const res = await api.post("/api/certificates/issue", payload);
      setIssued(res.data.certificate);
      setLearnerId("");
      setCourseName("");
      setMetadataUri("");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Issuance failed");
    } finally {
      setBusy(false);
    }
  }

  async function issueBatch() {
    setBusy(true);
    setError(null);
    setBatchResults(null);
    try {
      const lines = batchText
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const items = lines.map((line) => {
        const [learnerId, courseName] = line.split(",").map((s) => s.trim());
        return { learnerId: learnerId || "", courseName: courseName || "" };
      });
      if (items.some((i) => !i.learnerId || !i.courseName)) {
        setError("Each line must be: learnerId,courseName");
        setBusy(false);
        return;
      }
      const payload: any = { items };
      if (templateId) items.forEach((i) => ((i as any).templateId = templateId));
      if (state.user.role === "ADMIN" && institutionId.trim()) payload.institutionId = institutionId.trim();

      const res = await api.post<{ results: any[] }>("/api/certificates/issue/batch", payload);
      setBatchResults(res.data.results);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Batch issuance failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <School color="primary" />
        <Typography variant="h4" fontWeight={800}>
          Institution Dashboard
        </Typography>
      </Stack>
      {state.status === "authenticated" && (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Institution ID: <strong>{state.user.institutionId ?? "—"}</strong>
        </Typography>
      )}

      {state.user.role === "ADMIN" && (
        <TextField
          label="Institution ID (for issuing)"
          value={institutionId}
          onChange={(e) => setInstitutionId(e.target.value)}
          placeholder="inst_xxxxx"
          sx={{ mb: 2, maxWidth: 400 }}
          size="small"
        />
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<Add />} iconPosition="start" label="Issue Single" />
        <Tab icon={<CloudUpload />} iconPosition="start" label="Batch Issuance" />
        <Tab icon={<List />} iconPosition="start" label="Certificate List" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Certificate Issuance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Learner result upload, certificate template selection, and blockchain minting.
            </Typography>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {issued && (
                <Alert severity="success">
                  Issued <strong>{issued.certificateId}</strong>{" "}
                  {issued.blockchain?.txHash && `(tx: ${issued.blockchain.txHash.slice(0, 18)}...)`}
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Learner ID"
                    value={learnerId}
                    onChange={(e) => setLearnerId(e.target.value)}
                    placeholder="usr_xxxxx"
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Course Name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Template</InputLabel>
                    <Select
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      label="Template"
                    >
                      <MenuItem value="">— None —</MenuItem>
                      {templates.filter((t) => t.status === "APPROVED").map((t) => (
                        <MenuItem key={t.templateId} value={t.templateId}>
                          {t.name} (v{t.version})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Metadata URI"
                    value={metadataUri}
                    onChange={(e) => setMetadataUri(e.target.value)}
                    placeholder="ipfs://... or https://..."
                    fullWidth
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                onClick={issueSingle}
                disabled={busy || !learnerId.trim() || !courseName.trim()}
              >
                {busy ? "Issuing..." : "Issue on Blockchain"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Batch Certificate Issuance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              One line per certificate: <code>learnerId,courseName</code>
            </Typography>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {batchResults && (
                <Alert severity="info">
                  {batchResults.filter((r) => r.success).length} succeeded,{" "}
                  {batchResults.filter((r) => !r.success).length} failed
                </Alert>
              )}
              <TextField
                label="Batch (learnerId,courseName per line)"
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                multiline
                rows={12}
                fullWidth
                placeholder="usr_abc123,Web Development&#10;usr_def456,Data Science"
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Template</InputLabel>
                <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} label="Template">
                  <MenuItem value="">— None —</MenuItem>
                  {templates.filter((t) => t.status === "APPROVED").map((t) => (
                    <MenuItem key={t.templateId} value={t.templateId}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={issueBatch} disabled={busy || !batchText.trim()}>
                {busy ? "Issuing..." : "Issue Batch"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Issued Certificates
            </Typography>
            <Stack spacing={1}>
              {certificates.length === 0 ? (
                <Typography color="text.secondary">No certificates yet.</Typography>
              ) : (
                certificates.map((c) => (
                  <Box
                    key={c.certificateId}
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
                      <Typography fontWeight={600}>{c.courseName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.certificateId} • Learner: {c.learnerId}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={c.status} size="small" color={c.status === "ISSUED" ? "success" : "default"} />
                      {c.blockchain?.txHash && (
                        <Typography variant="caption" sx={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.blockchain.txHash}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
