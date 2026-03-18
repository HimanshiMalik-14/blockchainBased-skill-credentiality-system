import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { CheckCircle, Error, QrCode2, Warning } from "@mui/icons-material";
import { api } from "../../shared/api";

type VerifyResponse = {
  result: "VALID" | "INVALID" | "REVOKED" | "NOT_FOUND";
  onChainValid: boolean;
  certificate: null | {
    certificateId: string;
    learnerId: string;
    institutionId: string;
    courseName: string;
    issueDate: string;
    status: string;
    certificateHash: string;
    metadataUri?: string | null;
    pdfUri?: string | null;
    blockchain?: { txHash?: string; contractAddress?: string; blockNumber?: number };
  };
};

export function VerificationPage() {
  const [certificateId, setCertificateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerifyResponse | null>(null);

  async function verify() {
    setBusy(true);
    setError(null);
    setData(null);
    try {
      const res = await api.get<VerifyResponse>(
        `/api/verify/${encodeURIComponent(certificateId.trim())}`
      );
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  const resultConfig = data
    ? {
        VALID: { color: "success" as const, icon: <CheckCircle />, label: "Authentic" },
        INVALID: { color: "error" as const, icon: <Error />, label: "Invalid" },
        REVOKED: { color: "warning" as const, icon: <Warning />, label: "Revoked" },
        NOT_FOUND: { color: "default" as const, icon: <Error />, label: "Not Found" }
      }[data.result]
    : null;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Certificate Verification Portal
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        QR code scanning or certificate ID search. Blockchain verification with real-time authenticity status.
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
              <TextField
                fullWidth
                label="Certificate ID"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="cert_xxxxx or paste from QR scan"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: "flex", alignItems: "center", color: "text.secondary" }}>
                      <QrCode2 fontSize="small" />
                    </Box>
                  )
                }}
              />
              <Button
                variant="contained"
                onClick={verify}
                disabled={busy || !certificateId.trim()}
                sx={{ minWidth: 140 }}
              >
                {busy ? "Verifying..." : "Verify"}
              </Button>
            </Stack>

            {data && resultConfig && (
              <Alert
                severity={resultConfig.color}
                icon={resultConfig.icon}
                sx={{ "& .MuiAlert-message": { width: "100%" } }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography fontWeight={700}>
                    Result: {resultConfig.label} {data.onChainValid && "(On-chain verified)"}
                  </Typography>
                  <Chip label={data.result} color={resultConfig.color} size="small" />
                </Stack>
              </Alert>
            )}

            {data?.certificate && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: "action.hover",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider"
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {data.certificate.courseName}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={0.75}>
                  <Typography variant="body2">
                    <strong>Certificate:</strong> {data.certificate.certificateId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Learner:</strong> {data.certificate.learnerId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Institution:</strong> {data.certificate.institutionId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Issue Date:</strong>{" "}
                    {new Date(data.certificate.issueDate).toLocaleDateString()}
                  </Typography>
                  {data.certificate.blockchain?.txHash && (
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                      <strong>Tx Hash:</strong> {data.certificate.blockchain.txHash}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
