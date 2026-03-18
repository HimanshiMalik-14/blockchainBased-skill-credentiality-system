import React from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import {
  AdminPanelSettings,
  School,
  VerifiedUser,
  ArrowForward
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

const featureCards = [
  {
    title: "Verification Portal",
    description: "Verify certificates instantly by ID or QR scan. Blockchain-backed authenticity check.",
    icon: <VerifiedUser sx={{ fontSize: 48, color: "primary.main" }} />,
    to: "/verify",
    color: "#0f766e"
  },
  {
    title: "Institution Dashboard",
    description: "Issue certificates, upload learner results, batch issuance, and template selection.",
    icon: <School sx={{ fontSize: 48, color: "primary.main" }} />,
    to: "/institution",
    color: "#0d9488"
  },
  {
    title: "Admin Panel",
    description: "Manage institutions, approve templates, monitor credentials, and view analytics.",
    icon: <AdminPanelSettings sx={{ fontSize: 48, color: "primary.main" }} />,
    to: "/admin",
    color: "#14b8a6"
  }
];

export function HomePage() {
  return (
    <Stack spacing={4}>
      <Box
        sx={{
          textAlign: "center",
          py: 6,
          px: 2,
          background: "linear-gradient(135deg, rgba(15,118,110,0.08) 0%, rgba(20,184,166,0.06) 100%)",
          borderRadius: 4
        }}
      >
        <Typography variant="h3" fontWeight={800} color="primary.dark" gutterBottom>
          Blockchain-Based Skill Credentialing
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 640, mx: "auto" }}>
          Issue tamper-proof digital certificates, verify instantly, and ensure lifelong ownership of credentials.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {featureCards.map((card) => (
          <Grid item xs={12} md={4} key={card.to}>
            <Card
              component={RouterLink}
              to={card.to}
              sx={{
                textDecoration: "none",
                color: "inherit",
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(15,118,110,0.15)"
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 2 }}>{card.icon}</Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {card.description}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} color="primary.main">
                    <Typography variant="body2" fontWeight={600}>
                      Open
                    </Typography>
                    <ArrowForward fontSize="small" />
                  </Stack>
                </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
